from app.extensions import db
from datetime import datetime, timezone
import uuid

class Attachment(db.Model):
    __tablename__ = 'attachments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = db.Column(db.String(36), db.ForeignKey('maintenance_requests.id'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(100), nullable=False)
    file_data = db.Column(db.Text, nullable=False)  # base64-encoded image data
    uploaded_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    uploaded_by_user = db.relationship('User')

    def to_dict(self, include_data=False):
        result = {
            'id': self.id,
            'request_id': self.request_id,
            'file_name': self.file_name,
            'content_type': self.content_type,
            'uploaded_by': self.uploaded_by,
            'uploaded_by_name': self.uploaded_by_user.name if self.uploaded_by_user else None,
            'uploaded_at': self.uploaded_at.isoformat()
        }

        if include_data:
            result['file_data'] = self.file_data

        return result