from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import MaintenanceRequest, Unit, Assignment
from app.utils.auth_helpers import role_required, get_current_user_id, get_current_user_role
from app.utils.status_rules import is_transition_allowed, check_scheduling_requirements, VALID_STATUSES
from flask_jwt_extended import jwt_required

requests_bp = Blueprint('requests', __name__)

VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']


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
    db.session.commit()

    return jsonify({'message': 'Maintenance request created', 'request': req.to_dict()}), 201


@requests_bp.route('', methods=['GET'])
@jwt_required()
def list_requests():
    role = get_current_user_role()
    user_id = get_current_user_id()

    query = MaintenanceRequest.query

    # Contractors only see requests they're assigned to
    if role == 'contractor':
        query = query.join(Assignment).filter(Assignment.contractor_id == user_id)

    status_filter = request.args.get('status')
    if status_filter:
        query = query.filter(MaintenanceRequest.status == status_filter)

    requests_list = query.order_by(MaintenanceRequest.created_at.desc()).all()
    return jsonify({'requests': [r.to_dict() for r in requests_list]}), 200


@requests_bp.route('/<request_id>', methods=['GET'])
@jwt_required()
def get_request(request_id):
    req = MaintenanceRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404
    return jsonify({'request': req.to_dict()}), 200


@requests_bp.route('/<request_id>/status', methods=['PATCH'])
@jwt_required()
def update_status(request_id):
    req = MaintenanceRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

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
    db.session.commit()

    return jsonify({
        'message': f'Status changed from {old_status} to {new_status}',
        'request': req.to_dict()
    }), 200
