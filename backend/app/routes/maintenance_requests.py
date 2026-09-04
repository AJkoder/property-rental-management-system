from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import MaintenanceRequest, Unit, Assignment, StatusHistory
from app.utils.auth_helpers import role_required, get_current_user_id, get_current_user_role
from app.utils.status_rules import is_transition_allowed, check_scheduling_requirements, VALID_STATUSES
from flask_jwt_extended import jwt_required

requests_bp = Blueprint('requests', __name__)

VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
VALID_SORT_FIELDS = ['created_at', 'updated_at', 'priority', 'status']


def _assert_contractor_assigned(req):
    """Returns a (response, status) tuple to short-circuit with if the current
    user is a contractor who isn't assigned to this request. Returns None if
    the caller is allowed to proceed (managers always pass; contractors only
    pass if assigned)."""
    role = get_current_user_role()
    if role != 'contractor':
        return None
    user_id = get_current_user_id()
    is_assigned = Assignment.query.filter_by(request_id=req.id, contractor_id=user_id).first() is not None
    if not is_assigned:
        return jsonify({'error': 'You are not assigned to this request'}), 403
    return None


@requests_bp.route('', methods=['POST'])
@jwt_required()
def create_request():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    unit_id = data.get('unit_id')
    description = data.get('description', '').strip()
    priority = data.get('priority', 'Medium')

    if not unit_id or not description:
        return jsonify({'error': 'unit_id and description are required'}), 400

    if priority not in VALID_PRIORITIES:
        return jsonify({'error': f'priority must be one of {VALID_PRIORITIES}'}), 400

    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404

    user_id = get_current_user_id()

    req = MaintenanceRequest(
        unit_id=unit_id,
        description=description,
        priority=priority,
        status='Reported',
        created_by=user_id
    )
    db.session.add(req)
    db.session.flush()

    history = StatusHistory(
        request_id=req.id,
        old_status=None,
        new_status='Reported',
        changed_by=user_id
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({'message': 'Maintenance request created', 'request': req.to_dict()}), 201


@requests_bp.route('', methods=['GET'])
@jwt_required()
def list_requests():
    role = get_current_user_role()
    user_id = get_current_user_id()

    query = MaintenanceRequest.query

    # Use EXISTS rather than joining the assignments table. This keeps one row per
    # request and makes the contractor visibility rule apply before any optional
    # contractor filter is added below.
    if role == 'contractor':
        query = query.filter(
            MaintenanceRequest.assignments.any(Assignment.contractor_id == user_id)
        )

    status_filter = request.args.get('status')
    if status_filter:
        if status_filter not in VALID_STATUSES:
            return jsonify({'error': f'status must be one of {VALID_STATUSES}'}), 400
        query = query.filter(MaintenanceRequest.status == status_filter)

    priority_filter = request.args.get('priority')
    if priority_filter:
        if priority_filter not in VALID_PRIORITIES:
            return jsonify({'error': f'priority must be one of {VALID_PRIORITIES}'}), 400
        query = query.filter(MaintenanceRequest.priority == priority_filter)

    unit_id_filter = request.args.get('unit_id')
    if unit_id_filter:
        query = query.filter(MaintenanceRequest.unit_id == unit_id_filter)

    contractor_filter = request.args.get('contractor_id')
    if contractor_filter:
        query = query.filter(
            MaintenanceRequest.assignments.any(
                Assignment.contractor_id == contractor_filter
            )
        )

    search = request.args.get('search')
    if search:
        query = query.filter(MaintenanceRequest.description.ilike(f'%{search}%'))

    sort_by = request.args.get('sort_by', 'created_at')
    if sort_by not in VALID_SORT_FIELDS:
        return jsonify({'error': f'sort_by must be one of {VALID_SORT_FIELDS}'}), 400

    sort_order = request.args.get('sort_order', 'desc')
    sort_column = getattr(MaintenanceRequest, sort_by)
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    try:
        page = max(1, int(request.args.get('page', 1)))
        per_page = min(100, max(1, int(request.args.get('per_page', 10))))
    except ValueError:
        return jsonify({'error': 'page and per_page must be integers'}), 400

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'requests': [r.to_dict() for r in items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': (total + per_page - 1) // per_page
        }
    }), 200


@requests_bp.route('/<request_id>', methods=['GET'])
@jwt_required()
def get_request(request_id):
    req = MaintenanceRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    denied = _assert_contractor_assigned(req)
    if denied:
        return denied

    return jsonify({'request': req.to_dict()}), 200


@requests_bp.route('/<request_id>', methods=['PUT'])
@jwt_required()
def update_request(request_id):
    req = MaintenanceRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    denied = _assert_contractor_assigned(req)
    if denied:
        return denied

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    if 'description' in data:
        description = data['description'].strip()
        if not description:
            return jsonify({'error': 'description cannot be empty'}), 400
        req.description = description

    if 'priority' in data:
        if data['priority'] not in VALID_PRIORITIES:
            return jsonify({'error': f'priority must be one of {VALID_PRIORITIES}'}), 400
        req.priority = data['priority']

    db.session.commit()
    return jsonify({'message': 'Request updated', 'request': req.to_dict()}), 200


@requests_bp.route('/<request_id>/status', methods=['PATCH'])
@jwt_required()
def update_status(request_id):
    req = MaintenanceRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    denied = _assert_contractor_assigned(req)
    if denied:
        return denied

    data = request.get_json()
    new_status = data.get('status') if data else None

    if not new_status:
        return jsonify({'error': 'status is required'}), 400

    allowed, error_msg = is_transition_allowed(req.status, new_status)
    if not allowed:
        return jsonify({'error': error_msg}), 400

    has_contractor = Assignment.query.filter_by(request_id=req.id).count() > 0
    allowed, error_msg = check_scheduling_requirements(new_status, has_contractor)
    if not allowed:
        return jsonify({'error': error_msg}), 400

    old_status = req.status
    req.status = new_status

    history = StatusHistory(
        request_id=req.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=get_current_user_id()
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({
        'message': f'Status changed from {old_status} to {new_status}',
        'request': req.to_dict()
    }), 200


@requests_bp.route('/<request_id>/timeline', methods=['GET'])
@jwt_required()
def get_timeline(request_id):
    req = MaintenanceRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    denied = _assert_contractor_assigned(req)
    if denied:
        return denied

    history = StatusHistory.query.filter_by(request_id=request_id).order_by(StatusHistory.changed_at.asc()).all()
    return jsonify({'timeline': [h.to_dict() for h in history]}), 200


@requests_bp.route('/<request_id>/notes', methods=['POST'])
@jwt_required()
def add_note(request_id):
    """Append a human note to a request's immutable timeline."""
    req = MaintenanceRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    denied = _assert_contractor_assigned(req)
    if denied:
        return denied

    data = request.get_json()
    note = data.get('note', '').strip() if isinstance(data, dict) else ''
    if not note:
        return jsonify({'error': 'note is required'}), 400
    if len(note) > 255:
        return jsonify({'error': 'note must be 255 characters or fewer'}), 400

    history = StatusHistory(
        request_id=req.id,
        event_type='note_added',
        detail=note,
        changed_by=get_current_user_id()
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({'message': 'Note added', 'timeline_entry': history.to_dict()}), 201
