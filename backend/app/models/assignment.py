from app.extensions import db
from datetime import datetime, timezone
import uuid

class Assignment(db.Model):
    __tablename__ = 'assignments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = db.Column(db.String(36), db.ForeignKey('maintenance_requests.id'), nullable=False)
    contractor_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    contractor = db.relationship('User', backref='assignments')
    request = db.relationship('MaintenanceRequest', backref='assignments')

    __table_args__ = (
        db.UniqueConstraint('request_id', 'contractor_id', name='uq_request_contractor'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'contractor_id': self.contractor_id,
            'contractor_name': self.contractor.name if self.contractor else None,
            'assigned_at': self.assigned_at.isoformat()
        }
