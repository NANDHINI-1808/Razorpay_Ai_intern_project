export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type TransactionStatus =
  | 'APPROVED'
  | 'PENDING_REVIEW'
  | 'VERIFICATION_REQUIRED'
  | 'ON_HOLD'
  | 'BLOCKED'
  | 'FLAGGED'

export interface Transaction {
  id: string
  customerId: string
  customerName: string
  amount: number
  currency: string
  method: 'UPI' | 'Card' | 'Bank Transfer' | 'Wallet'
  beneficiary: string
  location: string
  device: string
  timestamp: string
  riskScore: number
  riskLevel: RiskLevel
  status: TransactionStatus
  aiRecommendation: string
  /** Who caused the current BLOCKED status, if applicable. Undefined when status isn't BLOCKED. */
  blockedBy?: 'AI' | 'ANALYST'
}

export interface Customer {
  id: string
  name: string
  email: string
  accountAge: string
  totalTransactions: number
  riskProfile: RiskLevel
  status: 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW'
}

export interface Beneficiary {
  id: string
  name: string
  accountRef: string
  bank: string
  linkedCustomers: number
  riskFlag: RiskLevel
  addedOn: string
}

export type CaseStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ON_HOLD'
  | 'VERIFIED'
  | 'BLOCKED'
  | 'FALSE_POSITIVE'
  | 'RESOLVED'

export type RecommendedAction = 'APPROVE' | 'VERIFY' | 'HOLD' | 'BLOCK'

export interface AISignal {
  label: string
  detail: string
  severity: RiskLevel
}

export interface Investigation {
  id: string
  transactionId: string
  customerName: string
  riskScore: number
  riskLevel: RiskLevel
  status: CaseStatus
  reviewer: string | null
  reviewNote: string | null
  createdAt: string
  resolvedAt: string | null
  signals: AISignal[]
  recommendedAction: RecommendedAction
  evidence: string[]
  aiSummary: string
  reasoning: string
  recommendation: string
  confidence: number
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  transactionId: string | null
  caseId: string | null
  riskLevel: RiskLevel | null
  previousState: string | null
  newState: string | null
  reason: string
  aiModel: string | null
  confidence: number | null
}

export interface KPI {
  label: string
  value: string
  supportingText: string
  trend?: { direction: 'up' | 'down'; value: string }
}

export interface CustomerSummary extends Customer {
  totalAmount: number
  lastActivityAt: string | null
  recentTransactions: Transaction[]
}

export interface BeneficiarySummary extends Beneficiary {
  transactionCount: number
  totalAmount: number
  lastTransactionAt: string | null
  primaryCustomer: string | null
  transactions: Transaction[]
}

export interface TrendPoint {
  label: string
  value: number
}

export interface CaseOutcome {
  status: CaseStatus
  count: number
}

export interface RiskBreakdownFactor {
  category: 'Device Risk' | 'Transaction Risk' | 'Behaviour Risk' | 'Location Risk'
  severity: RiskLevel | null // null = no signal touched this category for this case
}

export interface AnalyticsSummary {
  kpis: KPI[]
  volumeTrend: TrendPoint[]
  riskDistribution: { level: RiskLevel; count: number }[]
  riskTrend: TrendPoint[]
  highRiskTrend: TrendPoint[]
  detectionPerformance: CaseOutcome[]
}

// ─── Authentication (demo/mock — see services/auth.ts) ───────────────────
export interface AuthUser {
  name: string
  email: string
  role: string
  initials: string
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'NETWORK_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'SESSION_EXPIRED'

export interface AuthError {
  code: AuthErrorCode
  message: string
}

// ─── Model / risk-engine evaluation ───────────────────────────────────────
export interface ConfusionMatrix {
  truePositive: number
  falsePositive: number
  falseNegative: number
  trueNegative: number
}

export interface ModelMetrics {
  threshold: number
  confusionMatrix: ConfusionMatrix
  precision: number | null
  recall: number | null
  f1: number | null
  accuracy: number | null
  falsePositiveRate: number | null
  falseNegativeRate: number | null
}

export interface FalsePositiveImpact {
  falsePositiveCount: number
  falsePositiveRate: number | null
  estimatedTransactionsImpacted: number
  estimatedMerchantCost: number
  costPerFalsePositive: number
  isIllustrativeAssumption: true
}

export interface ErrorExample {
  transactionId: string
  customerName: string
  riskScore: number
  riskLevel: RiskLevel
  predictedSuspicious: boolean
  actualFraud: boolean
  kind: 'FALSE_POSITIVE' | 'FALSE_NEGATIVE'
}

export interface ModelPerformanceSummary {
  datasetLabel: 'Synthetic / Demo Dataset'
  datasetDisclosure: string
  operatingThreshold: number
  metricsAtOperatingThreshold: ModelMetrics
  thresholdComparison: ModelMetrics[]
  falsePositiveImpact: FalsePositiveImpact
  falsePositiveExamples: ErrorExample[]
  falseNegativeExamples: ErrorExample[]
}

// ─── Third-party payment verification ─────────────────────────────────────
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'

export interface VerificationRequest {
  id: string
  transactionId: string
  senderId: string
  senderName: string
  receiverName: string
  amount: number
  currency: string
  paymentMethod: Transaction['method']
  requestedBy: string
  verificationType: string
  status: VerificationStatus
  reason: string
  riskScore: number
  riskLevel: RiskLevel
  createdAt: string
  expiresAt: string
  verifiedAt: string | null
  verifiedBy: string | null
  decisionNote: string | null
}
