# PayShield AI — API Documentation

Two distinct API surfaces exist. **They must not be confused**: one is a
real HTTP backend, the other is an in-process typed service layer over a
synthetic dataset.

---

## 1. Backend HTTP API (real) — Authentication only

Base URL: `http://127.0.0.1:8000` (configurable via `VITE_API_BASE_URL`)

All endpoints are under `/api/auth`. Source: `backend/app/api/routes/auth.py`.

### POST `/api/auth/register`
Creates a user with a bcrypt-hashed password.

**Request**
```json
{ "name": "Jane Doe", "email": "jane@company.com", "password": "at-least-8-chars", "confirm_password": "at-least-8-chars" }
```
**Response** `201 Created`
```json
{ "access_token": "<jwt>", "token_type": "bearer", "user": { "id": "...", "name": "Jane Doe", "email": "jane@company.com", "role": "Risk Analyst", "initials": "JD", "created_at": "..." } }
```
**Errors**: `409` duplicate email · `422` validation (password length, password mismatch, invalid email)

### POST `/api/auth/login`
**Request**: `{ "email": "...", "password": "..." }`
**Response**: same shape as register.
**Errors**: `401` incorrect email or password (generic message — does not reveal which field is wrong)

### GET `/api/auth/me`
**Auth**: `Authorization: Bearer <token>` required
**Response**: the `user` object shown above.
**Errors**: `401` if the token is missing, invalid, or expired.

### POST `/api/auth/logout`
Stateless JWT — this endpoint is a no-op acknowledgement (`{"message": "Signed out."}`). The frontend discards the token client-side regardless of this call's outcome. **No server-side token revocation exists in this build.**

### POST `/api/auth/forgot-password`
**Request**: `{ "email": "..." }`
**Response**: `200` always, with an honest message:
> "Password reset email service is not configured in this environment."

No email is ever sent. This is intentional — see `docs/MODEL_EVALUATION.md`'s sibling honesty principle applied to auth: no fake success.

### POST `/api/auth/reset-password`
**Response**: `501 Not Implemented` — `"Password reset is not available until an email delivery provider is configured."` Real integration point, not wired to a provider.

### Google OAuth
Not a backend endpoint. The frontend's `loginWithGoogle()` always returns `NOT_IMPLEMENTED` — `"Google sign-in requires OAuth configuration."` `GOOGLE_OAUTH_CLIENT_ID` exists as an environment variable integration point in `backend/app/core/config.py`, currently unset.

---

## 2. Frontend service layer (mock) — Transactions, Risk, Investigations, Verification, Analytics

**This is not an HTTP API.** These are typed async TypeScript functions in
`frontend/src/services/api/index.ts` that read from an in-memory synthetic
dataset (`frontend/src/services/mockData.ts`) with an artificial network
delay. Every page/component calls these functions — never the mock data
directly — so a real backend can be substituted later by changing only
the function bodies.

> **Why Verification isn't a backend feature, deliberately.** An earlier
> revision considered making Verification a real FastAPI-backed feature.
> That was rejected: transactions only exist as a seeded-random synthetic
> dataset in the frontend, and the backend has no transactions table. Making
> Verification backend-real would have required porting the frontend's
> exact PRNG sequence into Python so transaction IDs/risk scores lined up
> between the two — a fragile duplication where the slightest drift would
> show *different* risk data for the same transaction ID depending which
> page you're on. That's a worse outcome than keeping Verification in the
> same, single, already-established source of truth as Investigations and
> Audit Logs. If transactions are ever moved into the backend for real,
> Verification should move with them at that point, not before.

| Function | Returns | Notes |
|---|---|---|
| `fetchKpis()` | Dashboard KPI cards | Computed from the synthetic transaction set |
| `fetchTransactions()` / `fetchTransaction(id)` | `Transaction[]` / `Transaction \| undefined` | |
| `fetchRiskDistribution()` / `fetchHourlyRiskTrend()` | Risk chart data | Derived from transaction timestamps/scores |
| `fetchInvestigations()` / `fetchInvestigation(id)` | `Investigation[]` / `Investigation \| undefined` | HIGH/CRITICAL transactions only |
| `submitHumanReview(caseId, action, reviewerName, note?)` | `{investigation, transaction}` | **A real mutation.** Updates case + transaction status, appends an audit log entry. See below. |
| `fetchVerificationRequests()` / `fetchVerificationRequest(id)` | `VerificationRequest[]` / `VerificationRequest \| undefined` | MEDIUM-risk transactions — the "uncertain" tier between auto-approve (LOW) and the Investigation/Human Review flow (HIGH/CRITICAL) |
| `submitVerificationDecision(id, action, reviewerName, note?)` | `{verification, transaction}` | **A real mutation.** VERIFY/REJECT, server-side-style state machine (PENDING→VERIFIED/REJECTED only — rejects any other transition with a real error), mirrors transaction status, appends an audit log entry (`VERIFICATION_COMPLETED`/`VERIFICATION_REJECTED`). A `VERIFICATION_REQUESTED` audit entry is also seeded per request at generation time, and `VERIFICATION_EXPIRED` is applied lazily (and logged once) whenever a PENDING request is read past its `expiresAt`. |
| `fetchCustomerSummaries()` / `fetchBeneficiarySummaries()` | Joined/aggregated views | Computed in `mockData.ts`, not in components |
| `fetchAnalyticsSummary()` | Business KPIs + chart data | |
| `fetchModelPerformance()` | `ModelPerformanceSummary` | See `docs/MODEL_EVALUATION.md` — **synthetic dataset, clearly disclosed** |
| `fetchRiskThresholds()` | Current LOW/MEDIUM/HIGH/CRITICAL cutoffs | Read-only |
| `fetchAuditLogs()` | `AuditLogEntry[]` | |

### `submitHumanReview` contract
```ts
submitHumanReview(caseId: string, action: HumanReviewAction, reviewerName: string, note?: string): Promise<{ investigation: Investigation; transaction: Transaction | undefined }>
```
`HumanReviewAction` = `APPROVE | BLOCK | HOLD | REQUEST_VERIFICATION | FALSE_POSITIVE`

On success it: updates `investigation.status`, sets `investigation.reviewer`/`reviewNote`/`resolvedAt` (if terminal), mirrors an equivalent status onto the linked `transaction` (and sets `blockedBy: 'ANALYST'` for a Block action), and unshifts a new `AuditLogEntry` — all in one place, in the service layer, never in JSX.

---

## Authentication requirement summary

| Endpoint | Auth required |
|---|---|
| `/api/auth/register`, `/login`, `/forgot-password`, `/reset-password` | No |
| `/api/auth/me` | Yes (Bearer token) |
| `/api/auth/logout` | No (best-effort; token discarded client-side either way) |
| All frontend mock service functions | No backend auth check — protected only at the route level in the frontend (`ProtectedRoute`) |
