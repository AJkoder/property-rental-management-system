"""add event_type and detail to status_history for assignment logging

Revision ID: d8dbb595c4b4
Revises: 8f67e2e4ba62
Create Date: 2026-09-02 13:30:36.404801

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd8dbb595c4b4'
down_revision = '8f67e2e4ba62'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('status_history', schema=None) as batch_op:
        batch_op.add_column(sa.Column('event_type', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('detail', sa.String(length=255), nullable=True))
        batch_op.alter_column('new_status',
               existing_type=sa.VARCHAR(length=20),
               nullable=True)

    op.execute("UPDATE status_history SET event_type = 'status_change' WHERE event_type IS NULL")

    with op.batch_alter_table('status_history', schema=None) as batch_op:
        batch_op.alter_column('event_type',
               existing_type=sa.String(length=20),
               nullable=False)


def downgrade():
    with op.batch_alter_table('status_history', schema=None) as batch_op:
        batch_op.alter_column('new_status',
               existing_type=sa.VARCHAR(length=20),
               nullable=False)
        batch_op.drop_column('detail')
        batch_op.drop_column('event_type')