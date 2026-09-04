from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Attachment, Assignment, MaintenanceRequest, StatusHistory, User
from app.utils.auth_helpers import get_current_user_id, get_current_user_role
from flask_jwt_extended import jwt_required
import base64


attachments_bp = Blueprint('attachments', __name__)

MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024  # 3 MB

ALLOWED_CONTENT_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
]


def _assert_can_access_request(req):
    """Contractors may access attachments only on requests assigned to them."""
    if get_current_user_role() == 'manager':
        if req.unit.manager_id != get_current_user_id():
            return jsonify({'error': 'Maintenance request not found'}), 404
        return None
    if get_current_user_role() != 'contractor':
        return None

    is_assigned = Assignment.query.filter_by(
        request_id=req.id,
        contractor_id=get_current_user_id()
    ).first() is not None
    if not is_assigned:
        return jsonify({'error': 'You are not assigned to this request'}), 403
    return None


@attachments_bp.route('/request/<request_id>', methods=['POST'])
@jwt_required()
def upload_attachment(request_id):
    req = MaintenanceRequest.query.get(request_id)

    if not req:
        return jsonify({'error': 'Maintenance request not found'}), 404

    denied = _assert_can_access_request(req)
    if denied:
        return denied

    data = request.get_json()

    if not isinstance(data, dict):
        return jsonify({'error': 'No input data provided'}), 400

    file_name = data.get('file_name', '')
    content_type = data.get('content_type', '')
    file_data = data.get('file_data', '')

    if not isinstance(file_name, str) or not isinstance(content_type, str) or not isinstance(file_data, str):
        return jsonify({'error': 'file_name, content_type, and file_data must be strings'}), 400

    file_name = file_name.strip()
    content_type = content_type.strip()

    if not file_name or not content_type or not file_data:
        return jsonify({'error': 'file_name, content_type, and file_data are required'}), 400

    if content_type not in ALLOWED_CONTENT_TYPES:
        return jsonify({'error': f'content_type must be one of {ALLOWED_CONTENT_TYPES}'}), 400

    try:
        encoded_data = file_data.split(',')[-1]
        decoded_data = base64.b64decode(encoded_data, validate=True)
        decoded_size = len(decoded_data)
    except Exception:
        return jsonify({'error': 'file_data must be valid base64'}), 400

    if decoded_size > MAX_FILE_SIZE_BYTES:
        return jsonify({'error': 'File too large. Maximum size is 3MB'}), 400

    user_id = get_current_user_id()

    attachment = Attachment(
        request_id=request_id,
        file_name=file_name,
        content_type=content_type,
        file_data=file_data,
        uploaded_by=user_id,
    )

    db.session.add(attachment)
    db.session.flush()

    history = StatusHistory(
        request_id=request_id,
        event_type='attachment_added',
        detail=f'Added photo: {file_name}',
        changed_by=user_id
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({
        'message': 'Attachment uploaded',
        'attachment': attachment.to_dict(),
    }), 201


@attachments_bp.route('/request/<request_id>', methods=['GET'])
@jwt_required()
def list_attachments(request_id):
    req = MaintenanceRequest.query.get(request_id)

    if not req:
        return jsonify({'error': 'Maintenance request not found'}), 404

    denied = _assert_can_access_request(req)
    if denied:
        return denied

    attachments = (
        Attachment.query
        .filter_by(request_id=request_id)
        .order_by(Attachment.uploaded_at.desc())
        .all()
    )

    # Do NOT include file_data here.
    # The frontend fetches each image's data separately via GET /<attachment_id>.
    return jsonify({
        'attachments': [a.to_dict() for a in attachments]
    }), 200


@attachments_bp.route('/<attachment_id>', methods=['GET'])
@jwt_required()
def get_attachment(attachment_id):
    attachment = Attachment.query.get(attachment_id)

    if not attachment:
        return jsonify({'error': 'Attachment not found'}), 404

    req = MaintenanceRequest.query.get(attachment.request_id)
    denied = _assert_can_access_request(req)
    if denied:
        return denied

    return jsonify({
        'attachment': attachment.to_dict(include_data=True)
    }), 200


@attachments_bp.route('/<attachment_id>', methods=['DELETE'])
@jwt_required()
def delete_attachment(attachment_id):
    attachment = Attachment.query.get(attachment_id)

    if not attachment:
        return jsonify({'error': 'Attachment not found'}), 404

    user_id = get_current_user_id()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    req = MaintenanceRequest.query.get(attachment.request_id)
    denied = _assert_can_access_request(req)
    if denied:
        return denied

    # Managers can delete any attachment.
    # Contractors can delete only attachments they uploaded.
    if user.role != 'manager' and attachment.uploaded_by != user_id:
        return jsonify({'error': 'You are not allowed to delete this attachment'}), 403

    db.session.delete(attachment)

    history = StatusHistory(
        request_id=attachment.request_id,
        event_type='attachment_removed',
        detail=f'Removed photo: {attachment.file_name}',
        changed_by=user_id
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({'message': 'Attachment deleted'}), 200
