from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Attachment, MaintenanceRequest, StatusHistory
from app.utils.auth_helpers import get_current_user_id
from flask_jwt_extended import jwt_required
import base64

attachments_bp = Blueprint('attachments', __name__)

MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024  # 3MB cap, since we're storing as base64 in the DB
ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']


@attachments_bp.route('/request/<request_id>', methods=['POST'])
@jwt_required()
def upload_attachment(request_id):
    req = MaintenanceRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Maintenance request not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    file_name = data.get('file_name', '').strip()
    content_type = data.get('content_type', '').strip()
    file_data = data.get('file_data', '')

    if not file_name or not content_type or not file_data:
        return jsonify({'error': 'file_name, content_type, and file_data are required'}), 400

    if content_type not in ALLOWED_CONTENT_TYPES:
        return jsonify({'error': f'content_type must be one of {ALLOWED_CONTENT_TYPES}'}), 400

    try:
        decoded_size = len(base64.b64decode(file_data.split(',')[-1]))
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
        uploaded_by=user_id
    )
    db.session.add(attachment)

    history = StatusHistory(
        request_id=request_id,
        event_type='attachment_added',
        detail=f'Added photo: {file_name}',
        changed_by=user_id
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({'message': 'Attachment uploaded', 'attachment': attachment.to_dict()}), 201


@attachments_bp.route('/request/<request_id>', methods=['GET'])
@jwt_required()
def list_attachments(request_id):
    attachments = Attachment.query.filter_by(request_id=request_id).order_by(Attachment.uploaded_at.desc()).all()
    return jsonify({'attachments': [a.to_dict() for a in attachments]}), 200


@attachments_bp.route('/<attachment_id>', methods=['GET'])
@jwt_required()
def get_attachment(attachment_id):
    attachment = Attachment.query.get(attachment_id)
    if not attachment:
        return jsonify({'error': 'Attachment not found'}), 404
    return jsonify({'attachment': attachment.to_dict(include_data=True)}), 200