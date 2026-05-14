"""Add hidden product status

Revision ID: e47aa33e4c18
Revises: d2f8f11ad9c7
Create Date: 2026-05-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'e47aa33e4c18'
down_revision: Union[str, Sequence[str], None] = 'd2f8f11ad9c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE productstatus ADD VALUE IF NOT EXISTS 'hidden'")


def downgrade() -> None:
    pass
