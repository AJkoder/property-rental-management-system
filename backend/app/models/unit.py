from app.extensions import db
from datetime import datetime, timezone
import uuid

class Unit(db.Model):
    __tablename__ = 'units'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    manager_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    unit_number = db.Column(db.String(50), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    rent_amount = db.Column(db.Numeric(10, 2), nullable=False)
    tenant_name = db.Column(db.String(120), nullable=True)
    is_archived = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    manager = db.relationship('User', backref='managed_units')

    def to_dict(self):
        return {
            'id': self.id,
            'unit_number': self.unit_number,
            'address': self.address,
            'rent_amount': float(self.rent_amount),
            'tenant_name': self.tenant_name,
            'is_archived': self.is_archived,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
