import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./twacha.db")
# Hosts such as Render and Heroku hand out "postgres://..." which SQLAlchemy 2 rejects, and a bare
# "postgresql://" picks a different driver depending on the SQLAlchemy version. Pin the driver we install.
for _prefix in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(_prefix):
        DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len(_prefix):]
        break
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# pool_pre_ping: hosted Postgres closes idle connections, so test them before use.
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_columns():
    """Tiny migration for databases created by older versions (create_all never alters existing tables)."""
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    wanted = {
        "programs": [("device_id", "VARCHAR DEFAULT 'anonymous' NOT NULL"), ("is_demo", "BOOLEAN DEFAULT FALSE NOT NULL"),
                     ("user_id", "INTEGER")],
        "skin_scans": [("device_id", "VARCHAR DEFAULT 'anonymous' NOT NULL"), ("user_id", "INTEGER")],
        "dietary_logs": [("device_id", "VARCHAR DEFAULT 'anonymous' NOT NULL"), ("user_id", "INTEGER")],
    }
    with engine.begin() as conn:
        for table, cols in wanted.items():
            if not insp.has_table(table):
                continue
            have = {c["name"] for c in insp.get_columns(table)}
            for name, ddl in cols:
                if name not in have:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
            if "user_id" not in have:
                conn.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{table}_user_id ON {table} (user_id)"))
