from flask import Blueprint, jsonify
from app.extensions import db
from app.models import Unit, MaintenanceRequest, Payment
from app.utils.auth_helpers import role_required
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

    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    resolved_this_week = MaintenanceRequest.query.filter(
        MaintenanceRequest.status == 'Resolved',
        MaintenanceRequest.updated_at >= one_week_ago
    ).count()

    current_month = datetime.now(timezone.utc).strftime('%Y-%m')
    underpaid_this_month = Payment.query.filter(
        Payment.month_covered == current_month,
        Payment.match_status == 'underpaid'
    ).count()

    paid_unit_ids_this_month = {
        p.unit_id for p in Payment.query.filter(Payment.month_covered == current_month).all()
    }
    all_active_unit_ids = {u.id for u in Unit.query.filter_by(is_archived=False).all()}
    units_with_no_payment_this_month = len(all_active_unit_ids - paid_unit_ids_this_month)

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
            'by_priority_open_only': requests_by_priority
        },
        'rent': {
            'current_month': current_month,
            'underpaid_count': underpaid_this_month,
            'units_with_no_payment_recorded': units_with_no_payment_this_month
        }
    }), 200
