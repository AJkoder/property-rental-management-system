"""Merge migration heads

Revision ID: eddc00306551
Revises: 61fd1d44a8c7, ce1d9a2b3f4e
Create Date: 2026-09-04 22:26:19.319535

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'eddc00306551'
down_revision = ('61fd1d44a8c7', 'ce1d9a2b3f4e')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
