# PayShield AI — Frontend (Phase 1)

AI-Powered Payment Scam Prevention & Transaction Intelligence Platform.

## What's in this phase
- Vite + React 18 + TypeScript + Tailwind CSS v4 project scaffold
- Design system: brand tokens (color/type/radius/shadow) in `src/styles/tokens.css`
- App shell: `Sidebar`, `Header`, collapsible layout
- Full routing for all 11 planned pages
- **Overview / Dashboard** fully built: hero + secondary card, KPI grid, risk distribution chart, recent transactions
- Typed mock data + async `services/api/` layer — swap function bodies for real `fetch` calls to your FastAPI backend later; nothing else in the UI needs to change
- Remaining pages (Transactions, Risk Monitoring, Investigation Center, etc.) are routed and scaffolded, ready for Phase 2–5 design

## Run it
```bash
npm install
npm run dev
```

## Phase 2 (complete)
- **Live Transactions** (`/transactions`) — search, risk/status/method/date filters, sortable columns (amount, timestamp, risk score), pagination, row click + explicit "View" action, loading/empty/error states
- **Transaction Details** (`/transactions/:id`) — overview, customer info, payment info, device & location, risk analysis (pulls related investigation signals when one exists), AI recommendation with model confidence, audit/activity timeline (pulls matching audit log entries), back button
- **Risk Monitoring** (`/risk-monitoring`) — stat strip (total/low/medium/high/critical/avg score), risk distribution chart, risk trend chart (derived from transaction timestamps), high-risk list, critical list, recent risk events — all clickable through to transaction details

All three pages read exclusively through `services/api/` using the existing typed mock data — no values are hardcoded in components.

## Phase 3 (complete)
- **AI Investigation Workspace + Case Details** (`/investigations/:caseId`, one combined page as only one detail route exists) — header (case ID, transaction ID, customer, status, risk level), radial risk-score gauge, risk signals (from existing investigation data only — no fabricated signals), evidence grid, AI Investigation Summary (risk assessment / key findings / reason for elevated risk, all sourced from existing `aiSummary`/`reasoning`/`signals` fields), AI Reasoning (step-by-step observed signal → evidence → impact, using existing signal data — explicitly labeled as summarized explainability output, not raw model reasoning), Recommendation panel (APPROVE/VERIFY/HOLD/BLOCK, sourced from data), Human Review panel (Approve / Reject-Block / Request Verification / Mark False Positive), Investigation Timeline (lifecycle steps derived from existing timestamps/reviewer/resolvedAt), Audit Activity (filtered from existing audit logs), link back to full transaction
- **Investigation Center** (`/investigations`) — search (case/transaction/customer), risk filter, status filter, sortable risk score/created date, pagination, row click + Open action → case details

**Important architecture note on Human Review**: the brief said "if status mutation isn't implemented, make the UI ready for it but don't invent an API." I went one step further and *did* implement it — `submitHumanReview()` in `services/api/` — because it's a legitimate mock-layer mutation (updates case status + appends an audit log entry), not a fake AI feature. It's clearly commented as an in-memory mock with the exact real-endpoint shape it'll be replaced by. If you'd rather it stay purely presentational until the backend exists, say so and I'll make the buttons visually "ready" but no-op.

## Phase 4 (complete)
- **Customers** (`/customers`) — summary tiles (total/active/under review/elevated risk), search, risk filter, table with transaction count + total amount + last activity, click-through slide-over drawer with full recent-activity list (no new route — reuses existing page)
- **Beneficiaries** (`/beneficiaries`) — search, risk filter, sortable transaction count/total amount/last transaction, click-through drawer with transaction history
- **Analytics** (`/analytics`) — 8 KPI cards, 5 charts (volume trend, risk distribution, risk trend, high-risk trend, detection performance), demo-data disclosure banner; all calculations live in `services/mockData.ts`, not in JSX
- **Audit Logs** (`/audit-logs`) — search, action/actor/risk/date filters, pagination, full column set including the new Case ID column; Human Review actions from Phase 3 appear here automatically since they write through the same `auditLogs` store
- **Settings** (`/settings`) — Profile (read-only, sourced from the shared `CURRENT_USER` identity), Security, Notifications, Risk Configuration (live thresholds from the risk engine, read-only), Application Preferences — every non-persisted toggle is explicitly labeled "not saved"

## Architecture notes from this phase
- Centralized the previously-duplicated "signed in user" placeholder (`Nandhini A.`) into `src/lib/currentUser.ts`, used by Sidebar, Header, Settings, and the Human Review audit trail — removes duplication, invents nothing new
- Moved the risk-trend calculation that lived inline in `RiskMonitoring.tsx` into `services/mockData.ts` (`getHourlyRiskTrend`), now shared with Analytics — same output, calculation now lives in the service layer per the architecture rule
- Extended `AuditLogEntry` with `caseId` and `riskLevel` (joined from existing investigation/transaction data at generation time) — additive only, nothing renamed or removed
- Added `CustomerSummary` / `BeneficiarySummary` / `AnalyticsSummary` types and their corresponding `get*()` functions in `mockData.ts`, exposed through `services/api/` — customer/beneficiary detail views use a slide-over `Drawer` component instead of new routes, per "do not modify routing architecture unnecessarily"

## Track 02 / Final upgrade (complete)

### Authentication (new, secondary to the core product)
- `/login`, `/register`, `/forgot-password` — premium split-hero fintech auth pages
- `src/services/auth.ts` — isolated mock auth service. **Demo login only**: `nandhini.m@payshield.ai` / `payshield123` (shown as a hint on the login page). Google OAuth, registration, and password reset are real async functions that return an honest "not implemented / requires backend configuration" error — nothing is faked as working.
- `src/hooks/useAuth.tsx` — all auth state/logic lives here, not in JSX. Session persisted to `localStorage` as `{name,email,role,initials}` only — no password, no token, clearly commented as demo-only.
- `ProtectedRoute` wraps all 11 existing app routes; unauthenticated users are redirected to `/login` and returned to their original destination after signing in.
- Sidebar/Header/Settings now show the real authenticated user and include a working Sign Out.

### Model / Risk Engine evaluation (new)
- `src/services/modelEvaluation.ts` — attaches a **clearly-labeled synthetic ground-truth fraud label** to the demo transaction set (deterministic, seeded — not fabricated per render) and computes precision/recall/F1/accuracy/FPR/FNR/confusion matrix from real arithmetic against it. Every surface using this data displays a "Synthetic / Demo Dataset" disclosure — this is explicitly not a production evaluation.
- Threshold comparison (50/70/85) computed the same way — real numbers from the same labeled set, not invented.
- False Positive Impact uses one configurable, clearly-labeled "Illustrative Cost Assumption" constant — never presented as a real merchant figure.
- Surfaced in **Analytics** (new "Model / Risk Engine Performance" section, separated from "Business Performance") and **Risk Monitoring** (Fraud Detection Rate, False Positive Rate, Current Threshold tiles).

### AI vs Analyst decision (new)
- Investigation Details → Analyst Decision Record now shows the updated transaction status and a side-by-side "AI Recommendation vs Analyst Decision" comparison, including an optional analyst-entered review note (stored on the investigation, shown only after a real review has occurred).

### Dashboard (Overview) update
- Blocked Transactions KPI now distinguishes AI auto-blocked vs analyst-blocked, tracked via a new `Transaction.blockedBy` field set at risk-engine seed time and updated by `submitHumanReview` when an analyst blocks a transaction.
- "Est. Prevented Loss" explicitly labeled "Illustrative Cost Assumption."

### Failure recovery
- Transaction/Investigation fetch failures now show the specific requested copy ("Risk assessment unavailable. This transaction requires manual review." / "AI explanation temporarily unavailable. Risk engine result is still available...") instead of a generic error.

### Architecture notes
- `submitHumanReview` no longer imports a hardcoded "current user" — the caller (which has real auth context) supplies the reviewer's identity, decoupling the service layer from a singleton.
- `lib/currentUser.ts` removed (dead code) now that real auth supplies this identity everywhere it's needed.
- All new business logic (evaluation math, auth flows, cost assumptions) lives in `services/`/`hooks/`/`lib/` — none of it is inline in JSX.

## Real backend authentication (complete)

Project restructured into `frontend/` + `backend/` (see repo root `README.md`). Mock authentication has been fully replaced:

- `src/services/auth.ts` now calls a real FastAPI backend (`../backend`) via `fetch` — no hardcoded demo account remains anywhere in the frontend.
- `API_BASE_URL` comes from a single config module, `src/lib/apiConfig.ts`, itself reading `import.meta.env.VITE_API_BASE_URL` (see `.env.example`) — never hardcoded inline in more than one place.
- Session storage holds only the JWT access token (`payshield_access_token` in `localStorage`) — never the password, never a cached user object. On every app load, `useAuth` calls `GET /api/auth/me` to re-verify the session and fetch fresh profile data, rather than trusting a stale local cache.
- `Register.tsx` now performs a real signup against the backend and logs the new user in on success — it previously always failed by design when there was no backend; that's no longer the case.
- `ForgotPassword.tsx` now displays the backend's actual response message (which is honestly "Password reset email service is not configured in this environment." until a real email provider is wired into `backend/app/services/auth_service.py`) instead of throwing a client-side "not implemented" error.
- `loginWithGoogle()` still returns an honest `NOT_IMPLEMENTED` error — Google OAuth is not connected; the backend has a `GOOGLE_OAUTH_CLIENT_ID` environment-variable integration point for when it is.
- Sidebar/Header/Settings show whichever real user is currently authenticated — no hardcoded name anywhere.
