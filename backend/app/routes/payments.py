from flask import Blueprint, request, jsonify, Response
from app.extensions import db
from app.models import Alert, Payment, Unit
from app.utils.auth_helpers import role_required, get_current_user_id
import csv
import io
import math
from datetime import datetime

payments_bp = Blueprint('payments', __name__)


def classify_payment(amount_paid, expected_amount):
    if amount_paid == expected_amount:
        return 'matched'
    elif amount_paid < expected_amount:
        return 'underpaid'
    else:
        return 'overpaid'


def is_valid_month(value):
    if not isinstance(value, str):
        return False
    try:
        return datetime.strptime(value, '%Y-%m').strftime('%Y-%m') == value
    except ValueError:
        return False


@payments_bp.route('/bulk', methods=['POST'])
@role_required('manager')
def bulk_record_payments():
    data = request.get_json()
    if not isinstance(data, dict) or 'payments' not in data:
        return jsonify({'error': 'Request body must contain a "payments" array'}), 400

    entries = data['payments']
    if not isinstance(entries, list) or len(entries) == 0:
        return jsonify({'error': 'payments must be a non-empty array'}), 400

    user_id = get_current_user_id()
    results = {'matched': [], 'underpaid': [], 'overpaid': [], 'unmatched': []}
    created_payments = []

    for entry in entries:
        if not isinstance(entry, dict):
            results['unmatched'].append({'unit_id': None, 'reason': 'Each payment must be an object'})
            continue

        unit_id = entry.get('unit_id')
        amount_paid = entry.get('amount_paid')
        month_covered = entry.get('month_covered')

        if not unit_id or amount_paid is None or not month_covered:
            results['unmatched'].append({
                'unit_id': unit_id,
                'reason': 'Missing unit_id, amount_paid, or month_covered'
            })
            continue

        unit = db.session.get(Unit, unit_id)
        if not unit or unit.manager_id != user_id:
            results['unmatched'].append({
                'unit_id': unit_id,
                'reason': 'Unit not found'
            })
            continue

        if not is_valid_month(month_covered):
            results['unmatched'].append({
                'unit_id': unit_id,
                'reason': 'month_covered must use YYYY-MM format'
            })
            continue

        try:
            amount_paid = float(amount_paid)
            if not math.isfinite(amount_paid) or amount_paid < 0:
                raise ValueError
        except (TypeError, ValueError):
            results['unmatched'].append({
                'unit_id': unit_id,
                'reason': 'amount_paid must be a non-negative number'
            })
            continue

        existing_payments = Payment.query.filter_by(
            unit_id=unit_id,
            month_covered=month_covered,
        ).all()
        # The first payment for a month snapshots that month's agreed rent.
        # A later rent change must not reclassify an already-recorded month.
        expected_amount = (
            float(existing_payments[0].expected_amount)
            if existing_payments else float(unit.rent_amount)
        )
        monthly_total = sum(float(payment.amount_paid) for payment in existing_payments) + amount_paid
        status = classify_payment(monthly_total, expected_amount)

        # Every installment reflects the current balance for its rent month.
        # This keeps history, filters, alerts, and dashboards consistent after a
        # tenant completes a partial payment later in the same month.
        for existing_payment in existing_payments:
            existing_payment.match_status = status

        active_alert = Alert.query.filter_by(
            unit_id=unit_id,
            month_covered=month_covered,
            is_dismissed=False,
        ).first()
        if status == 'underpaid' and active_alert:
            active_alert.reason = 'underpaid'
        elif status != 'underpaid' and active_alert:
            db.session.delete(active_alert)

        payment = Payment(
            unit_id=unit_id,
            amount_paid=amount_paid,
            expected_amount=expected_amount,
            month_covered=month_covered,
            match_status=status,
            recorded_by=user_id
        )
        db.session.add(payment)
        created_payments.append(payment)

    db.session.flush()  # assigns IDs and makes relationships available

    for payment in created_payments:
        results[payment.match_status].append(payment.to_dict())

    db.session.commit()

    summary = {k: len(v) for k, v in results.items()}

    return jsonify({
        'message': 'Bulk payment recording complete',
        'summary': summary,
        'details': results
    }), 201


@payments_bp.route('', methods=['GET'])
@role_required('manager')
def list_payments():
    query = Payment.query.join(Unit).filter(Unit.manager_id == get_current_user_id())

    month_filter = request.args.get('month')
    if month_filter:
        query = query.filter(Payment.month_covered == month_filter)

    payments = query.order_by(Payment.recorded_at.desc()).all()
    monthly_totals = {}
    monthly_expected = {}
    for payment in payments:
        key = (payment.unit_id, payment.month_covered)
        monthly_totals[key] = monthly_totals.get(key, 0) + float(payment.amount_paid)
        monthly_expected.setdefault(key, float(payment.expected_amount))

    status_filter = request.args.get('match_status')
    result = []
    for payment in payments:
        key = (payment.unit_id, payment.month_covered)
        record = payment.to_dict()
        # Always derive the display status from the full month. This makes old
        # records correct even before the data migration has run.
        record['match_status'] = classify_payment(
            monthly_totals[key], monthly_expected[key]
        )
        if not status_filter or record['match_status'] == status_filter:
            result.append(record)

    return jsonify({'payments': result}), 200


@payments_bp.route('/export', methods=['GET'])
@role_required('manager')
def export_csv():
    """
    Exports the current rent roll: one row per active unit, showing its
    tenant, monthly rent, and this month's payment status (or 'unpaid' if
    no payment has been recorded yet). Optionally filtered by month
    (defaults to the current month if not provided).
    """
    from datetime import datetime, timezone

    month_filter = request.args.get('month') or datetime.now(timezone.utc).strftime('%Y-%m')

    manager_id = get_current_user_id()
    units = Unit.query.filter_by(manager_id=manager_id, is_archived=False).order_by(Unit.unit_number.asc()).all()

    payments_by_unit = {}
    expected_by_unit = {}
    for payment in Payment.query.join(Unit).filter(
            Payment.month_covered == month_filter,
            Unit.manager_id == manager_id,
        ).all():
        payments_by_unit[payment.unit_id] = payments_by_unit.get(payment.unit_id, 0) + float(payment.amount_paid)
        expected_by_unit.setdefault(payment.unit_id, float(payment.expected_amount))

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Unit Number', 'Tenant', 'Month', 'Monthly Rent', 'Amount Paid', 'Status'])

    for unit in units:
        amount_paid = payments_by_unit.get(unit.id, 0)
        expected_amount = expected_by_unit.get(unit.id, float(unit.rent_amount))
        if amount_paid:
            status = classify_payment(amount_paid, expected_amount)
        else:
            status = 'unpaid'

        writer.writerow([
            unit.unit_number,
            unit.tenant_name or '',
            month_filter,
            expected_amount,
            amount_paid,
            status
        ])

    csv_data = output.getvalue()
    output.close()

    return Response(
        csv_data,
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename=rent_roll_{month_filter}.csv'}
    )
