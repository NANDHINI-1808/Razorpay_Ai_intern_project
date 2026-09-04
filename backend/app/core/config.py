"""
Application configuration.

Reads from environment variables (with safe local-dev defaults). Real
secrets belong in a local `.env` file, never committed — see
backend/.env.example.
"""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")
except ImportError:
    # python-dotenv is optional; if it's not installed, environment
    # variables must be set some other way (shell export, Docker, etc).
    pass


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./payshield.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # Comma-separated list of allowed frontend origins for CORS.
    # Vite auto-increments its dev port when the default is busy (5173 →
    # 5174 → 5175 → ...), so the default list covers that common range for
    # both `localhost` and `127.0.0.1` (they are different CORS origins).
    # Override with a specific origin via the CORS_ORIGINS env var for
    # anything outside this range (e.g. a non-default Vite port or a
    # deployed frontend URL).
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS",
        ",".join(
            f"http://{host}:{port}"
            for host in ("localhost", "127.0.0.1")
            for port in range(5173, 5181)
        ),
    ).split(",")

    # Email delivery is not configured in this build. Forgot-password
    # returns an honest "not configured" response rather than pretending
    # to send an email. Set this to True only once a real provider
    # (SES, SendGrid, Postmark, etc) is wired into auth_service.py.
    EMAIL_DELIVERY_CONFIGURED: bool = os.getenv("EMAIL_DELIVERY_CONFIGURED", "false").lower() == "true"

    # Google OAuth is not configured in this build unless a real client ID
    # is provided via environment variable.
    GOOGLE_OAUTH_CLIENT_ID: str | None = os.getenv("GOOGLE_OAUTH_CLIENT_ID") or None


settings = Settings()
