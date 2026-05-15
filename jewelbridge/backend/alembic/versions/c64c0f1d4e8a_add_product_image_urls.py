"""Add product image URLs

Revision ID: c64c0f1d4e8a
Revises: f1f6d0f103b2
Create Date: 2026-05-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c64c0f1d4e8a'
down_revision: Union[str, Sequence[str], None] = 'f1f6d0f103b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('image_urls', sa.JSON(), nullable=True))
    op.execute("UPDATE products SET image_urls = json_build_array(image_url) WHERE image_urls IS NULL")


def downgrade() -> None:
    op.drop_column('products', 'image_urls')
