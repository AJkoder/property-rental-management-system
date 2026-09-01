from app.extensions import db
from datetime import datetime, timezone
import uuid

class StatusHistory(db.Model):
    __tablename__ = 'status_history'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = db.Column(db.String(36), db.ForeignKey('maintenance_requests.id'), nullable=False)
    old_status = db.Column(db.String(20), nullable=True)
    new_status = db.Column(db.String(20), nullable=False)
    changed_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    changed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    changed_by_user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'changed_by': self.changed_by,
            'changed_by_name': self.changed_by_user.name if self.changed_by_user else None,
            'changed_at': self.changed_at.isoformat()
        }
