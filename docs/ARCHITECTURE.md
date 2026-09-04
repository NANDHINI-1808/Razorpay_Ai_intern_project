# PayShield AI — Architecture

AI-Powered Payment Scam Prevention & Transaction Intelligence Platform,
built for Razorpay Buildathon Track 02 (AI Risk Manager). Loss class:
**payment fraud / scam loss**.

## System overview

```
payshield-ai/
├── frontend/   React + TypeScript + Vite — the full product UI and mock
│               risk/transaction data layer
├── backend/    FastAPI — real authentication API only
├── data/       Dataset documentation (see data/README.md — no genuine
│               held-out test set exists; documented honestly there)
└── docs/       This documentation set
```

Two backends exist for two different reasons, and they are **deliberately
isolated from each other**:

- `backend/` is a **real** service: user registration, login, JWT
  sessions, bcrypt password hashing, SQLite storage.
- The transaction / risk / investigation / analytics data is a
  **synthetic, in-memory mock dataset** served from
  `frontend/src/services/`. There is no real merchant transaction feed —
  this is disclosed in-app (Analytics → Model Performance) and here.

## Core product flow

```
Transaction
    ↓
Feature Extraction        (customer, device, location, beneficiary, velocity)
    ↓
ML Risk Engine             ← risk score (0–100), deterministic per transaction
    ↓
Risk Classification        LOW / MEDIUM / HIGH / CRITICAL
    ↓
    ├─ LOW        → proceeds automatically
    ├─ MEDIUM      → Verification Center (sender/receiver verify-or-reject, /verification)
    └─ HIGH/CRITICAL → Investigation Center (below)
    ↓
Risk Signals                (device, beneficiary, amount, velocity anomalies)
    ↓
AI Investigation Layer     ← explanation, evidence summary, "why risky"
    ↓
AI Recommendation           APPROVE / VERIFY / HOLD / BLOCK + confidence
    ↓
Human Review                ← required for HIGH/CRITICAL cases
    ↓
Final Decision               Approve / Verify / Hold / Block / False Positive
    ↓
Audit Log                    every state change, every review action
    ↓
Analytics / Model Evaluation
```

### Layer labeling (explicit, per Track 02 evaluation criteria)

| Layer | Responsibility | Where it lives |
|---|---|---|
| **ML = Prediction** | Computes a 0–100 risk score per transaction and classifies it LOW/MEDIUM/HIGH/CRITICAL against fixed thresholds. Also backs the Model Performance evaluation (precision/recall/F1/confusion matrix). | `frontend/src/services/mockData.ts` (`riskLevelFor`, `RISK_THRESHOLDS`), `frontend/src/services/modelEvaluation.ts` |
| **AI = Explanation + Decision Support** | Summarizes *why* a transaction is risky (signals → evidence → plain-language explanation), and recommends an action with a confidence score. Never a hidden chain-of-thought — only a summarized, user-facing explanation. | `frontend/src/lib/investigationInsights.ts`, `Investigation.aiSummary`/`.reasoning`/`.recommendation`/`.confidence` fields |
| **Human = Final Decision** | An authenticated analyst reviews HIGH/CRITICAL cases and makes the binding decision (Approve/Verify/Hold/Block/False Positive). The AI recommendation is *decision support*, not an automatic authority — the transaction status only changes when a human submits a review. | `frontend/src/components/investigation/HumanReviewPanel.tsx`, `submitHumanReview()` in `frontend/src/services/api/index.ts` |

**Important honesty note:** there is no LLM call in this build. "AI Investigation" refers to a structured explanation layer built from the risk signals already computed by the ML layer — it is not an independent model and does not itself predict fraud. See `docs/MODEL_EVALUATION.md` for what actually is (and isn't) measured.

## Frontend architecture

```
frontend/src/
├── pages/            One file per route (Overview, Transactions, ...)
├── components/       layout/, ui/, dashboard/, investigation/, analytics/, auth/
├── services/         api/ (typed async data-access layer), auth.ts (real backend calls),
│                      mockData.ts (synthetic dataset + risk engine), modelEvaluation.ts
├── hooks/             useAuth.tsx (auth state/business logic, not in JSX)
├── lib/               investigationInsights.ts, format.ts, apiConfig.ts, utils.ts
└── types/             Shared TypeScript contracts
```

Every page reads data exclusively through `services/api/` — never inline
mock data in JSX. `services/api/` is the seam where a real transactions/
risk/investigations backend would plug in later without changing any page
component.

## Backend architecture (authentication only)

```
backend/app/
├── main.py            FastAPI app, CORS, startup DB init
├── core/               config.py (env-driven settings), security.py (bcrypt + JWT)
├── api/routes/auth.py  Thin route handlers
├── services/auth_service.py   Real business logic (register/authenticate/reset)
├── models/user.py      SQLAlchemy User model
├── schemas/auth.py     Pydantic request/response contracts
└── database/database.py  SQLite engine/session (swap DATABASE_URL for Postgres later)
```

## Authentication flow

```
Register/Login → bcrypt verify/hash → JWT issued (HS256, 60 min default)
→ frontend stores only the token (localStorage) → every load calls
GET /api/auth/me with the token to re-verify + fetch fresh profile
→ Logout discards the token client-side (stateless JWT — no server-side
  revocation list in this build)
```

Google OAuth and email-based password reset are **real integration
points that honestly report "not configured"** rather than faking
success — see `docs/API.md`.

## Defense-only statement

PayShield AI only detects, explains, scores, and routes transactions for
review. It contains no code for generating fraud, bypassing verification,
credential theft, or any offensive capability — verified by repository
search as part of the Track 02 audit (see the audit report delivered
alongside this documentation).
