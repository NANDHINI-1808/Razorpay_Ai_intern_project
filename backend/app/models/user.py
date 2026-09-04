import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import Mapped

from app.database.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = Column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = Column(String, nullable=False)
    email: Mapped[str] = Column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = Column(String, nullable=False)
    role: Mapped[str] = Column(String, nullable=False, default="Fraud Risk Analyst")
    created_at: Mapped[datetime] = Column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=_utcnow, onupdate=_utcnow)
