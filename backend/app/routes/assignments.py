from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Assignment, MaintenanceRequest, User

assignments_bp = Blueprint('assignments', __name__)


def _role_check():
    from app.utils.auth_helpers import get_current_user_role
    return get_current_user_role()


from app.utils.auth_helpers import role_required


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

    contractor = User.query.get(contractor_id)
    if not contractor or contractor.role != 'contractor':
        return jsonify({'error': 'contractor_id must belong to a valid contractor'}), 400

    existing = Assignment.query.filter_by(request_id=request_id, contractor_id=contractor_id).first()
    if existing:
        return jsonify({'error': 'This contractor is already assigned to this request'}), 409

    assignment = Assignment(request_id=request_id, contractor_id=contractor_id)
    db.session.add(assignment)
    db.session.commit()

    return jsonify({'message': 'Contractor assigned', 'assignment': assignment.to_dict()}), 201


@assignments_bp.route('/<assignment_id>', methods=['DELETE'])
@role_required('manager')
def remove_assignment(assignment_id):
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404

    db.session.delete(assignment)
    db.session.commit()
    return jsonify({'message': 'Assignment removed'}), 200


@assignments_bp.route('/request/<request_id>', methods=['GET'])
def list_assignments_for_request(request_id):
    assignments = Assignment.query.filter_by(request_id=request_id).all()
    return jsonify({'assignments': [a.to_dict() for a in assignments]}), 200
