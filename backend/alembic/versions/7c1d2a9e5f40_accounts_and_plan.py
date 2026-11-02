"""device ids, accounts (users) and the food plan

Revision ID: 7c1d2a9e5f40
Revises: 38010ea785a3
Create Date: 2026-10-14

Adds: programs.device_id / is_demo / user_id, skin_scans.device_id / user_id, dietary_logs.device_id / user_id,
the users table and the plan_items table. Idempotent (checks before adding), so it also works on a database
the app created itself with create_all.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '7c1d2a9e5f40'
down_revision: Union[str, None] = '38010ea785a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_COLUMNS = {
    'programs': [('device_id', sa.String(), "anonymous"), ('is_demo', sa.Boolean(), False), ('user_id', sa.Integer(), None)],
    'skin_scans': [('device_id', sa.String(), "anonymous"), ('user_id', sa.Integer(), None)],
    'dietary_logs': [('device_id', sa.String(), "anonymous"), ('user_id', sa.Integer(), None)],
}


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())

    if not insp.has_table('users'):
        op.create_table('users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('email', sa.String(length=254), nullable=False),
            sa.Column('password_hash', sa.String(), nullable=False),
            sa.Column('name', sa.String(length=40), nullable=False),
            sa.Column('city', sa.String(length=60), nullable=True),
            sa.Column('token_version', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('consented_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'))
        op.create_index('ix_users_id', 'users', ['id'])
        op.create_index('ix_users_email', 'users', ['email'], unique=True)

    for table, cols in NEW_COLUMNS.items():
        have = {c['name'] for c in insp.get_columns(table)}
        for name, type_, default in cols:
            if name in have:
                continue
            if default is None:
                op.add_column(table, sa.Column(name, type_, nullable=True))
            else:
                op.add_column(table, sa.Column(name, type_, nullable=False, server_default=sa.text(
                    "false" if default is False else f"'{default}'")))
        have_idx = {i['name'] for i in insp.get_indexes(table)}
        for col in ('device_id', 'user_id'):
            if f'ix_{table}_{col}' not in have_idx:
                op.create_index(f'ix_{table}_{col}', table, [col])

    if not insp.has_table('plan_items'):
        op.create_table('plan_items',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('food', sa.String(), nullable=False),
            sa.Column('kind', sa.String(), nullable=False),
            sa.Column('target_days', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'food', name='uq_plan_user_food'))
        op.create_index('ix_plan_items_id', 'plan_items', ['id'])
        op.create_index('ix_plan_items_user_id', 'plan_items', ['user_id'])


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if insp.has_table('plan_items'):
        op.drop_table('plan_items')
    # Columns are left in place on downgrade (SQLite cannot drop them cleanly); the users table is removed.
    if insp.has_table('users'):
        op.drop_table('users')
