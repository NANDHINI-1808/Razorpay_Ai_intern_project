import type {
  Transaction, Customer, Beneficiary, Investigation, AuditLogEntry, KPI,
  CustomerSummary, BeneficiarySummary, AnalyticsSummary, TrendPoint, CaseOutcome, CaseStatus, RiskLevel,
  VerificationRequest, VerificationStatus,
} from '@/types'

const names = ['Aarav Mehta', 'Priya Nair', 'Rohan Iyer', 'Sneha Kapoor', 'Vikram Rao', 'Isha Sharma', 'Karan Patel', 'Meera Joshi']
const methods: Transaction['method'][] = ['UPI', 'Card', 'Bank Transfer', 'Wallet']
const locations = ['Chennai, IN', 'Mumbai, IN', 'Bengaluru, IN', 'Delhi, IN', 'Singapore', 'Dubai, AE']
const devices = ['iPhone 15 · iOS 18', 'Chrome · Windows 11', 'Samsung S24 · Android 15', 'Safari · macOS']

// Current thresholds used by the risk engine below. Surfaced read-only in
// Settings > Risk Configuration — this is the actual logic in use, not a
// separately-invented "setting".
export const RISK_THRESHOLDS = { CRITICAL: 85, HIGH: 65, MEDIUM: 35 } as const

function seedRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}
const rand = seedRandom(42)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const riskLevelFor = (score: number) =>
  score >= RISK_THRESHOLDS.CRITICAL ? 'CRITICAL' : score >= RISK_THRESHOLDS.HIGH ? 'HIGH' : score >= RISK_THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW'

export const transactions: Transaction[] = Array.from({ length: 28 }).map((_, i) => {
  const score = Math.floor(rand() * 100)
  const level = riskLevelFor(score) as Transaction['riskLevel']
  const status: Transaction['status'] =
    level === 'CRITICAL' ? 'BLOCKED' :
    level === 'HIGH' ? 'VERIFICATION_REQUIRED' :
    level === 'MEDIUM' ? 'PENDING_REVIEW' : 'APPROVED'
  return {
    id: `TXN-${(10450 + i).toString()}`,
    customerId: `CUST-${1000 + (i % 8)}`,
    customerName: pick(names),
    amount: Math.round((rand() * 95000 + 500) * 100) / 100,
    currency: 'INR',
    method: pick(methods),
    beneficiary: `Beneficiary ${String.fromCharCode(65 + (i % 12))}`,
    location: pick(locations),
    device: pick(devices),
    timestamp: new Date(Date.now() - i * 47 * 60_000).toISOString(),
    riskScore: score,
    riskLevel: level,
    status,
    blockedBy: status === 'BLOCKED' ? 'AI' : undefined,
    aiRecommendation:
      level === 'CRITICAL' ? 'Block transaction and freeze linked account for manual review.' :
      level === 'HIGH' ? 'Request step-up verification before releasing funds.' :
      level === 'MEDIUM' ? 'Monitor; no immediate action required.' :
      'No action required.',
  }
})

export const customers: Customer[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `CUST-${1000 + i}`,
  name: names[i],
  email: `${names[i].toLowerCase().replace(' ', '.')}@mail.com`,
  accountAge: `${1 + (i % 4)} yr ${i % 12} mo`,
  totalTransactions: 20 + i * 7,
  riskProfile: riskLevelFor(Math.floor(rand() * 100)) as Customer['riskProfile'],
  status: i === 3 ? 'UNDER_REVIEW' : i === 6 ? 'SUSPENDED' : 'ACTIVE',
}))

export const beneficiaries: Beneficiary[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `BENE-${2000 + i}`,
  name: `Beneficiary ${String.fromCharCode(65 + i)}`,
  accountRef: `XXXX-XXXX-${4000 + i}`,
  bank: pick(['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra']),
  linkedCustomers: 1 + (i % 5),
  riskFlag: riskLevelFor(Math.floor(rand() * 100)) as Beneficiary['riskFlag'],
  addedOn: new Date(Date.now() - i * 30 * 86_400_000).toISOString(),
}))

export const investigations: Investigation[] = transactions
  .filter(t => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL')
  .map((t, i) => ({
    id: `CASE-${5000 + i}`,
    transactionId: t.id,
    customerName: t.customerName,
    riskScore: t.riskScore,
    riskLevel: t.riskLevel,
    status: (['OPEN', 'UNDER_REVIEW', 'VERIFIED', 'BLOCKED', 'RESOLVED'] as const)[i % 5],
    reviewer: i % 3 === 0 ? null : pick(['A. Krishnan', 'S. Fernandes', 'N. Devi']),
    reviewNote: null,
    createdAt: t.timestamp,
    resolvedAt: i % 4 === 0 ? new Date(Date.now() - i * 3600_000).toISOString() : null,
    signals: [
      { label: 'New beneficiary, high value', detail: `First transfer to ${t.beneficiary} exceeding ₹40,000.`, severity: 'HIGH' },
      { label: 'Device mismatch', detail: 'Login device differs from last 5 sessions.', severity: 'MEDIUM' },
      { label: 'Velocity anomaly', detail: '3 transactions within 10 minutes, above customer baseline.', severity: t.riskLevel },
    ],
    // CRITICAL risk consistently escalates to a hard block; HIGH risk is routed to
    // step-up verification. This mirrors the wording already used in aiRecommendation.
    recommendedAction: t.riskLevel === 'CRITICAL' ? 'BLOCK' : 'VERIFY',
    evidence: [
      `Transaction ${t.id} initiated from ${t.location}.`,
      `Device fingerprint: ${t.device}.`,
      'Behavioral pattern deviates from 90-day customer baseline.',
    ],
    aiSummary: `Transaction ${t.id} shows a ${t.riskLevel.toLowerCase()}-risk pattern consistent with social-engineering scam indicators, driven by an unfamiliar beneficiary and atypical transaction velocity.`,
    reasoning: 'Model weighted beneficiary novelty, transaction velocity, and device trust score above the confidence threshold for automatic escalation.',
    recommendation: t.aiRecommendation,
    confidence: 72 + (t.riskScore % 25),
  }))

// ─── Third-party payment verification ─────────────────────────────────────
// MEDIUM risk is the "uncertain" tier: LOW continues automatically, HIGH/
// CRITICAL already route to the Investigation Center above, so MEDIUM is
// where a lightweight sender→receiver verification request applies —
// "verify before money moves" without a full investigation case.
export const verificationRequests: VerificationRequest[] = transactions
  .filter(t => t.riskLevel === 'MEDIUM')
  .map((t, i) => {
    const createdAt = t.timestamp
    const expiresAt = new Date(new Date(createdAt).getTime() + 4 * 3600_000).toISOString()
    return {
      id: `VER-${6000 + i}`,
      transactionId: t.id,
      senderId: t.customerId,
      senderName: t.customerName,
      receiverName: t.beneficiary,
      amount: t.amount,
      currency: t.currency,
      paymentMethod: t.method,
      requestedBy: 'PayShield AI Risk Engine',
      verificationType: 'Step-up Verification',
      // Always seeded PENDING — a status of VERIFIED/REJECTED is only ever
      // set by a real action in submitVerificationDecision(), never seeded.
      status: 'PENDING' as VerificationStatus,
      reason: `${t.customerName}'s transfer to ${t.beneficiary} differs from their typical transaction pattern — additional verification is required before this payment can proceed.`,
      riskScore: t.riskScore,
      riskLevel: t.riskLevel,
      createdAt,
      expiresAt,
      verifiedAt: null,
      verifiedBy: null,
      decisionNote: null,
    }
  })

// Requests whose PENDING→EXPIRED transition (and matching audit entry) has
// already been applied, so re-reading the list doesn't duplicate audit events.
const expiredAudited = new Set<string>()

/** Lazily flips any PENDING request past its expiry to EXPIRED and logs it once. Called by every read path below. */
function syncExpiredVerifications() {
  const now = Date.now()
  for (const v of verificationRequests) {
    if (v.status !== 'PENDING') continue
    if (new Date(v.expiresAt).getTime() >= now) continue
    v.status = 'EXPIRED'
    if (expiredAudited.has(v.id)) continue
    expiredAudited.add(v.id)
    auditLogs.unshift({
      id: `LOG-${9000 + auditLogs.length}`,
      timestamp: v.expiresAt,
      actor: 'PayShield AI Risk Engine',
      action: 'VERIFICATION_EXPIRED',
      transactionId: v.transactionId,
      caseId: null,
      riskLevel: v.riskLevel,
      previousState: 'PENDING',
      newState: 'EXPIRED',
      reason: `Verification request ${v.id} expired without a reviewer decision.`,
      aiModel: null,
      confidence: null,
    })
  }
}

export const auditLogs: AuditLogEntry[] = transactions.slice(0, 18).map((t, i) => {
  const relatedCase = investigations.find(c => c.transactionId === t.id)
  return {
    id: `LOG-${9000 + i}`,
    timestamp: t.timestamp,
    actor: i % 3 === 0 ? 'AI Risk Engine' : pick(['A. Krishnan', 'S. Fernandes', 'System']),
    action: i % 3 === 0 ? 'Risk score computed' : i % 3 === 1 ? 'Status updated' : 'Case reviewed',
    transactionId: t.id,
    caseId: relatedCase?.id ?? null,
    riskLevel: t.riskLevel,
    previousState: i % 3 === 1 ? 'PENDING_REVIEW' : null,
    newState: i % 3 === 1 ? t.status : null,
    reason: i % 3 === 0 ? 'Automated scoring on transaction ingestion.' : 'Manual review completed by analyst.',
    aiModel: i % 3 === 0 ? 'payshield-risk-v3.2' : null,
    confidence: i % 3 === 0 ? 80 + (i % 15) : null,
  }
})

// Seed a VERIFICATION_REQUESTED audit entry for each request created above —
// this is the "requested" event; VERIFICATION_COMPLETED/REJECTED/EXPIRED are
// appended live by submitVerificationDecision() / syncExpiredVerifications().
verificationRequests.forEach((v, i) => {
  auditLogs.push({
    id: `LOG-${9200 + i}`,
    timestamp: v.createdAt,
    actor: v.requestedBy,
    action: 'VERIFICATION_REQUESTED',
    transactionId: v.transactionId,
    caseId: null,
    riskLevel: v.riskLevel,
    previousState: null,
    newState: 'PENDING',
    reason: v.reason,
    aiModel: 'payshield-risk-v3.2',
    confidence: null,
  })
})

export function getKpis(): KPI[] {
  syncExpiredVerifications()
  const total = transactions.length
  const suspicious = transactions.filter(t => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL').length
  const blocked = transactions.filter(t => t.status === 'BLOCKED').length
  const aiBlocked = transactions.filter(t => t.status === 'BLOCKED' && t.blockedBy === 'AI').length
  const analystBlocked = transactions.filter(t => t.status === 'BLOCKED' && t.blockedBy === 'ANALYST').length
  const avgRisk = Math.round(transactions.reduce((s, t) => s + t.riskScore, 0) / total)
  const prevented = transactions.filter(t => t.status === 'BLOCKED').reduce((s, t) => s + t.amount, 0)
  const pendingVerifications = verificationRequests.filter(v => v.status === 'PENDING').length
  return [
    { label: 'Transactions Analyzed', value: total.toLocaleString(), supportingText: 'Last 24 hours (synthetic dataset)' },
    { label: 'Suspicious Transactions', value: suspicious.toString(), supportingText: 'High + critical risk' },
    { label: 'Blocked Transactions', value: blocked.toString(), supportingText: `${aiBlocked} AI auto-blocked · ${analystBlocked} analyst-blocked` },
    { label: 'Est. Prevented Loss', value: `₹${(prevented / 1000).toFixed(1)}K`, supportingText: 'Illustrative Cost Assumption — sum of blocked transaction amounts' },
    { label: 'Average Risk Score', value: avgRisk.toString(), supportingText: 'Out of 100' },
    { label: 'Verification Required', value: transactions.filter(t => t.status === 'VERIFICATION_REQUIRED').length.toString(), supportingText: 'Awaiting step-up auth' },
    { label: 'Payment Verifications Pending', value: pendingVerifications.toString(), supportingText: 'Sender/receiver verification requests' },
  ]
}

export function getRiskDistribution() {
  const levels: Transaction['riskLevel'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  return levels.map(level => ({
    level,
    count: transactions.filter(t => t.riskLevel === level).length,
  }))
}

function hourKey(iso: string) {
  return `${new Date(iso).getHours().toString().padStart(2, '0')}:00`
}

/** Average risk score per hour, derived from existing transaction timestamps/scores. */
export function getHourlyRiskTrend(): TrendPoint[] {
  const buckets = new Map<string, { sum: number; count: number }>()
  for (const t of transactions) {
    const key = hourKey(t.timestamp)
    const b = buckets.get(key) ?? { sum: 0, count: 0 }
    b.sum += t.riskScore
    b.count += 1
    buckets.set(key, b)
  }
  return Array.from(buckets.entries())
    .map(([label, { sum, count }]) => ({ label, value: Math.round(sum / count) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** Transaction count per hour, derived from existing timestamps. */
export function getHourlyVolumeTrend(): TrendPoint[] {
  const buckets = new Map<string, number>()
  for (const t of transactions) {
    const key = hourKey(t.timestamp)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return Array.from(buckets.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** Count of high+critical risk transactions per hour. */
export function getHourlyHighRiskTrend(): TrendPoint[] {
  const buckets = new Map<string, number>()
  for (const t of transactions) {
    if (t.riskLevel !== 'HIGH' && t.riskLevel !== 'CRITICAL') continue
    const key = hourKey(t.timestamp)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return Array.from(buckets.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Proxy for "detection performance": the breakdown of how investigated
 * cases were ultimately resolved (verified/blocked/false-positive/etc).
 * Derived entirely from existing investigation case statuses — there is
 * no ground-truth fraud label in this dataset to compute true precision/recall.
 */
export function getCaseOutcomeBreakdown(): CaseOutcome[] {
  const statuses: CaseStatus[] = ['OPEN', 'UNDER_REVIEW', 'ON_HOLD', 'VERIFIED', 'BLOCKED', 'FALSE_POSITIVE', 'RESOLVED']
  return statuses.map(status => ({
    status,
    count: investigations.filter(c => c.status === status).length,
  })).filter(s => s.count > 0)
}

export function getCustomerSummaries(): CustomerSummary[] {
  return customers.map(c => {
    const custTxns = transactions
      .filter(t => t.customerId === c.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return {
      ...c,
      totalAmount: custTxns.reduce((s, t) => s + t.amount, 0),
      lastActivityAt: custTxns[0]?.timestamp ?? null,
      recentTransactions: custTxns.slice(0, 5),
    }
  })
}

export function getBeneficiarySummaries(): BeneficiarySummary[] {
  return beneficiaries.map(b => {
    const relatedTxns = transactions
      .filter(t => t.beneficiary === b.name)
      .sort((a, b2) => new Date(b2.timestamp).getTime() - new Date(a.timestamp).getTime())
    return {
      ...b,
      transactionCount: relatedTxns.length,
      totalAmount: relatedTxns.reduce((s, t) => s + t.amount, 0),
      lastTransactionAt: relatedTxns[0]?.timestamp ?? null,
      primaryCustomer: relatedTxns[0]?.customerName ?? null,
      transactions: relatedTxns,
    }
  })
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const total = transactions.length
  const suspicious = transactions.filter(t => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL').length
  const high = transactions.filter(t => t.riskLevel === 'HIGH').length
  const critical = transactions.filter(t => t.riskLevel === 'CRITICAL').length
  const avgRisk = Math.round(transactions.reduce((s, t) => s + t.riskScore, 0) / total)
  const detectionRate = Math.round((suspicious / total) * 100)
  const preventedLoss = transactions.filter(t => t.status === 'BLOCKED').reduce((s, t) => s + t.amount, 0)

  const kpis: KPI[] = [
    { label: 'Total Transactions', value: total.toLocaleString(), supportingText: 'All monitored transactions' },
    { label: 'Transactions Analyzed', value: total.toLocaleString(), supportingText: '100% coverage by risk engine' },
    { label: 'Suspicious Transactions', value: suspicious.toString(), supportingText: 'High + critical risk' },
    { label: 'High Risk Transactions', value: high.toString(), supportingText: 'Risk score 65–84' },
    { label: 'Critical Transactions', value: critical.toString(), supportingText: 'Risk score 85+' },
    { label: 'Detection Rate', value: `${detectionRate}%`, supportingText: 'Suspicious / total (demo metric)' },
    { label: 'Average Risk Score', value: avgRisk.toString(), supportingText: 'Out of 100' },
    { label: 'Potential Loss Prevented', value: `₹${(preventedLoss / 1000).toFixed(1)}K`, supportingText: 'Illustrative Cost Assumption — sum of blocked transaction amounts' },
  ]

  return {
    kpis,
    volumeTrend: getHourlyVolumeTrend(),
    riskDistribution: getRiskDistribution(),
    riskTrend: getHourlyRiskTrend(),
    highRiskTrend: getHourlyHighRiskTrend(),
    detectionPerformance: getCaseOutcomeBreakdown(),
  }
}

export function getVerificationRequests(): VerificationRequest[] {
  syncExpiredVerifications()
  return verificationRequests
}

export function getVerificationRequest(id: string): VerificationRequest | undefined {
  syncExpiredVerifications()
  return verificationRequests.find(v => v.id === id)
}
