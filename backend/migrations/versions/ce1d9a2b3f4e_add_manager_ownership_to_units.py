"""add manager ownership to units

Revision ID: ce1d9a2b3f4e
Revises: 15329ca5f3c5
"""
from alembic import op
import sqlalchemy as sa


revision = 'ce1d9a2b3f4e'
down_revision = '15329ca5f3c5'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('units', schema=None) as batch_op:
        batch_op.add_column(sa.Column('manager_id', sa.String(length=36), nullable=True))
        batch_op.create_foreign_key('fk_units_manager_id_users', 'users', ['manager_id'], ['id'])
        batch_op.create_index('ix_units_manager_id', ['manager_id'], unique=False)

    # Preserve the original demo portfolio for the oldest existing manager.
    # Any orphaned legacy rows remain hidden instead of becoming visible to every account.
    op.execute("""
        UPDATE units
        SET manager_id = (
            SELECT id FROM users WHERE role = 'manager' ORDER BY created_at ASC LIMIT 1
        )
        WHERE manager_id IS NULL
    """)


def downgrade():
    with op.batch_alter_table('units', schema=None) as batch_op:
        batch_op.drop_index('ix_units_manager_id')
        batch_op.drop_constraint('fk_units_manager_id_users', type_='foreignkey')
        batch_op.drop_column('manager_id')
