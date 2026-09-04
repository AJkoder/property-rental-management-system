"""reconcile monthly payment statuses

Revision ID: 61fd1d44a8c7
Revises: 15329ca5f3c5
Create Date: 2026-09-04 22:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '61fd1d44a8c7'
down_revision = '15329ca5f3c5'
branch_labels = None
depends_on = None


def upgrade():
    """Repair legacy statuses using each unit/month's payment total.

    `expected_amount` is a monthly snapshot stored on every payment.  It is
    deliberately used instead of the unit's current rent so historical rent
    changes do not alter past payment records.
    """
    bind = op.get_bind()
    metadata = sa.MetaData()
    payments = sa.Table('payments', metadata, autoload_with=bind)
    alerts = sa.Table('alerts', metadata, autoload_with=bind)

    rows = bind.execute(sa.select(
        payments.c.id,
        payments.c.unit_id,
        payments.c.month_covered,
        payments.c.amount_paid,
        payments.c.expected_amount,
    )).mappings().all()

    totals = {}
    expected = {}
    for row in rows:
        key = (row['unit_id'], row['month_covered'])
        totals[key] = totals.get(key, 0) + row['amount_paid']
        expected.setdefault(key, row['expected_amount'])

    status_by_key = {}
    for key, total in totals.items():
        if total == expected[key]:
            status_by_key[key] = 'matched'
        elif total < expected[key]:
            status_by_key[key] = 'underpaid'
        else:
            status_by_key[key] = 'overpaid'

    for row in rows:
        key = (row['unit_id'], row['month_covered'])
        bind.execute(
            payments.update().where(payments.c.id == row['id']).values(
                match_status=status_by_key[key]
            )
        )

    # An active alert is no longer valid when rent has been cleared.  A
    # previous "no payment" alert becomes an underpaid alert after a partial
    # installment has been recorded.
    for alert in bind.execute(sa.select(alerts)).mappings():
        key = (alert['unit_id'], alert['month_covered'])
        status = status_by_key.get(key)
        if status in ('matched', 'overpaid'):
            bind.execute(alerts.delete().where(alerts.c.id == alert['id']))
        elif status == 'underpaid' and alert['reason'] != 'underpaid':
            bind.execute(
                alerts.update().where(alerts.c.id == alert['id']).values(
                    reason='underpaid'
                )
            )


def downgrade():
    # This migration repairs data only; the corrected values should persist.
    pass
