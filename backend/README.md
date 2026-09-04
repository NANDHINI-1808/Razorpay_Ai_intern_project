# PayShield AI — Backend (Auth API)

FastAPI authentication service. This backend handles **only authentication**
(register/login/logout/me/forgot-password/reset-password). Transactions,
risk scoring, investigations, analytics, and audit logs are still served
from the frontend's own mock service layer (`frontend/src/services/`) —
deliberately isolated so the risk/demo dataset and the real user-auth
database never mix.

## Stack
FastAPI · SQLAlchemy · SQLite (swap `DATABASE_URL` for PostgreSQL later) ·
passlib/bcrypt password hashing · python-jose JWT tokens

## Setup

```bash
cd backend
python -m venv venv

# Windows: venv\Scripts\activate
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # edit if needed — defaults work for local dev

uvicorn app.main:app --reload --port 8000
```

- API base: http://127.0.0.1:8000
- Swagger UI: http://127.0.0.1:8000/docs
- SQLite file is created automatically at `backend/payshield.db` on first run.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | Creates a user, returns a token + profile |
| POST | `/api/auth/login` | Verifies credentials, returns a token + profile |
| POST | `/api/auth/logout` | Stateless JWT — client discards the token |
| GET | `/api/auth/me` | Requires `Authorization: Bearer <token>` |
| POST | `/api/auth/forgot-password` | Honest response — see below |
| POST | `/api/auth/reset-password` | Returns 501 until email delivery is configured |

## What's real vs. honestly not implemented

- Registration, login, logout, and `/me` are **fully functional** against a real SQLite database with bcrypt-hashed passwords and signed JWTs.
- **Forgot/reset password**: no email provider is wired in. `forgot-password` always returns the message *"Password reset email service is not configured in this environment."* instead of pretending to send an email. Set `EMAIL_DELIVERY_CONFIGURED=true` and implement `send_reset_email(...)` in `app/services/auth_service.py` once a real provider (SES/SendGrid/Postmark/etc) is available.
- **Google OAuth**: not implemented. The frontend's "Continue with Google" always returns *"Google sign-in requires OAuth configuration."* `GOOGLE_OAUTH_CLIENT_ID` is read from the environment as the integration point for when real credentials exist.

## Environment variables
See `.env.example`. Never commit a real `.env` — it's already in `.gitignore`.
