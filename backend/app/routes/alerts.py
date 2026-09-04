from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Alert, Unit, Payment
from app.utils.auth_helpers import role_required, get_current_user_id
from datetime import datetime, timezone

alerts_bp = Blueprint('alerts', __name__)

GRACE_PERIOD_DAYS = 5  # days into the month before an unpaid rent triggers an alert


@alerts_bp.route('/generate', methods=['POST'])
@role_required('manager')
def generate_alerts():
    """
    Checks all active units for the current month's rent status.
    Creates an alert if: no payment recorded yet AND we're past the grace period,
    OR a payment was recorded but it was underpaid.
    Won't create a duplicate alert for a unit+month that already has one.
    """
    now = datetime.now(timezone.utc)
    current_month = now.strftime('%Y-%m')

    if now.day <= GRACE_PERIOD_DAYS:
        return jsonify({
            'message': f'Still within grace period (day {now.day} of {GRACE_PERIOD_DAYS}), no alerts generated',
            'created': []
        }), 200

    manager_id = get_current_user_id()
    active_units = Unit.query.filter_by(manager_id=manager_id, is_archived=False).all()
    created_alerts = []

    for unit in active_units:
        existing_alert = Alert.query.filter_by(unit_id=unit.id, month_covered=current_month).first()
        if existing_alert:
            continue  # already has an alert this month, don't duplicate

        payments = Payment.query.filter_by(
            unit_id=unit.id,
            month_covered=current_month,
        ).all()
        monthly_total = sum(float(payment.amount_paid) for payment in payments)
        expected_amount = (
            float(payments[0].expected_amount)
            if payments else float(unit.rent_amount)
        )

        if monthly_total == 0:
            reason = 'no_payment'
        elif monthly_total < expected_amount:
            reason = 'underpaid'
        else:
            continue  # paid in full or overpaid, no alert needed

        alert = Alert(
            unit_id=unit.id,
            month_covered=current_month,
            reason=reason
        )
        db.session.add(alert)
        created_alerts.append(alert)

    db.session.flush()
    result = [a.to_dict() for a in created_alerts]
    db.session.commit()

    return jsonify({
        'message': f'{len(result)} alert(s) generated',
        'created': result
    }), 201


@alerts_bp.route('', methods=['GET'])
@role_required('manager')
def list_alerts():
    show_dismissed = request.args.get('include_dismissed', 'false').lower() == 'true'

    query = Alert.query.join(Unit).filter(Unit.manager_id == get_current_user_id())
    if not show_dismissed:
        query = query.filter(Alert.is_dismissed.is_(False))

    alerts = query.order_by(Alert.created_at.desc()).all()
    return jsonify({'alerts': [a.to_dict() for a in alerts]}), 200


@alerts_bp.route('/<alert_id>/dismiss', methods=['PATCH'])
@role_required('manager')
def dismiss_alert(alert_id):
    alert = Alert.query.get(alert_id)
    if not alert or alert.unit.manager_id != get_current_user_id():
        return jsonify({'error': 'Alert not found'}), 404

    if alert.is_dismissed:
        return jsonify({'error': 'Alert is already dismissed'}), 409

    alert.is_dismissed = True
    alert.dismissed_at = datetime.now(timezone.utc)
    alert.dismissed_by = get_current_user_id()
    db.session.commit()

    return jsonify({'message': 'Alert dismissed', 'alert': alert.to_dict()}), 200
