from flask import Blueprint, jsonify
from app.extensions import db
from app.models import Unit, MaintenanceRequest, Payment, Assignment, User
from app.utils.auth_helpers import role_required
from app.routes.alerts import GRACE_PERIOD_DAYS
from datetime import datetime, timezone, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/summary', methods=['GET'])
@role_required('manager')
def dashboard_summary():
    total_units = Unit.query.filter_by(is_archived=False).count()
    occupied_units = Unit.query.filter(
        Unit.is_archived == False,
        Unit.tenant_name.isnot(None)
    ).count()
    vacant_units = total_units - occupied_units

    open_statuses = ['Reported', 'Triaged', 'Scheduled']
    open_requests = MaintenanceRequest.query.filter(
        MaintenanceRequest.status.in_(open_statuses)
    ).count()

    requests_by_status = dict(
        db.session.query(MaintenanceRequest.status, func.count(MaintenanceRequest.id))
        .group_by(MaintenanceRequest.status)
        .all()
    )

    requests_by_priority = dict(
        db.session.query(MaintenanceRequest.priority, func.count(MaintenanceRequest.id))
        .filter(MaintenanceRequest.status.in_(open_statuses))
        .group_by(MaintenanceRequest.priority)
        .all()
    )

    requests_by_contractor_raw = (
        db.session.query(User.name, func.count(Assignment.id))
        .join(Assignment, Assignment.contractor_id == User.id)
        .join(MaintenanceRequest, MaintenanceRequest.id == Assignment.request_id)
        .filter(MaintenanceRequest.status.in_(open_statuses))
        .group_by(User.name)
        .all()
    )
    requests_by_contractor = dict(requests_by_contractor_raw)

    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    resolved_this_week = MaintenanceRequest.query.filter(
        MaintenanceRequest.status == 'Resolved',
        MaintenanceRequest.updated_at >= one_week_ago
    ).count()

    resolved_per_week = []
    for i in range(7, -1, -1):
        week_end = datetime.now(timezone.utc) - timedelta(days=7 * i)
        week_start = week_end - timedelta(days=7)
        count = MaintenanceRequest.query.filter(
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
    ).filter(Payment.month_covered == current_month).scalar()

    underpaid_this_month = Payment.query.filter(
        Payment.month_covered == current_month,
        Payment.match_status == 'underpaid'
    ).count()

    now = datetime.now(timezone.utc)
    if now.day <= GRACE_PERIOD_DAYS:
        units_overdue_this_month = underpaid_this_month
    else:
        paid_unit_ids_this_month = {
            p.unit_id for p in Payment.query.filter(Payment.month_covered == current_month).all()
        }
        all_active_unit_ids = {u.id for u in Unit.query.filter_by(is_archived=False).all()}
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
