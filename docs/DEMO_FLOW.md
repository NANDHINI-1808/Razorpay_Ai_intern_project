# PayShield AI — Demo Flow

A guided walkthrough for evaluating PayShield AI against Razorpay
Buildathon Track 02. Total time: ~7–9 minutes.

## Setup (see root README.md for full commands)

1. Start the backend: `cd backend && uvicorn app.main:app --reload --port 8000`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173`

## Walkthrough

1. **Login** (`/login`) — real backend authentication. If you don't have an account yet, click **Create account** to register (name/email/password → real bcrypt-hashed row in `backend/payshield.db`). There is no hardcoded demo account.
2. **Dashboard** (`/`) — hero + KPI cards (Transactions Analyzed, Suspicious, Blocked with AI-auto-blocked vs analyst-blocked split, Verification Required, Payment Verifications Pending), risk distribution chart, recent transactions.
3. **Live Transactions** (`/transactions`) — search, filter by risk/status/method/date, sort, open any row.
4. **A suspicious transaction** — pick one badged HIGH or CRITICAL → Transaction Details shows the full record: risk score, risk signals (if a case exists), AI recommendation, verification status (if applicable), audit timeline for that transaction.
5. **Risk Score → Risk Signals** — on the transaction, or continue to...
6. **Investigation** (`/investigations` → open a case) — the full AI Investigation Workspace:
   - Radial risk score + qualitative risk breakdown by category
   - "Why This Transaction Is Risky" signal cards (only real signals, never fabricated for low-risk cases)
   - Evidence
   - AI Investigation Summary (transaction summary / risk assessment / key findings / recommended action)
   - AI Reasoning (structured, signal-by-signal — explicitly labeled as summarized explainability output, not raw model reasoning)
7. **AI Decision Support** — recommended action (APPROVE/VERIFY/HOLD/BLOCK), AI confidence, risk level, and a plain-language "why AI recommended this."
8. **Human Review** — the prominent bordered panel. Choose Approve / Request Verification / Place on Hold / Block / Mark False Positive, optionally add a review note. Watch the success toast.
9. **Final Decision / Analyst Decision** — appears immediately below, **only now that a real review has happened** — shows the actual decision, actual reviewer (your logged-in name), actual timestamp, actual note, and an "AI Recommendation vs Analyst Decision" side-by-side comparison.
10. **Audit Log** (`/audit-logs`) — filter by transaction/case ID and confirm the "Case reviewed" entry you just created is there, with the correct previous→new status and your reviewer name.
11. **Verification Center** (`/verification`) — a separate, lighter-weight flow for MEDIUM-risk transactions (the "uncertain" tier between auto-approve and full investigation). Open a PENDING request → **Payment Verification Required** card shows sender→receiver, amount, risk score/level, and reason → click **Verify Payment** or **Reject Payment** → watch the toast (only appears after the mutation actually succeeds) → confirm the status badge updates, the linked transaction's status changes, and a `VERIFICATION_COMPLETED`/`VERIFICATION_REJECTED` audit entry appears both on the request's own audit trail and in `/audit-logs`. Try opening the same request twice and acting on it a second time from another tab — the second attempt is rejected with a real "already {status}" error, not silently overwritten.
12. **Analytics** (`/analytics`) — scroll past "Business Performance" to **"Model / Risk Engine Performance"**:
    - The synthetic-dataset disclosure banner
    - Precision / Recall / F1 / Accuracy / FPR / FNR (computed, not fixed)
    - Confusion matrix
    - **False Positive Impact** — count, rate, and cost, with "Illustrative Cost Assumption" explicitly labeled
    - **Risk Threshold Analysis** — the 50/70/85 comparison table, with an explanation of why 65 is the current operating threshold
    - Error Analysis — individual false-positive/false-negative examples from the synthetic set
13. **Logout** → confirm you land back on `/login`. **Refresh the page while logged in** at any point beforehand to confirm the session survives a reload (backend `/api/auth/me` re-verification, not a client-side cache).
14. **Invalid login** — try a wrong password once to see the real 401 error path, not a generic crash.

## What this demo intentionally does NOT claim

- Real Razorpay production transaction data — it's a disclosed synthetic dataset
- A genuine held-out ML test set — see `docs/MODEL_EVALUATION.md`
- Working Google OAuth — honestly reports "requires OAuth configuration"
- Working password-reset email — honestly reports "email service is not configured"
- An LLM as the fraud classifier — the ML layer is deterministic score/threshold logic; the AI layer is a structured explanation of that layer's output, not an independent model
- Real SMS/email/WhatsApp delivery for verification requests — the Verification Center card is explicitly labeled "Demo notification"
- Backend-persisted transactions/verification — see the architecture note in `docs/API.md` for why Verification deliberately stayed in the same frontend mock-service layer as Investigations, rather than becoming a second, independent, potentially-inconsistent source of truth
