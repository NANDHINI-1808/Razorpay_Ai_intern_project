"""
Database engine and session management.

Uses SQLite for local development (backend/payshield.db). To move to
PostgreSQL later, only DATABASE_URL needs to change — no other code in
this file or in models/services needs to change, since SQLAlchemy
abstracts the dialect.

This database is isolated from the frontend's mock transaction/risk/
investigation data — it exists solely for authentication (users table).
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables that don't exist yet. Called once on app startup."""
    from app.models import user  # noqa: F401  (ensures model is registered)

    Base.metadata.create_all(bind=engine)
