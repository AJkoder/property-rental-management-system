from flask import Blueprint, jsonify
from app.extensions import db
from app.models import Unit, MaintenanceRequest, Payment, Assignment, User
from app.utils.auth_helpers import role_required, get_current_user_id
from app.routes.alerts import GRACE_PERIOD_DAYS
from datetime import datetime, timezone, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/summary', methods=['GET'])
@role_required('manager')
def dashboard_summary():
    manager_id = get_current_user_id()
    total_units = Unit.query.filter_by(manager_id=manager_id, is_archived=False).count()
    occupied_units = Unit.query.filter(
        Unit.manager_id == manager_id,
        Unit.is_archived == False,
        Unit.tenant_name.isnot(None)
    ).count()
    vacant_units = total_units - occupied_units

    open_statuses = ['Reported', 'Triaged', 'Scheduled']
    open_requests = MaintenanceRequest.query.filter(
        MaintenanceRequest.unit.has(Unit.manager_id == manager_id),
        MaintenanceRequest.status.in_(open_statuses)
    ).count()

    requests_by_status = dict(
        db.session.query(MaintenanceRequest.status, func.count(MaintenanceRequest.id))
        .join(Unit)
        .filter(Unit.manager_id == manager_id)
        .group_by(MaintenanceRequest.status)
        .all()
    )

    requests_by_priority = dict(
        db.session.query(MaintenanceRequest.priority, func.count(MaintenanceRequest.id))
        .join(Unit)
        .filter(Unit.manager_id == manager_id)
        .filter(MaintenanceRequest.status.in_(open_statuses))
        .group_by(MaintenanceRequest.priority)
        .all()
    )

    requests_by_contractor_raw = (
        db.session.query(User.name, func.count(Assignment.id))
        .join(Assignment, Assignment.contractor_id == User.id)
        .join(MaintenanceRequest, MaintenanceRequest.id == Assignment.request_id)
        .join(Unit, Unit.id == MaintenanceRequest.unit_id)
        .filter(Unit.manager_id == manager_id)
        .filter(MaintenanceRequest.status.in_(open_statuses))
        .group_by(User.name)
        .all()
    )
    requests_by_contractor = dict(requests_by_contractor_raw)

    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    resolved_this_week = MaintenanceRequest.query.filter(
        MaintenanceRequest.unit.has(Unit.manager_id == manager_id),
        MaintenanceRequest.status == 'Resolved',
        MaintenanceRequest.updated_at >= one_week_ago
    ).count()

    resolved_per_week = []
    for i in range(7, -1, -1):
        week_end = datetime.now(timezone.utc) - timedelta(days=7 * i)
        week_start = week_end - timedelta(days=7)
        count = MaintenanceRequest.query.filter(
            MaintenanceRequest.unit.has(Unit.manager_id == manager_id),
            MaintenanceRequest.status == 'Resolved',
            MaintenanceRequest.updated_at >= week_start,
            MaintenanceRequest.updated_at < week_end
        ).count()
        resolved_per_week.append({
            'week_ending': week_end.strftime('%Y-%m-%d'),
            'count': count
        })

    current_month = datetime.now(timezone.utc).strftime('%Y-%m')

    total_collected_this_month = db.session.query(
        func.coalesce(func.sum(Payment.amount_paid), 0)
    ).join(Unit).filter(
        Payment.month_covered == current_month,
        Unit.manager_id == manager_id,
    ).scalar()

    month_payments = Payment.query.join(Unit).filter(
        Payment.month_covered == current_month,
        Unit.manager_id == manager_id,
    ).all()
    paid_by_unit = {}
    expected_by_unit = {}
    for payment in month_payments:
        paid_by_unit[payment.unit_id] = paid_by_unit.get(payment.unit_id, 0) + float(payment.amount_paid)
        expected_by_unit.setdefault(payment.unit_id, float(payment.expected_amount))

    active_units = Unit.query.filter_by(manager_id=manager_id, is_archived=False).all()
    rent_by_unit = {
        unit.id: expected_by_unit.get(unit.id, float(unit.rent_amount))
        for unit in active_units
    }
    underpaid_this_month = sum(
        1 for unit_id, amount_paid in paid_by_unit.items()
        if amount_paid < rent_by_unit.get(unit_id, 0)
    )

    now = datetime.now(timezone.utc)
    if now.day <= GRACE_PERIOD_DAYS:
        units_overdue_this_month = underpaid_this_month
    else:
        paid_unit_ids_this_month = set(paid_by_unit)
        all_active_unit_ids = set(rent_by_unit)
        units_overdue_this_month = len(all_active_unit_ids - paid_unit_ids_this_month) + underpaid_this_month

    return jsonify({
        'units': {
            'total': total_units,
            'occupied': occupied_units,
            'vacant': vacant_units
        },
        'maintenance': {
            'open_requests': open_requests,
            'resolved_this_week': resolved_this_week,
            'by_status': requests_by_status,
            'by_priority_open_only': requests_by_priority,
            'by_contractor_open_only': requests_by_contractor,
            'resolved_per_week_last_8_weeks': resolved_per_week
        },
        'rent': {
            'current_month': current_month,
            'total_collected_this_month': float(total_collected_this_month),
            'underpaid_count': underpaid_this_month,
            'units_overdue_this_month': units_overdue_this_month
        }
    }), 200
