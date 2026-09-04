from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Assignment, MaintenanceRequest, User, StatusHistory
from app.utils.auth_helpers import role_required, get_current_user_id, get_current_user_role
from flask_jwt_extended import jwt_required

assignments_bp = Blueprint('assignments', __name__)


@assignments_bp.route('', methods=['POST'])
@role_required('manager')
def assign_contractor():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    request_id = data.get('request_id')
    contractor_id = data.get('contractor_id')

    if not request_id or not contractor_id:
        return jsonify({'error': 'request_id and contractor_id are required'}), 400

    req = MaintenanceRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Maintenance request not found'}), 404
    if req.unit.manager_id != get_current_user_id():
        return jsonify({'error': 'Maintenance request not found'}), 404

    contractor = User.query.get(contractor_id)
    if not contractor or contractor.role != 'contractor':
        return jsonify({'error': 'contractor_id must belong to a valid contractor'}), 400

    existing = Assignment.query.filter_by(request_id=request_id, contractor_id=contractor_id).first()
    if existing:
        return jsonify({'error': 'This contractor is already assigned to this request'}), 409

    assignment = Assignment(request_id=request_id, contractor_id=contractor_id)
    db.session.add(assignment)

    history = StatusHistory(
        request_id=request_id,
        event_type='assignment_added',
        detail=f'Assigned {contractor.name}',
        changed_by=get_current_user_id()
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({'message': 'Contractor assigned', 'assignment': assignment.to_dict()}), 201


@assignments_bp.route('/<assignment_id>', methods=['DELETE'])
@role_required('manager')
def remove_assignment(assignment_id):
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    if assignment.request.unit.manager_id != get_current_user_id():
        return jsonify({'error': 'Assignment not found'}), 404

    contractor_name = assignment.contractor.name if assignment.contractor else 'contractor'
    request_id = assignment.request_id

    # A scheduled request must keep at least one assignee. Otherwise a manager
    # could satisfy the scheduling check and immediately leave it unassigned.
    if assignment.request.status == 'Scheduled' and len(assignment.request.assignments) == 1:
        return jsonify({
            'error': 'Cannot remove the last contractor from a scheduled request. Move it back to Triaged first.'
        }), 400

    db.session.delete(assignment)

    history = StatusHistory(
        request_id=request_id,
        event_type='assignment_removed',
        detail=f'Removed {contractor_name}',
        changed_by=get_current_user_id()
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({'message': 'Assignment removed'}), 200


@assignments_bp.route('/request/<request_id>', methods=['GET'])
@jwt_required()
def list_assignments_for_request(request_id):
    req = MaintenanceRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Maintenance request not found'}), 404

    if get_current_user_role() == 'manager' and req.unit.manager_id != get_current_user_id():
        return jsonify({'error': 'Maintenance request not found'}), 404
    if get_current_user_role() == 'contractor':
        user_id = get_current_user_id()
        is_assigned = Assignment.query.filter_by(
            request_id=request_id,
            contractor_id=user_id
        ).first() is not None
        if not is_assigned:
            return jsonify({'error': 'You are not assigned to this request'}), 403

    assignments = Assignment.query.filter_by(request_id=request_id).all()
    return jsonify({'assignments': [a.to_dict() for a in assignments]}), 200
