// Thin async wrapper around mock data.
// Swap the bodies of these functions for real `fetch` calls to the FastAPI
// backend when it exists — signatures and return types stay the same.
import * as mock from '../mockData'
import { getModelPerformanceSummary } from '../modelEvaluation'
import type { AuditLogEntry, CaseStatus, Investigation, Transaction, VerificationRequest } from '@/types'

const delay = (ms = 250) => new Promise(res => setTimeout(res, ms))

export async function fetchKpis() {
  await delay()
  return mock.getKpis()
}
export async function fetchRiskDistribution() {
  await delay()
  return mock.getRiskDistribution()
}
export async function fetchTransactions(): Promise<Transaction[]> {
  await delay()
  return mock.transactions
}
export async function fetchTransaction(id: string): Promise<Transaction | undefined> {
  await delay()
  return mock.transactions.find(t => t.id === id)
}
export async function fetchCustomers() {
  await delay()
  return mock.customers
}
export async function fetchCustomerSummaries() {
  await delay()
  return mock.getCustomerSummaries()
}
export async function fetchBeneficiaries() {
  await delay()
  return mock.beneficiaries
}
export async function fetchBeneficiarySummaries() {
  await delay()
  return mock.getBeneficiarySummaries()
}
export async function fetchAnalyticsSummary() {
  await delay()
  return mock.getAnalyticsSummary()
}
export async function fetchHourlyRiskTrend() {
  await delay()
  return mock.getHourlyRiskTrend()
}
export async function fetchRiskThresholds() {
  await delay(100)
  return mock.RISK_THRESHOLDS
}
export async function fetchModelPerformance() {
  await delay(300)
  return getModelPerformanceSummary()
}
export async function fetchInvestigations(): Promise<Investigation[]> {
  await delay()
  return mock.investigations
}
export async function fetchInvestigation(id: string): Promise<Investigation | undefined> {
  await delay()
  return mock.investigations.find(i => i.id === id)
}
export async function fetchAuditLogs() {
  await delay()
  return mock.auditLogs
}

/**
 * Human-review action on an investigation case.
 *
 * This mutates the in-memory mock store — updating the investigation's
 * status, the linked transaction's status, and appending an audit log
 * entry — so the Investigation Center / Case Details UI is fully
 * interactive today. There is no persistence layer or real backend behind
 * it yet — when FastAPI exists, replace the body with a PATCH to
 * `/api/investigations/:id` and this function's signature/behavior
 * should not need to change from the caller's perspective.
 */
export type HumanReviewAction = 'APPROVE' | 'BLOCK' | 'HOLD' | 'REQUEST_VERIFICATION' | 'FALSE_POSITIVE'

const actionToCaseStatus: Record<HumanReviewAction, CaseStatus> = {
  APPROVE: 'VERIFIED',
  BLOCK: 'BLOCKED',
  HOLD: 'ON_HOLD',
  REQUEST_VERIFICATION: 'UNDER_REVIEW',
  FALSE_POSITIVE: 'FALSE_POSITIVE',
}
// Mirrors the case status onto the underlying transaction where the
// transaction status model has an equivalent state.
const actionToTransactionStatus: Record<HumanReviewAction, Transaction['status']> = {
  APPROVE: 'APPROVED',
  BLOCK: 'BLOCKED',
  HOLD: 'ON_HOLD',
  REQUEST_VERIFICATION: 'VERIFICATION_REQUIRED',
  FALSE_POSITIVE: 'APPROVED', // confirmed not fraud — transaction is cleared
}
const terminalStatuses: CaseStatus[] = ['VERIFIED', 'BLOCKED', 'FALSE_POSITIVE', 'RESOLVED']

export interface HumanReviewResult {
  investigation: Investigation
  transaction: Transaction | undefined
}

export async function submitHumanReview(
  caseId: string,
  action: HumanReviewAction,
  reviewerName: string,
  note?: string,
): Promise<HumanReviewResult> {
  await delay(400)
  const investigation = mock.investigations.find(i => i.id === caseId)
  if (!investigation) throw new Error(`Investigation ${caseId} not found`)

  const newStatus = actionToCaseStatus[action]
  const previousState = investigation.status
  investigation.status = newStatus
  investigation.reviewer = reviewerName
  investigation.reviewNote = note?.trim() || null
  if (terminalStatuses.includes(newStatus)) {
    investigation.resolvedAt = new Date().toISOString()
  }

  // Mirror the decision onto the underlying transaction where the
  // transaction status model supports it.
  const transaction = mock.transactions.find(t => t.id === investigation.transactionId)
  const previousTransactionStatus = transaction?.status ?? null
  if (transaction) {
    transaction.status = actionToTransactionStatus[action]
    transaction.blockedBy = action === 'BLOCK' ? 'ANALYST' : transaction.blockedBy
  }

  const logEntry: AuditLogEntry = {
    id: `LOG-${9000 + mock.auditLogs.length}`,
    timestamp: new Date().toISOString(),
    actor: reviewerName,
    action: 'Case reviewed',
    transactionId: investigation.transactionId,
    caseId: investigation.id,
    riskLevel: investigation.riskLevel,
    previousState,
    newState: newStatus,
    reason: (investigation.reviewNote ? `${investigation.reviewNote} ` : '') +
      `Analyst submitted "${action.replace(/_/g, ' ').toLowerCase()}" on ${caseId}` +
      (transaction ? ` — transaction status updated ${previousTransactionStatus} → ${transaction.status}.` : '.'),
    aiModel: null,
    confidence: null,
  }
  mock.auditLogs.unshift(logEntry)

  return { investigation, transaction }
}

// ─── Third-party payment verification ─────────────────────────────────────

export async function fetchVerificationRequests(): Promise<VerificationRequest[]> {
  await delay()
  return mock.getVerificationRequests()
}

export async function fetchVerificationRequest(id: string): Promise<VerificationRequest | undefined> {
  await delay()
  return mock.getVerificationRequest(id)
}

export type VerificationDecisionAction = 'VERIFY' | 'REJECT'

export interface VerificationDecisionResult {
  verification: VerificationRequest
  transaction: Transaction | undefined
}

/**
 * Server-side-style state machine: only PENDING → VERIFIED or
 * PENDING → REJECTED are valid transitions here. Anything else (already
 * decided, or expired since the page loaded) is rejected with a clear
 * error rather than silently overwriting a prior decision.
 */
export async function submitVerificationDecision(
  id: string,
  action: VerificationDecisionAction,
  reviewerName: string,
  note?: string,
): Promise<VerificationDecisionResult> {
  await delay(400)

  // Re-sync expiry first — a request may have expired between page load and this call.
  const verification = mock.getVerificationRequest(id)
  if (!verification) throw new Error(`Verification request ${id} not found`)
  if (verification.status !== 'PENDING') {
    throw new Error(`This verification request is already ${verification.status} and cannot be changed.`)
  }

  const previousState = verification.status
  const newState: VerificationRequest['status'] = action === 'VERIFY' ? 'VERIFIED' : 'REJECTED'
  verification.status = newState
  verification.verifiedAt = new Date().toISOString()
  verification.verifiedBy = reviewerName
  verification.decisionNote = note?.trim() || null

  const transaction = mock.transactions.find(t => t.id === verification.transactionId)
  const previousTransactionStatus = transaction?.status ?? null
  if (transaction) {
    transaction.status = action === 'VERIFY' ? 'APPROVED' : 'BLOCKED'
    transaction.blockedBy = action === 'REJECT' ? 'ANALYST' : transaction.blockedBy
  }

  const logEntry: AuditLogEntry = {
    id: `LOG-${9000 + mock.auditLogs.length}`,
    timestamp: new Date().toISOString(),
    actor: reviewerName,
    action: action === 'VERIFY' ? 'VERIFICATION_COMPLETED' : 'VERIFICATION_REJECTED',
    transactionId: verification.transactionId,
    caseId: null,
    riskLevel: verification.riskLevel,
    previousState,
    newState,
    reason: (verification.decisionNote ? `${verification.decisionNote} ` : '') +
      `Verification request ${id} ${action === 'VERIFY' ? 'verified' : 'rejected'} by ${reviewerName}` +
      (transaction ? ` — transaction status updated ${previousTransactionStatus} → ${transaction.status}.` : '.'),
    aiModel: null,
    confidence: null,
  }
  mock.auditLogs.unshift(logEntry)

  return { verification, transaction }
}
