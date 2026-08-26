"""initial database

Revision ID: 3993e0e4e306
Revises: 
Create Date: 2026-08-26 21:57:51.895502

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3993e0e4e306'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "contacts",
        sa.Column("contact_id", sa.String(200), nullable=False),
        sa.Column("naam", sa.String(200), nullable=False, server_default=""),
        sa.Column("voornaam", sa.String(200), nullable=False, server_default=""),
        sa.Column("straat", sa.String(200), nullable=False, server_default=""),
        sa.Column("nummer", sa.String(50), nullable=False, server_default=""),
        sa.Column("postcode", sa.String(20), nullable=False, server_default=""),
        sa.Column("gemeente", sa.String(200), nullable=False, server_default=""),
        sa.Column("provincie", sa.String(200), nullable=False, server_default=""),
        sa.Column("gsmnummer", sa.String(50), nullable=False, server_default=""),
        sa.Column("website", sa.Text(), nullable=False, server_default=""),
        sa.Column("extra", sa.dialects.postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.PrimaryKeyConstraint("contact_id"),
    )
    op.create_table(
        "option_sets",
        sa.Column("option_key", sa.String(100), nullable=False),
        sa.Column("values", sa.dialects.postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.PrimaryKeyConstraint("option_key"),
    )
    op.create_table(
        "birds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bird_key", sa.String(200), nullable=False),
        sa.Column("stamnummer", sa.String(100), nullable=False, server_default=""),
        sa.Column("ringnummer", sa.String(100), nullable=False, server_default=""),
        sa.Column("ringmaat", sa.String(50), nullable=False, server_default=""),
        sa.Column("geslacht", sa.String(50), nullable=False, server_default=""),
        sa.Column("mutatie", sa.String(100), nullable=False, server_default=""),
        sa.Column("gezoomd", sa.String(100), nullable=False, server_default=""),
        sa.Column("factor", sa.String(100), nullable=False, server_default=""),
        sa.Column("split1", sa.String(100), nullable=False, server_default=""),
        sa.Column("split2", sa.String(100), nullable=False, server_default=""),
        sa.Column("split3", sa.String(100), nullable=False, server_default=""),
        sa.Column("split4", sa.String(100), nullable=False, server_default=""),
        sa.Column("status", sa.String(100), nullable=False, server_default=""),
        sa.Column("herkomst", sa.String(100), nullable=False, server_default=""),
        sa.Column("kooi", sa.String(100), nullable=False, server_default=""),
        sa.Column("kweekjaar", sa.String(10), nullable=False, server_default=""),
        sa.Column("vader_name", sa.String(200), nullable=False, server_default=""),
        sa.Column("moeder_name", sa.String(200), nullable=False, server_default=""),
        sa.Column("aankoop_contact_id", sa.String(200), nullable=False, server_default=""),
        sa.Column("opmerking", sa.Text(), nullable=False, server_default=""),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("bird_key"),
    )
    op.create_table(
        "couples",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("couple_name", sa.String(200), nullable=False),
        sa.Column("man_name", sa.String(200), nullable=False, server_default=""),
        sa.Column("pop_name", sa.String(200), nullable=False, server_default=""),
        sa.Column("kooi", sa.String(100), nullable=False, server_default=""),
        sa.Column("kweekjaar", sa.String(10), nullable=False, server_default=""),
        sa.Column("jongen", sa.dialects.postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("rondes", sa.dialects.postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("aantal_jong_uit", sa.String(50), nullable=False, server_default=""),
        sa.Column("opmerking_kweek", sa.Text(), nullable=False, server_default=""),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("couple_name"),
    )


def downgrade() -> None:
    op.drop_table("couples")
    op.drop_table("birds")
    op.drop_table("option_sets")
    op.drop_table("contacts")
