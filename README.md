<div align="center">

# 🛡️ PayShield AI

### AI-Powered Payment Fraud Risk Management Platform

*Detect risky payments, explain why they're risky, and keep a human in control — before money moves.*

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#-license)

Built for **Razorpay Buildathon — Track 02: AI Risk Manager**

</div>

---

## 📖 Project Overview

**PayShield AI** is a full-stack payment fraud risk management platform that helps merchants and payment platforms stop losing money to payment fraud and scams. Rather than acting as a black-box "approve/deny" gate, PayShield AI is built around a **human-in-the-loop** philosophy: it scores every transaction for risk, explains *why* a transaction looks suspicious in plain language, recommends a next action, and routes uncertain or high-risk cases to a real analyst for a final decision — with every step recorded in a tamper-evident audit trail.

**The problem it solves:** payment fraud causes direct financial loss and erodes customer trust, but purely automated fraud systems create two opposite failure modes — auto-approving fraud (financial loss) or auto-blocking legitimate customers (lost revenue, customer friction). PayShield AI addresses this by clearly separating three responsibilities that are usually blurred together:

| Layer | Responsibility |
|---|---|
| **ML** | Predicts a risk score and classifies risk level |
| **AI** | Explains *why* a transaction is risky and recommends an action |
| **Human** | Makes the final, accountable decision on uncertain/high-risk cases |

**Why it's useful:** this separation gives merchants a system that is fast where automation is safe (low-risk transactions proceed automatically) and careful where it matters (an analyst reviews and decides on anything genuinely uncertain) — with every decision explainable and auditable after the fact.

---

## ✨ Key Features

- **🔐 Real Authentication** — Registration, login, session persistence, and logout backed by a real FastAPI + SQLite service with bcrypt-hashed passwords and JWT sessions (not a mocked login screen).
- **📊 Risk Dashboard** — At-a-glance KPIs (transactions analyzed, suspicious count, AI-auto-blocked vs. analyst-blocked, verification requests pending), risk distribution chart, and recent transaction activity.
- **💳 Live Transactions** — Searchable, filterable, sortable, paginated transaction ledger with full transaction detail views (risk score, signals, payment method, device/location, audit history).
- **📈 Risk Monitoring** — Real-time-style view of risk distribution, risk trend over time, high-risk/critical queues, and live fraud-detection/false-positive rate tiles.
- **🕵️ Investigation Center (AI Investigation Workspace)** — For high/critical-risk transactions: a radial risk score, categorized risk breakdown, individually explained risk signals, an AI-generated investigation summary and structured reasoning, and a clear **AI Decision Support** recommendation (Approve / Verify / Hold / Block) with a confidence score.
- **✅ Human-in-the-Loop Review** — Analysts can Approve, Request Verification, Hold, Block, or Mark False Positive on any investigated transaction. Every action updates the case and transaction status, is attributed to the acting analyst, and generates an audit entry — the "Analyst Decision" record only ever appears *after* a real review has taken place.
- **🔁 Third-Party Payment Verification** — A lighter-weight "verify before money moves" flow for medium-risk, uncertain transactions: sender/receiver details, risk context, and a Verify/Reject decision enforced by a real state machine (a request can only move from *Pending* to *Verified* or *Rejected* once).
- **👥 Customer & Beneficiary Intelligence** — Aggregated risk profiles, transaction history, and recent-activity views for customers and payment beneficiaries.
- **📉 Analytics — Business & Model Performance** — Business metrics (volume, suspicious/blocked counts, estimated loss prevented) shown separately from genuine **ML model evaluation**: precision, recall, F1, accuracy, false-positive/false-negative rate, a real confusion matrix, threshold trade-off analysis, and an explicit false-positive cost estimate.
- **📜 Full Audit Trail** — Every risk decision, human review action, and verification decision is logged with actor, timestamp, previous/new state, and reason — searchable and filterable.
- **⚙️ Settings & Profile** — Authenticated-user profile (pulled from the real backend, never hardcoded), risk engine configuration visibility, and notification preferences.
- **🎬 Polished, Accessible Motion** — Scroll-triggered reveals, staggered entrances, and animated counters built with `IntersectionObserver` and CSS (no added animation dependency), fully respecting `prefers-reduced-motion`.
- **🛡️ Radical Data Honesty** — Every synthetic/demo dataset is explicitly labeled as such in the UI. No fabricated metrics, fake financial figures, or invented analyst decisions — where real data isn't available (e.g. a genuine held-out ML test set), the product says so plainly instead of faking it.

---

## 🔄 How It Works

1. **A transaction occurs.** In this build, transactions come from a documented synthetic demo dataset (see [Known Limitations](#-known-limitations--future-work)); the data flow below is identical regardless of data source.
2. **The ML risk engine scores it** — producing a 0–100 risk score and a LOW / MEDIUM / HIGH / CRITICAL classification.
3. **Routing by risk level:**
   - **LOW** → proceeds automatically.
   - **MEDIUM** → routed to the **Verification Center** for a lightweight sender/receiver verification decision.
   - **HIGH / CRITICAL** → routed to the **Investigation Center** for full AI-assisted investigation and human review.
4. **The AI layer explains the risk** — summarizing the specific signals detected (e.g. new beneficiary, velocity anomaly, device mismatch) into a plain-language investigation summary, and recommends an action with a confidence score.
5. **A human makes the final call.** An authenticated analyst reviews the AI's recommendation and evidence, then Approves, Verifies, Holds, Blocks, or marks the case a False Positive.
6. **Everything is audited.** The decision, the reviewer, the reason, and the resulting status change are written to the audit log.
7. **Analytics closes the loop.** Business performance and ML model performance (computed from real predictions vs. labels, not hand-typed numbers) are available to review how well the system is actually performing.

**Data flow:** `React UI → TanStack Query → typed service layer (frontend/src/services) → (auth calls only) → FastAPI backend → SQLAlchemy → SQLite`. All non-auth product data (transactions, risk, investigations, verification, audit, analytics) currently flows through an in-app, typed, async service layer rather than separate HTTP endpoints — see [Known Limitations](#-known-limitations--future-work) for why, and the API section below for what *is* real.

---

## 🧰 Technology Stack

| Category | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4, React Router v6 |
| **State / Data Fetching** | TanStack Query (React Query) |
| **Charts & Visualization** | Recharts |
| **Icons** | Lucide React |
| **Backend** | FastAPI (Python 3.10+), Uvicorn |
| **Database** | SQLite (via SQLAlchemy ORM — swappable for PostgreSQL via `DATABASE_URL`) |
| **Authentication** | JWT (python-jose), bcrypt password hashing (passlib) |
| **AI / ML Layer** | Deterministic risk-scoring engine + rule-derived risk signals; structured, non-LLM explanation layer for investigation summaries and recommendations *(see [Model Evaluation](#-model-evaluation--honest-disclosure) for exact methodology)* |
| **APIs** | REST (FastAPI, JSON) for authentication; typed internal service layer for product data |
| **Motion** | Native CSS transitions/keyframes + `IntersectionObserver` (no third-party animation library) |
| **Dev Tools** | ESLint/oxlint, TypeScript compiler, npm, Python venv, Vite dev server |

---

## 🏗️ Project Architecture

```
                          ┌─────────────────────────┐
                          │        Frontend         │
                          │   React + TypeScript    │
                          │   (localhost:5173)      │
                          └────────────┬────────────┘
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 │                                             │
       Auth requests (JWT)                        Product data requests
                 │                                             │
                 ▼                                             ▼
   ┌──────────────────────────┐              ┌──────────────────────────────┐
   │      FastAPI Backend      │              │   Frontend Service Layer      │
   │     (localhost:8000)      │              │  (typed, in-app, async)       │
   │  /api/auth/register       │              │  Risk Engine → Risk Signals   │
   │  /api/auth/login          │              │  → AI Explanation             │
   │  /api/auth/logout         │              │  → Recommendation             │
   │  /api/auth/me             │              │  → Human Review → Audit       │
   │  /api/auth/forgot-password│              │  → Verification → Audit       │
   └────────────┬───────────────┘              └──────────────────────────────┘
                 │
                 ▼
   ┌──────────────────────────┐
   │  SQLAlchemy → SQLite      │
   │  (users table)            │
   └──────────────────────────┘
```

**Core decision pipeline:**

```
Transaction
    │
    ▼
Feature Extraction  (customer, device, location, beneficiary, velocity)
    │
    ▼
ML Risk Engine  ──────────►  Risk Score (0–100) + Classification (LOW/MED/HIGH/CRITICAL)
    │
    ├── LOW ─────────────────────────────► Proceeds automatically
    ├── MEDIUM ──────────────────────────► Verification Center (Verify / Reject)
    └── HIGH / CRITICAL
              │
              ▼
        Risk Signals ──► AI Explanation ──► AI Recommendation (confidence)
              │
              ▼
        Human Review (Approve / Verify / Hold / Block / False Positive)
              │
              ▼
        Final Decision ──► Audit Log ──► Analytics / Model Evaluation
```

---

## 📁 Folder Structure

```
payshield-ai/
├── README.md
├── package.json                 # Root convenience scripts
├── package-lock.json
├── .gitignore
│
├── frontend/
│   ├── package.json
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx               # Route definitions
│       ├── main.tsx               # App entry point
│       ├── pages/                  # One file per route (Overview, Transactions,
│       │                           # Investigations, Verification, Analytics, etc.)
│       ├── components/
│       │   ├── layout/              # Sidebar, Header, AppShell
│       │   ├── ui/                    # Card, Badge, Drawer, Toast, Reveal, Pagination…
│       │   ├── dashboard/              # HeroCards, KPIGrid, WorkflowStrip, charts
│       │   ├── investigation/           # RiskGauge, RecommendationPanel, HumanReviewPanel
│       │   ├── verification/             # VerificationRequestCard
│       │   ├── analytics/                 # ModelPerformanceSection
│       │   └── auth/                       # AuthShell, ProtectedRoute
│       ├── services/
│       │   ├── auth.ts                     # Real backend auth client
│       │   ├── api/                         # Typed async product-data service layer
│       │   ├── mockData.ts                   # Synthetic demo dataset + risk engine
│       │   └── modelEvaluation.ts             # Precision/recall/F1/confusion matrix
│       ├── hooks/                              # useAuth, useCountUp, useInView
│       ├── lib/                                 # apiConfig, format, investigationInsights
│       ├── types/                                # Shared TypeScript contracts
│       └── styles/                                # Design tokens (tokens.css)
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py                # FastAPI app, CORS, startup
│       ├── core/                    # config.py, security.py (JWT + bcrypt)
│       ├── api/routes/               # auth.py
│       ├── models/                    # user.py (SQLAlchemy)
│       ├── schemas/                    # auth.py (Pydantic)
│       ├── services/                    # auth_service.py (business logic)
│       └── database/                     # database.py (engine/session)
│
├── data/
│   └── README.md                # Dataset methodology & honest limitations
│
└── docs/
    ├── ARCHITECTURE.md          # Full system design
    ├── API.md                    # Every real endpoint + service contract
    ├── MODEL_EVALUATION.md        # Dataset, methodology, threshold rationale
    └── DEMO_FLOW.md                 # Step-by-step walkthrough
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- npm

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/payshield-ai.git
cd payshield-ai
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit values if needed — defaults work locally
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
cp .env.example .env            # defaults to http://127.0.0.1:8000
```

### 4. Run the backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
API available at `http://127.0.0.1:8000` · interactive docs at `http://127.0.0.1:8000/docs`

### 5. Run the frontend
```bash
cd frontend
npm run dev
```
App available at `http://localhost:5173`

### 6. First use
Open the app, click **Create account** to register a real user (stored in `backend/payshield.db`), then sign in. There is no pre-seeded demo account.

---

## 🔑 Environment Variables

**`frontend/.env.example`**
```env
# Base URL of the PayShield AI backend API
VITE_API_BASE_URL=http://127.0.0.1:8000
```

**`backend/.env.example`**
```env
DATABASE_URL=sqlite:///./payshield.db
SECRET_KEY=change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Comma-separated list of allowed frontend origins
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Set to true only once a real email provider is wired in
EMAIL_DELIVERY_CONFIGURED=false

# Leave unset unless real Google OAuth credentials are available
GOOGLE_OAUTH_CLIENT_ID=
```

> ⚠️ Never commit a real `.env` file. Only `.env.example` templates are tracked in this repository.

---

## 🖱️ Usage

1. **Register / Log in** with a real account.
2. Land on the **Dashboard** for an at-a-glance view of transaction volume, risk distribution, and pending items.
3. Open **Live Transactions**, filter to a high-risk transaction, and open its detail page.
4. From a high/critical-risk transaction, open the linked **Investigation** to see the AI's risk breakdown, signals, and recommendation.
5. As the analyst, take a **Human Review** action (Approve / Verify / Hold / Block / False Positive) — the decision, reviewer, and reason are recorded immediately.
6. For medium-risk transactions, use the **Verification Center** to Verify or Reject a payment before it proceeds.
7. Review **Analytics** for both business KPIs and genuine ML model performance metrics.
8. Check **Audit Logs** to see the full, filterable history of every decision made in the system.

---

## 🖼️ Screenshots / Demo

**Demo video:** https://drive.google.com/drive/folders/1iVcDwcGLyRCZm4qDZ29Wrw2ZKtVzP6Mw?usp=sharing

---

## 📡 API Documentation

Only the authentication API is a real HTTP backend in this build. All other endpoints listed in the architecture diagram (transactions, risk, investigations, verification, audit, analytics) are currently served through an in-app **typed service layer**, not separate REST endpoints — see `docs/API.md` for the full function-level contract and the architectural reasoning behind that choice.

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account (bcrypt-hashed password) | No |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT access token | No |
| `POST` | `/api/auth/logout` | Invalidate the client-side session | No* |
| `GET` | `/api/auth/me` | Fetch the current authenticated user's profile | **Yes (Bearer token)** |
| `POST` | `/api/auth/forgot-password` | Request a password reset (honest "not configured" response until an email provider is wired in) | No |
| `POST` | `/api/auth/reset-password` | Reset password via token (returns `501` until email delivery is configured) | No |

<sub>*Tokens are stateless JWTs in this build; logout is enforced client-side by discarding the token.</sub>

---

## 🔬 Model Evaluation — Honest Disclosure

This project takes data honesty seriously enough to document it as a first-class feature, not an afterthought:

- **Dataset:** a deterministic, seeded synthetic dataset (not real transaction data), clearly labeled `Synthetic / Demo Dataset` everywhere it's shown in the UI.
- **Metrics:** precision, recall, F1, accuracy, false-positive rate, false-negative rate, and the confusion matrix are **genuinely computed** from real arithmetic against a synthetic ground-truth label — not hardcoded numbers.
- **Held-out test set:** **not genuinely available.** The same synthetic dataset is reused for both the live product demo and evaluation. This is stated explicitly in the app and in `docs/MODEL_EVALUATION.md` rather than being disguised as a real held-out split.
- **False-positive cost:** shown with an explicit **"Illustrative Cost Assumption"** label — never presented as a real financial figure.

Full methodology: [`docs/MODEL_EVALUATION.md`](docs/MODEL_EVALUATION.md)

---

## 🚀 Future Enhancements

- Move the transaction, risk, and investigation dataset from the frontend synthetic layer into real backend-persisted tables (PostgreSQL), with the Verification feature migrating alongside it
- Real email provider integration for password reset delivery
- Google OAuth integration
- A genuine held-out evaluation dataset sourced from real (or realistically simulated) fraud outcomes
- Role-based access control for multiple analyst roles (Analyst, Manager, Admin)
- Automated test suite (unit + integration + end-to-end)
- CI/CD pipeline with automated build/type-check gates
- Real-time transaction ingestion (WebSocket/event stream) instead of a static demo dataset
- Configurable risk-threshold management UI backed by a real risk-policy service

---

## 🧗 Challenges & Solutions

| Challenge | Solution |
|---|---|
| Presenting ML "performance" honestly without a real fraud-outcome dataset | Built a dedicated evaluation module that computes real metrics against a clearly-disclosed synthetic ground-truth label, and states plainly wherever a genuine held-out test set doesn't exist, instead of fabricating or renaming synthetic data as production-grade. |
| Keeping ML, AI, and human responsibilities from blurring together | Enforced a strict labeling and code-organization convention: risk scoring lives in the ML layer, explanation/recommendation lives in a separate AI layer, and only a real human review action can produce a final "Analyst Decision" — which is never rendered until that action has actually occurred. |
| Adding a new Verification workflow without risking two inconsistent sources of truth for the same transaction | Deliberately kept Verification inside the existing frontend service layer (same source of truth as Investigations) rather than splitting transaction data across a new backend table, which would have required duplicating the demo-data generation logic and risked showing different risk data for the same transaction depending on which page was open. |
| Adding "premium" scroll and motion polish without bloating the dependency tree | Built a small reusable `useInView` (IntersectionObserver) hook and a `Reveal` component instead of adding an animation library, keeping bundle size and complexity down while still getting scroll-triggered reveals, staggered entrances, and animated counters. |
| Preventing invalid state transitions in Human Review / Verification decisions | Implemented an explicit state-machine check server-side-style in the service layer (e.g. a Verification request can only move from `PENDING` to `VERIFIED`/`REJECTED` once) rather than trusting the UI alone to prevent double-decisions. |

---

## 🔒 Security

- **Password handling:** passwords are hashed with **bcrypt** (via `passlib`) before storage — plaintext passwords are never stored or logged.
- **Session tokens:** authentication uses signed **JWTs** (HS256) with a configurable expiry; the token is stored client-side and re-verified against the backend (`GET /api/auth/me`) on every app load rather than trusted from a stale cache.
- **CORS:** the backend restricts allowed origins via an explicit `CORS_ORIGINS` allow-list rather than a wildcard.
- **Secrets management:** all secrets (JWT signing key, database URL) are read from environment variables via `.env` — only `.env.example` templates are committed; real `.env` files are git-ignored.
- **Generic auth errors:** login failures return a generic "incorrect email or password" message rather than revealing whether a specific email is registered, to avoid user enumeration.
- **Input validation:** registration and login payloads are validated with Pydantic (email format, minimum password length, password-confirmation match) before reaching business logic.
- **No secrets in the frontend:** the frontend only ever holds a short-lived JWT access token — no API keys, database credentials, or signing secrets are ever exposed client-side.

---

## 🧪 Testing

Current validation approach (no automated test suite is included in this build):

- **Static type safety:** `npx tsc --noEmit` run against the full frontend codebase with zero errors.
- **Build validation:** `npm run build` (frontend) and `python -m compileall app` (backend) both run cleanly before every release.
- **Manual/API-level runtime validation:** authentication endpoints have been exercised directly (register → `/me` → invalid login → logout) to confirm real request/response behavior, including error paths.

**Recommended for future contributors:**
- Unit tests for the risk engine and model-evaluation math (Vitest/Jest)
- API tests for the FastAPI auth endpoints (pytest + httpx)
- End-to-end tests for the core review/verification flows (Playwright or Cypress)

---

## 🚢 Deployment

This project has not been deployed to a hosted environment in this build. Recommended approach:

| Component | Suggested platform |
|---|---|
| Frontend (static Vite build) | Vercel, Netlify, or Cloudflare Pages |
| Backend (FastAPI) | Railway, Render, or Fly.io |
| Database | Managed PostgreSQL (swap `DATABASE_URL` — no code changes required beyond that) |

**General steps:**
1. Set real environment variables (`SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`) on the backend host — never reuse local defaults in production.
2. Point `VITE_API_BASE_URL` in the frontend build to the deployed backend URL.
3. Run `npm run build` and deploy the resulting `frontend/dist` as a static site.
4. Deploy the backend with a production ASGI server (e.g. `uvicorn` behind a process manager, or `gunicorn` with `uvicorn` workers).

---

## 🤝 Contributing

Contributions are welcome. Please:

1. Fork the repository and create a feature branch (`git checkout -b feature/your-feature`).
2. Follow the existing code style (TypeScript strict typing on the frontend, typed Pydantic schemas on the backend).
3. Ensure `npx tsc --noEmit`, `npm run build`, and `python -m compileall app` all pass before opening a pull request.
4. Do not introduce fabricated data, mock responses disguised as real ones, or new dependencies without justification — this project treats data honesty as a core requirement, not a nice-to-have.
5. Open a pull request with a clear description of the change and why it's needed.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Nandhini Murugesan**

- GitHub: https://github.com/NANDHINI-1808 
- LinkedIn: https://www.linkedin.com/in/nandhini-murugesan-5bb97a379/
- Email: bharaninandhini48@gmail.com

---

<div align="center">

*PayShield AI — built for Razorpay Buildathon *

</div>
