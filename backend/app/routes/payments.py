from flask import Blueprint, request, jsonify, Response
from app.extensions import db
from app.models import Payment, Unit
from app.utils.auth_helpers import role_required, get_current_user_id
import csv
import io

payments_bp = Blueprint('payments', __name__)


def classify_payment(amount_paid, expected_amount):
    if amount_paid == expected_amount:
        return 'matched'
    elif amount_paid < expected_amount:
        return 'underpaid'
    else:
        return 'overpaid'


@payments_bp.route('/bulk', methods=['POST'])
@role_required('manager')
def bulk_record_payments():
    data = request.get_json()
    if not data or 'payments' not in data:
        return jsonify({'error': 'Request body must contain a "payments" array'}), 400

    entries = data['payments']
    if not isinstance(entries, list) or len(entries) == 0:
        return jsonify({'error': 'payments must be a non-empty array'}), 400

    user_id = get_current_user_id()
    results = {'matched': [], 'underpaid': [], 'overpaid': [], 'unmatched': []}
    created_payments = []

    for entry in entries:
        unit_id = entry.get('unit_id')
        amount_paid = entry.get('amount_paid')
        month_covered = entry.get('month_covered')

        if not unit_id or amount_paid is None or not month_covered:
            results['unmatched'].append({
                'unit_id': unit_id,
                'reason': 'Missing unit_id, amount_paid, or month_covered'
            })
            continue

        unit = Unit.query.get(unit_id)
        if not unit:
            results['unmatched'].append({
                'unit_id': unit_id,
                'reason': 'Unit not found'
            })
            continue

        try:
            amount_paid = float(amount_paid)
        except (TypeError, ValueError):
            results['unmatched'].append({
                'unit_id': unit_id,
                'reason': 'amount_paid must be a number'
            })
            continue

        expected_amount = float(unit.rent_amount)
        status = classify_payment(amount_paid, expected_amount)

        payment = Payment(
            unit_id=unit_id,
            amount_paid=amount_paid,
            expected_amount=expected_amount,
            month_covered=month_covered,
            match_status=status,
            recorded_by=user_id
        )
        db.session.add(payment)
        created_payments.append((status, payment))

    db.session.flush()  # assigns IDs and makes relationships available

    for status, payment in created_payments:
        results[status].append(payment.to_dict())

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
    query = Payment.query

    month_filter = request.args.get('month')
    if month_filter:
        query = query.filter(Payment.month_covered == month_filter)

    status_filter = request.args.get('match_status')
    if status_filter:
        query = query.filter(Payment.match_status == status_filter)

    payments = query.order_by(Payment.recorded_at.desc()).all()
    return jsonify({'payments': [p.to_dict() for p in payments]}), 200


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

    units = Unit.query.filter_by(is_archived=False).order_by(Unit.unit_number.asc()).all()

    payments_by_unit = {
        p.unit_id: p
        for p in Payment.query.filter(Payment.month_covered == month_filter).all()
    }

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Unit Number', 'Tenant', 'Month', 'Monthly Rent', 'Amount Paid', 'Status'])

    for unit in units:
        payment = payments_by_unit.get(unit.id)
        if payment:
            amount_paid = float(payment.amount_paid)
            status = payment.match_status
        else:
            amount_paid = 0
            status = 'unpaid'

        writer.writerow([
            unit.unit_number,
            unit.tenant_name or '',
            month_filter,
            float(unit.rent_amount),
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
