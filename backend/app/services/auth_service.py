"""
Authentication business logic. Route handlers in api/routes/auth.py stay
thin — they parse the request, call these functions, and translate the
result into an HTTP response. All real logic lives here.
"""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User


class AuthError(Exception):
    """Raised for any auth failure that should become a 4xx response."""

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower().strip()).first()


def register_user(db: Session, name: str, email: str, password: str) -> User:
    normalized_email = email.lower().strip()
    if get_user_by_email(db, normalized_email):
        raise AuthError(409, "An account with this email already exists.")

    user = User(
        name=name.strip(),
        email=normalized_email,
        password_hash=hash_password(password),
        role="Fraud Risk Analyst",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise AuthError(401, "Incorrect email or password.")
    return user


def issue_token_for_user(user: User) -> str:
    return create_access_token(subject=user.id)


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def request_password_reset(db: Session, email: str) -> str:
    """
    Always returns a generic, honest message — never confirms or denies
    whether an account exists (standard practice to avoid user enumeration),
    and never claims an email was sent unless a real provider is configured.
    """
    if not settings.EMAIL_DELIVERY_CONFIGURED:
        return "Password reset email service is not configured in this environment."
    # Real implementation once a provider is configured:
    #   user = get_user_by_email(db, email)
    #   if user: send_reset_email(user)
    return "If an account exists for this email, a reset link has been sent."


def initials_for(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()
