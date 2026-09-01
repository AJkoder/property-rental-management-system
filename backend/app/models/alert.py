from app.extensions import db
from datetime import datetime, timezone
import uuid

class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    unit_id = db.Column(db.String(36), db.ForeignKey('units.id'), nullable=False)
    month_covered = db.Column(db.String(7), nullable=False)  # 'YYYY-MM' - which month this alert is about
    reason = db.Column(db.String(50), nullable=False)  # 'no_payment' or 'underpaid'
    is_dismissed = db.Column(db.Boolean, default=False, nullable=False)
    dismissed_at = db.Column(db.DateTime, nullable=True)
    dismissed_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    unit = db.relationship('Unit', backref='alerts')

    __table_args__ = (
        db.UniqueConstraint('unit_id', 'month_covered', name='uq_unit_month_alert'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'unit_id': self.unit_id,
            'unit_number': self.unit.unit_number if self.unit else None,
            'month_covered': self.month_covered,
            'reason': self.reason,
            'is_dismissed': self.is_dismissed,
            'dismissed_at': self.dismissed_at.isoformat() if self.dismissed_at else None,
            'created_at': self.created_at.isoformat()
        }
