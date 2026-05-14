"""Add product owner

Revision ID: d2f8f11ad9c7
Revises: c64c0f1d4e8a
Create Date: 2026-05-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd2f8f11ad9c7'
down_revision: Union[str, Sequence[str], None] = 'c64c0f1d4e8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('owner_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_products_owner_id_users', 'products', 'users', ['owner_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_products_owner_id_users', 'products', type_='foreignkey')
    op.drop_column('products', 'owner_id')
