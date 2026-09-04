"""Starter data for a newly created manager portfolio."""
from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models import Assignment, MaintenanceRequest, Payment, StatusHistory, Unit, User


DEMO_MANAGER_EMAIL = 'manager@test.com'
DEMO_CONTRACTOR_EMAIL = 'ramesh@test.com'


def create_manager_demo_data(manager_id):
    """Create a small, coherent portfolio so a new manager can explore the app."""
    now = datetime.now(timezone.utc)
    month = now.strftime('%Y-%m')
    units = [
        Unit(manager_id=manager_id, unit_number='A-101', address='12 Park View Road', rent_amount=18500, tenant_name='Ananya Sharma'),
        Unit(manager_id=manager_id, unit_number='A-102', address='12 Park View Road', rent_amount=18500, tenant_name='Rahul Mehta'),
        Unit(manager_id=manager_id, unit_number='B-201', address='12 Park View Road', rent_amount=22000, tenant_name='Priya Nair'),
        Unit(manager_id=manager_id, unit_number='B-202', address='12 Park View Road', rent_amount=22000, tenant_name='Arjun Kapoor'),
        Unit(manager_id=manager_id, unit_number='C-301', address='12 Park View Road', rent_amount=26500, tenant_name=None),
    ]
    db.session.add_all(units)
    db.session.flush()

    payments = [
        Payment(unit_id=units[0].id, amount_paid=18500, expected_amount=18500, month_covered=month, match_status='matched', recorded_by=manager_id),
        Payment(unit_id=units[1].id, amount_paid=18500, expected_amount=18500, month_covered=month, match_status='matched', recorded_by=manager_id),
        Payment(unit_id=units[2].id, amount_paid=18000, expected_amount=22000, month_covered=month, match_status='underpaid', recorded_by=manager_id),
        Payment(unit_id=units[3].id, amount_paid=22000, expected_amount=22000, month_covered=month, match_status='matched', recorded_by=manager_id),
    ]
    db.session.add_all(payments)

    request_specs = [
        (units[0], 'Kitchen sink is leaking under the cabinet.', 'High', 'Reported', now - timedelta(days=1)),
        (units[1], 'Bedroom ceiling fan makes a grinding noise.', 'Medium', 'Triaged', now - timedelta(days=3)),
        (units[2], 'Bathroom exhaust fan replacement scheduled.', 'Low', 'Scheduled', now - timedelta(days=5)),
        (units[3], 'Balcony door lock repaired.', 'Low', 'Resolved', now - timedelta(days=7)),
    ]
    for unit, description, priority, status, created_at in request_specs:
        maintenance_request = MaintenanceRequest(
            unit_id=unit.id,
            description=description,
            priority=priority,
            status=status,
            created_by=manager_id,
            created_at=created_at,
            updated_at=created_at,
        )
        db.session.add(maintenance_request)
        db.session.flush()
        db.session.add(StatusHistory(
            request_id=maintenance_request.id,
            old_status=None,
            new_status='Reported',
            changed_by=manager_id,
            changed_at=created_at,
        ))
        if status != 'Reported':
            db.session.add(StatusHistory(
                request_id=maintenance_request.id,
                old_status='Reported',
                new_status=status,
                changed_by=manager_id,
                changed_at=created_at + timedelta(hours=2),
            ))


def ensure_documented_demo_data():
    """Populate the credentials published in SUBMISSION.md without duplicates."""
    manager = User.query.filter_by(email=DEMO_MANAGER_EMAIL, role='manager').first()
    contractor = User.query.filter_by(email=DEMO_CONTRACTOR_EMAIL, role='contractor').first()

    if not manager:
        return

    if not Unit.query.filter_by(manager_id=manager.id).first():
        create_manager_demo_data(manager.id)
        db.session.flush()

    if not contractor:
        return

    requests = (
        MaintenanceRequest.query
        .join(Unit)
        .filter(
            Unit.manager_id == manager.id,
            MaintenanceRequest.status.in_(['Reported', 'Triaged', 'Scheduled']),
        )
        .order_by(MaintenanceRequest.created_at.asc())
        .limit(2)
        .all()
    )
    for maintenance_request in requests:
        if Assignment.query.filter_by(
            request_id=maintenance_request.id,
            contractor_id=contractor.id,
        ).first():
            continue
        db.session.add(Assignment(
            request_id=maintenance_request.id,
            contractor_id=contractor.id,
        ))
        db.session.add(StatusHistory(
            request_id=maintenance_request.id,
            event_type='assignment_added',
            detail=f'Assigned {contractor.name}',
            changed_by=manager.id,
        ))
