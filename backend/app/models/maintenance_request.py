from app.extensions import db
from datetime import datetime, timezone
import uuid

VALID_STATUSES = ['Reported', 'Triaged', 'Scheduled', 'Resolved']
VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

class MaintenanceRequest(db.Model):
    __tablename__ = 'maintenance_requests'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    unit_id = db.Column(db.String(36), db.ForeignKey('units.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), nullable=False, default='Medium')
    status = db.Column(db.String(20), nullable=False, default='Reported')
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    unit = db.relationship('Unit', backref='maintenance_requests')

    def to_dict(self):
        return {
            'id': self.id,
            'unit_id': self.unit_id,
            'unit_number': self.unit.unit_number if self.unit else None,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
