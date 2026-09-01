from app.extensions import db
from datetime import datetime, timezone
import uuid

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    unit_id = db.Column(db.String(36), db.ForeignKey('units.id'), nullable=False)
    amount_paid = db.Column(db.Numeric(10, 2), nullable=False)
    expected_amount = db.Column(db.Numeric(10, 2), nullable=False)
    month_covered = db.Column(db.String(7), nullable=False)
    match_status = db.Column(db.String(20), nullable=False)
    recorded_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    recorded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    unit = db.relationship('Unit', backref='payments')

    def __init__(self, **kwargs):
        if 'recorded_at' not in kwargs:
            kwargs['recorded_at'] = datetime.now(timezone.utc)
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'unit_id': self.unit_id,
            'unit_number': self.unit.unit_number if self.unit else None,
            'amount_paid': float(self.amount_paid),
            'expected_amount': float(self.expected_amount),
            'month_covered': self.month_covered,
            'match_status': self.match_status,
            'recorded_by': self.recorded_by,
            'recorded_at': self.recorded_at.isoformat()
        }
