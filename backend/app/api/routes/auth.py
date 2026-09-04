from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.database import get_db
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    UserResponse,
)
from app.services import auth_service
from app.services.auth_service import AuthError

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_user_response(user) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        initials=auth_service.initials_for(user.name),
        created_at=user.created_at,
    )


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Dependency used by protected endpoints (currently just /me). Expects
    `Authorization: Bearer <token>`. Never leaks why a token was rejected
    beyond a generic 401 — no internal detail is exposed to the client.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    token = authorization.removeprefix("Bearer ").strip()
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid.")
    user = auth_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid.")
    return user


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_user(db, payload.name, payload.email, payload.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    token = auth_service.issue_token_for_user(user)
    return AuthResponse(access_token=token, user=_to_user_response(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.authenticate_user(db, payload.email, payload.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    token = auth_service.issue_token_for_user(user)
    return AuthResponse(access_token=token, user=_to_user_response(user))


@router.post("/logout", response_model=MessageResponse)
def logout():
    # Tokens are stateless JWTs in this build — logout is enforced
    # client-side by discarding the token. A production system with
    # refresh-token/session revocation would blacklist the token here.
    return MessageResponse(message="Signed out.")


@router.get("/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)):
    return _to_user_response(current_user)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    message = auth_service.request_password_reset(db, payload.email)
    return MessageResponse(message=message)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest):
    # No reset tokens are ever issued while email delivery is unconfigured
    # (see auth_service.request_password_reset), so any token presented
    # here is necessarily invalid. This endpoint exists as the real
    # integration point for when a provider is wired in — it does not
    # pretend to succeed.
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Password reset is not available until an email delivery provider is configured.",
    )
