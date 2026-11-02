"""initial schema (the tables as they were before per-device data and accounts)

Revision ID: 38010ea785a3
Revises:
Create Date: 2026-10-10 23:45:33

Rewritten: the first version only contained a diff against a developer's database, so it could not build
an empty one. Every step now checks whether the table already exists, so this is safe on a database that
the app created by itself (it runs create_all at start-up) and on one already stamped with this revision.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '38010ea785a3'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _missing(name: str) -> bool:
    return not sa.inspect(op.get_bind()).has_table(name)


def upgrade() -> None:
    if _missing('programs'):
        op.create_table('programs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('start_date', sa.Date(), nullable=False),
            sa.Column('total_days', sa.Integer(), nullable=False),
            sa.PrimaryKeyConstraint('id'))
        op.create_index('ix_programs_id', 'programs', ['id'])
    if _missing('skin_scans'):
        op.create_table('skin_scans',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('day_number', sa.Integer(), nullable=False),
            sa.Column('acne_score', sa.Float(), nullable=False),
            sa.Column('redness_score', sa.Float(), nullable=False),
            sa.Column('dryness_score', sa.Float(), nullable=False),
            sa.Column('ita_value', sa.Float(), nullable=False),
            sa.Column('local_aqi', sa.Integer(), nullable=True),
            sa.Column('pm25', sa.Float(), nullable=True),
            sa.Column('dominant_pollutant', sa.String(), nullable=True),
            sa.Column('aqi_band', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id'))
        op.create_index('ix_skin_scans_id', 'skin_scans', ['id'])
    if _missing('dietary_logs'):
        op.create_table('dietary_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('logged_at', sa.DateTime(), nullable=False),
            sa.Column('log_date', sa.Date(), nullable=False),
            sa.Column('foods_eaten', sa.JSON(), nullable=False),
            sa.PrimaryKeyConstraint('id'))
        op.create_index('ix_dietary_logs_id', 'dietary_logs', ['id'])
    if _missing('nutrient_evidence_rules'):
        op.create_table('nutrient_evidence_rules',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('nutrient_key', sa.String(), nullable=False),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('body', sa.Text(), nullable=False),
            sa.Column('nutrient_explanation', sa.Text(), nullable=False),
            sa.Column('evidence_tier', sa.String(), nullable=False),
            sa.Column('source_note', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('nutrient_key'))
        op.create_index('ix_nutrient_evidence_rules_id', 'nutrient_evidence_rules', ['id'])


def downgrade() -> None:
    for table in ('nutrient_evidence_rules', 'dietary_logs', 'skin_scans', 'programs'):
        if not _missing(table):
            op.drop_table(table)
