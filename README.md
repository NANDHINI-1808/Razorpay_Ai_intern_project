<<<<<<< HEAD
# PayShield AI

AI-Powered Payment Scam Prevention & Transaction Intelligence Platform —
built for Razorpay Buildathon Track 02 (AI Risk Manager). Loss class:
payment fraud / scam loss.

```
payshield-ai/
├── frontend/     React + TypeScript + Vite — the full product UI + mock risk/transaction data layer
├── backend/      FastAPI — real authentication API (register/login/logout/me)
├── data/         Dataset documentation (no genuine held-out test set — see data/README.md)
├── docs/         ARCHITECTURE.md, API.md, MODEL_EVALUATION.md, DEMO_FLOW.md
├── package.json  Root convenience scripts (see below)
└── README.md
```

## Quick start

### Option A — root convenience scripts (macOS/Linux)

```bash
npm run install:all          # installs frontend deps; prints backend setup reminder
cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..
npm run dev                  # runs frontend (5173) + backend (8000) together
```

> **Windows note:** `npm run dev:backend` assumes a Unix-style venv path (`venv/bin/uvicorn`). On Windows, run the backend manually instead (Option B below) and use `npm run dev:frontend` on its own for the frontend.

### Option B — manual, two terminals (all platforms)

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
→ http://127.0.0.1:8000 · Swagger docs at `/docs`

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env   # already defaults to http://127.0.0.1:8000
npm run dev
```
→ http://localhost:5173

Open the frontend, click **Create account** to register a real user (stored
in `backend/payshield.db`), then sign in. There is no hardcoded demo
account — authentication is a real backend.

## What's mock vs. real

| Area | Status |
|---|---|
| Authentication (register/login/logout/me) | **Real** — FastAPI + SQLite + bcrypt + JWT |
| Forgot/reset password | Real endpoint, honest "email service not configured" response — no fake email sending |
| Google OAuth | Real integration point, honestly returns "requires OAuth configuration" — not connected |
| Transactions, Risk Engine, Investigations, Analytics, Audit Logs | **Mock data**, served from `frontend/src/services/` — PayShield AI's synthetic demo dataset, clearly disclosed in-app (Analytics → Model Performance) and in `docs/MODEL_EVALUATION.md` |
| Model evaluation (precision/recall/F1/confusion matrix) | **Really computed**, against a **synthetic, clearly-disclosed** ground-truth label — not a genuine held-out test set. See `docs/MODEL_EVALUATION.md`. |

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, ML/AI/Human layer separation
- [`docs/API.md`](docs/API.md) — every real backend endpoint + the frontend mock service contract
- [`docs/MODEL_EVALUATION.md`](docs/MODEL_EVALUATION.md) — dataset, methodology, threshold rationale, limitations
- [`docs/DEMO_FLOW.md`](docs/DEMO_FLOW.md) — step-by-step walkthrough for judges/reviewers
- [`data/README.md`](data/README.md) — honest statement on held-out test data

See `frontend/README.md` and `backend/README.md` for implementation details on each side.
=======
# Razorpay_Ai_intern_project
>>>>>>> e7983b742352468fea85af15c4fe47dad54579a2
