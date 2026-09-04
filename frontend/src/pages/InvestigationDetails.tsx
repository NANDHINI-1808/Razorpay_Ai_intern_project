import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAuditLogs, fetchInvestigation, fetchTransaction } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/States'
import { RiskGauge } from '@/components/investigation/RiskGauge'
import { RiskBreakdown } from '@/components/investigation/RiskBreakdown'
import { RecommendationPanel } from '@/components/investigation/RecommendationPanel'
import { HumanReviewPanel } from '@/components/investigation/HumanReviewPanel'
import { formatCurrency, formatDateTime } from '@/lib/format'
import {
  getConfidenceLabel, getNextBestAction, getRecommendationExplanation, getRiskBreakdown,
} from '@/lib/investigationInsights'
import {
  ArrowLeft, Bot, CheckCircle2, Circle, ClipboardList, Compass, FileSearch,
  Gauge, ScrollText, ShieldAlert, Sparkles, UserCog,
} from 'lucide-react'

export default function InvestigationDetails() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()

  const investigation = useQuery({
    queryKey: ['investigation', caseId],
    queryFn: () => fetchInvestigation(caseId!),
    enabled: !!caseId,
  })
  const transaction = useQuery({
    queryKey: ['transaction', investigation.data?.transactionId],
    queryFn: () => fetchTransaction(investigation.data!.transactionId),
    enabled: !!investigation.data,
  })
  const auditLogs = useQuery({ queryKey: ['audit-logs'], queryFn: fetchAuditLogs })

  const isLoading = investigation.isLoading || (investigation.data && transaction.isLoading) || auditLogs.isLoading
  const relatedLogs = (auditLogs.data ?? [])
    .filter(l => l.transactionId === investigation.data?.transactionId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const latestReviewLog = relatedLogs.find(l => l.action === 'Case reviewed')

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/investigations')}
        className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Investigation Center
      </button>

      {isLoading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <CardSkeleton className="h-44 lg:col-span-3" />
          <CardSkeleton className="h-72 lg:col-span-2" />
          <CardSkeleton className="h-72" />
        </div>
      )}

      {!isLoading && investigation.isError && (
        <ErrorState message="AI explanation temporarily unavailable. Risk engine result is still available on the transaction record — please retry, or open the transaction directly." />
      )}

      {!isLoading && !investigation.isError && !investigation.data && (
        <EmptyState icon={ShieldAlert} title="Case not found" description={`No investigation matches ID "${caseId}".`} />
      )}

      {investigation.data && transaction.data && (
        <>
          {/* Header */}
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-600">
                  <Sparkles className="h-3 w-3" />
                  AI INVESTIGATION
                </span>
                <h2 className="mt-2 font-[var(--font-display)] text-[22px] font-semibold text-ink-900">{investigation.data.id}</h2>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  Transaction <span className="font-medium text-ink-700">{investigation.data.transactionId}</span> · {transaction.data.customerName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={investigation.data.status} className="px-3 py-1.5 text-[12px]" />
                <RiskBadge level={investigation.data.riskLevel} />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Risk score + breakdown */}
            <Card className="flex flex-col items-center gap-4 p-6 text-center lg:col-span-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Overall Risk Score</span>
              <RiskGauge score={investigation.data.riskScore} level={investigation.data.riskLevel} />
              <RiskBadge level={investigation.data.riskLevel} />
              <div className="w-full border-t border-ink-100 pt-4 text-left">
                <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <Gauge className="h-3.5 w-3.5" />
                  Risk Score Breakdown
                </div>
                <RiskBreakdown factors={getRiskBreakdown(investigation.data)} />
              </div>
            </Card>

            {/* Why this transaction is risky */}
            <Card className="p-6 lg:col-span-2">
              <SectionHeading icon={ShieldAlert} title="Why This Transaction Is Risky" />
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {investigation.data.signals.length === 0 ? (
                  <p className="text-[12.5px] text-ink-500">No risk signals recorded for this case.</p>
                ) : (
                  investigation.data.signals.map(s => (
                    <div key={s.label} className="rounded-[10px] border border-ink-100 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[13px] font-medium text-ink-900">{s.label}</span>
                        <RiskBadge level={s.severity} className="shrink-0" />
                      </div>
                      <p className="mt-1 text-[12.5px] text-ink-500">{s.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Evidence */}
          <Card className="p-6">
            <SectionHeading icon={FileSearch} title="Evidence" />
            {investigation.data.evidence.length === 0 ? (
              <p className="mt-4 text-[12.5px] text-ink-500">No supporting evidence recorded.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {investigation.data.evidence.map((e, i) => (
                  <div key={i} className="rounded-[10px] bg-canvas p-3.5 text-[12.5px] leading-relaxed text-ink-700">
                    {e}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* AI Investigation Summary */}
            <Card className="p-6">
              <SectionHeading icon={Bot} title="AI Investigation Summary" />
              <div className="mt-4 space-y-4">
                <SummaryField
                  label="Transaction Summary"
                  value={`${formatCurrency(transaction.data.amount, transaction.data.currency)} via ${transaction.data.method} from ${transaction.data.location}, using ${transaction.data.device}.`}
                />
                <SummaryField label="Risk Assessment" value={investigation.data.aiSummary} />
                <SummaryField
                  label="Key Findings"
                  value={investigation.data.signals.map(s => s.label).join(' · ') || 'No elevated findings.'}
                />
                <SummaryField label="Recommended Action" value={investigation.data.recommendedAction} />
              </div>
            </Card>

            {/* AI Reasoning */}
            <Card className="p-6">
              <SectionHeading icon={ClipboardList} title="AI Reasoning" />
              <p className="mt-2 text-[11.5px] text-ink-500">Summarized explainability output — not raw model reasoning.</p>
              <ol className="mt-4 space-y-3">
                {investigation.data.signals.map((s, i) => (
                  <li key={s.label} className="flex gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10.5px] font-semibold text-brand-600">
                      {i + 1}
                    </div>
                    <div className="flex-1 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                      <div className="text-[12.5px]"><span className="font-medium text-ink-900">Observed:</span> <span className="text-ink-700">{s.label}</span></div>
                      <div className="text-[12.5px]"><span className="font-medium text-ink-900">Evidence:</span> <span className="text-ink-700">{s.detail}</span></div>
                      <div className="mt-1 flex items-center gap-1.5 text-[12.5px]">
                        <span className="font-medium text-ink-900">Impact:</span>
                        <RiskBadge level={s.severity} />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* AI Decision Support + Decision Confidence + Next Best Action */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecommendationPanel
                action={investigation.data.recommendedAction}
                reason={investigation.data.recommendation}
                confidence={investigation.data.confidence}
                riskLevel={investigation.data.riskLevel}
                explanation={getRecommendationExplanation(investigation.data)}
              />
            </div>
            <div className="flex flex-col gap-5">
              <Card className="p-5 text-center">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">AI Confidence</div>
                <div className="mt-2 font-[var(--font-display)] text-[32px] font-semibold text-ink-900">{investigation.data.confidence}%</div>
                <div className="mt-1 text-[12px] font-medium text-brand-600">{getConfidenceLabel(investigation.data.confidence)}</div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <Compass className="h-3.5 w-3.5" />
                  Next Best Action
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                  {getNextBestAction(investigation.data.recommendedAction)}
                </p>
              </Card>
            </div>
          </div>

          {/* Human Review */}
          <HumanReviewPanel
            caseId={investigation.data.id}
            transactionId={investigation.data.transactionId}
            status={investigation.data.status}
            reviewer={investigation.data.reviewer}
            riskScore={investigation.data.riskScore}
            riskLevel={investigation.data.riskLevel}
            recommendedAction={investigation.data.recommendedAction}
            confidence={investigation.data.confidence}
          />

          {/* Analyst Decision Record — only once a review has actually happened */}
          {investigation.data.reviewer && (
            <Card className="border-brand-100 p-6">
              <SectionHeading icon={UserCog} title="Analyst Decision" />
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                <Field label="Decision" value={investigation.data.status.replace(/_/g, ' ')} />
                <Field label="Reviewed By" value={investigation.data.reviewer} />
                <Field
                  label="Reviewed At"
                  value={investigation.data.resolvedAt ? formatDateTime(investigation.data.resolvedAt) : (latestReviewLog ? formatDateTime(latestReviewLog.timestamp) : '—')}
                />
                <Field label="Updated Transaction Status" value={transaction.data.status.replace(/_/g, ' ')} />
                <Field label="Reason" value={investigation.data.reviewNote ?? latestReviewLog?.reason ?? '—'} />
              </div>

              {/* AI Recommendation vs Analyst Decision */}
              <div className="mt-5 grid grid-cols-1 gap-3 border-t border-ink-100 pt-4 sm:grid-cols-2">
                <div className="rounded-[10px] bg-canvas p-3.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">AI Recommendation</div>
                  <div className="mt-1 text-[14px] font-semibold text-ink-900">{investigation.data.recommendedAction}</div>
                  <div className="text-[11.5px] text-ink-500">{investigation.data.confidence}% confidence</div>
                </div>
                <div className="rounded-[10px] bg-brand-50 p-3.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide text-brand-600">Analyst Decision</div>
                  <div className="mt-1 text-[14px] font-semibold text-ink-900">{investigation.data.status.replace(/_/g, ' ')}</div>
                  {investigation.data.reviewNote && <div className="text-[11.5px] text-ink-500">"{investigation.data.reviewNote}"</div>}
                </div>
              </div>
            </Card>
          )}

          {/* Investigation / Evidence Timeline */}
          <Card className="p-6">
            <SectionHeading icon={ScrollText} title="Investigation Timeline" />
            <InvestigationTimeline
              transactionTimestamp={transaction.data.timestamp}
              createdAt={investigation.data.createdAt}
              reviewLog={latestReviewLog ?? null}
              resolvedAt={investigation.data.resolvedAt}
              status={investigation.data.status}
            />
          </Card>

          {/* Audit activity */}
          <Card className="p-6">
            <SectionHeading icon={ScrollText} title="Audit Activity" />
            {relatedLogs.length === 0 ? (
              <p className="mt-4 text-[12.5px] text-ink-500">No audit events recorded for this case yet.</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {relatedLogs.map(log => (
                  <li key={log.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    <div className="flex-1 border-b border-ink-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-ink-900">{log.action}</span>
                        <span className="text-[11.5px] text-ink-500">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-ink-500">{log.reason} — <span className="font-medium">{log.actor}</span></p>
                      {log.previousState && log.newState && (
                        <p className="mt-0.5 text-[11.5px] text-ink-500">
                          {log.previousState.replace(/_/g, ' ')} → <span className="font-medium">{log.newState.replace(/_/g, ' ')}</span>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Transaction summary footer reference */}
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[12.5px] text-ink-500">
                Transaction — <span className="font-medium text-ink-900">{formatCurrency(transaction.data.amount, transaction.data.currency)}</span> via {transaction.data.method}, {transaction.data.location} · <StatusBadge status={transaction.data.status} />
              </div>
              <button
                onClick={() => navigate(`/transactions/${transaction.data!.id}`)}
                className="text-[12.5px] font-semibold text-brand-500 hover:underline"
              >
                View full transaction →
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function InvestigationTimeline({
  transactionTimestamp, createdAt, reviewLog, resolvedAt, status,
}: {
  transactionTimestamp: string
  createdAt: string
  reviewLog: { timestamp: string } | null
  resolvedAt: string | null
  status: string
}) {
  const steps = [
    { label: 'Transaction Created', done: true, at: transactionTimestamp },
    { label: 'Risk Analysis Completed', done: true, at: transactionTimestamp },
    { label: 'Suspicious Activity Detected', done: true, at: createdAt },
    { label: 'AI Investigation Started', done: true, at: createdAt },
    { label: 'AI Recommendation Generated', done: true, at: createdAt },
    { label: 'Human Review', done: !!reviewLog, at: reviewLog?.timestamp ?? null },
    { label: 'Final Decision', done: !!resolvedAt, at: resolvedAt },
  ]
  return (
    <ol className="mt-4 space-y-0">
      {steps.map((s, i) => (
        <li key={s.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            {s.done ? (
              <CheckCircle2 className="h-[18px] w-[18px] text-success-600" />
            ) : (
              <Circle className="h-[18px] w-[18px] text-ink-300" />
            )}
            {i < steps.length - 1 && <div className={`w-px flex-1 ${s.done ? 'bg-success-100' : 'bg-ink-100'}`} style={{ minHeight: 24 }} />}
          </div>
          <div className="pb-4">
            <div className={`text-[13px] font-medium ${s.done ? 'text-ink-900' : 'text-ink-500'}`}>{s.label}</div>
            {s.at && <div className="text-[11.5px] text-ink-500">{formatDateTime(s.at)}</div>}
            {s.label === 'Final Decision' && !s.done && <div className="text-[11.5px] text-ink-500">Pending — case is {status.replace(/_/g, ' ').toLowerCase()}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

function SectionHeading({ icon: Icon, title }: { icon: typeof Bot; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-brand-500" />
      <h3 className="text-[13.5px] font-semibold text-ink-900">{title}</h3>
    </div>
  )
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-700">{value}</p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-0.5 text-[13px] font-medium text-ink-900">{value}</div>
    </div>
  )
}
