from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth
from app.core.config import settings
from app.database.database import init_db

app = FastAPI(
    title="PayShield AI — Auth API",
    description="Authentication service for PayShield AI. Isolated from the "
    "frontend's mock transaction/risk/investigation data, which remains "
    "served from the frontend's own service layer.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"service": "payshield-ai-auth", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
