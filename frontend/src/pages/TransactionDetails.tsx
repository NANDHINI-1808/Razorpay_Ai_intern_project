import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAuditLogs, fetchInvestigations, fetchTransaction, fetchVerificationRequests } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/States'
import { formatCurrency, formatDateTime, formatRelative } from '@/lib/format'
import {
  ArrowLeft, Banknote, Bot, Cpu, MapPin, ScrollText, ShieldAlert, ShieldQuestion, User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export default function TransactionDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const txn = useQuery({ queryKey: ['transaction', id], queryFn: () => fetchTransaction(id!), enabled: !!id })
  const investigations = useQuery({ queryKey: ['investigations'], queryFn: fetchInvestigations })
  const verifications = useQuery({ queryKey: ['verification-requests'], queryFn: fetchVerificationRequests })
  const auditLogs = useQuery({ queryKey: ['audit-logs'], queryFn: fetchAuditLogs })

  const isLoading = txn.isLoading || investigations.isLoading || verifications.isLoading || auditLogs.isLoading

  const relatedCase = investigations.data?.find(i => i.transactionId === id)
  const relatedVerification = verifications.data?.find(v => v.transactionId === id)
  const relatedLogs = (auditLogs.data ?? []).filter(l => l.transactionId === id)

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/transactions')}
        className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Live Transactions
      </button>

      {isLoading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <CardSkeleton className="h-40 lg:col-span-2" />
          <CardSkeleton className="h-40" />
          <CardSkeleton className="h-56 lg:col-span-2" />
          <CardSkeleton className="h-56" />
        </div>
      )}

      {!isLoading && txn.isError && (
        <ErrorState message="Risk assessment unavailable. This transaction requires manual review — please retry or escalate to an analyst." />
      )}

      {!isLoading && !txn.isError && !txn.data && (
        <EmptyState
          icon={ShieldAlert}
          title="Transaction not found"
          description={`No transaction matches ID "${id}". It may have been removed or the link is incorrect.`}
        />
      )}

      {txn.data && (
        <>
          {/* Overview */}
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-[11.5px] font-medium uppercase tracking-wide text-ink-500">Transaction Overview</span>
                <h2 className="mt-1 font-[var(--font-display)] text-[22px] font-semibold text-ink-900">{txn.data.id}</h2>
                <p className="mt-1 text-[12.5px] text-ink-500">{formatDateTime(txn.data.timestamp)} · {formatRelative(txn.data.timestamp)}</p>
              </div>
              <div className="text-right">
                <div className="font-[var(--font-display)] text-[26px] font-semibold text-ink-900">
                  {formatCurrency(txn.data.amount, txn.data.currency)}
                </div>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <StatusBadge status={txn.data.status} />
                  <RiskBadge level={txn.data.riskLevel} />
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-100 pt-5 sm:grid-cols-4">
              <Field label="Payment Method" value={txn.data.method} />
              <Field label="Beneficiary" value={txn.data.beneficiary} />
              <Field label="Customer ID" value={txn.data.customerId} />
              <Field label="Currency" value={txn.data.currency} />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Customer + Payment */}
            <Card className="p-6 lg:col-span-1">
              <SectionHeading icon={User} title="Customer Information" />
              <div className="mt-4 space-y-3">
                <Field label="Name" value={txn.data.customerName} />
                <Field label="Customer ID" value={txn.data.customerId} />
              </div>
            </Card>

            <Card className="p-6 lg:col-span-1">
              <SectionHeading icon={Banknote} title="Payment Information" />
              <div className="mt-4 space-y-3">
                <Field label="Method" value={txn.data.method} />
                <Field label="Amount" value={formatCurrency(txn.data.amount, txn.data.currency)} />
                <Field label="Beneficiary" value={txn.data.beneficiary} />
              </div>
            </Card>

            <Card className="p-6 lg:col-span-1">
              <SectionHeading icon={MapPin} title="Device & Location" />
              <div className="mt-4 space-y-3">
                <Field label="Location" value={txn.data.location} />
                <Field label="Device" value={txn.data.device} />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Risk Analysis */}
            <Card className="p-6 lg:col-span-2">
              <SectionHeading icon={ShieldAlert} title="Risk Analysis" />
              <div className="mt-4 flex items-center gap-6">
                <div>
                  <div className="font-[var(--font-display)] text-[36px] font-semibold leading-none text-ink-900">
                    {txn.data.riskScore}<span className="text-[16px] font-medium text-ink-500">/100</span>
                  </div>
                  <div className="mt-2"><RiskBadge level={txn.data.riskLevel} /></div>
                </div>
                <div className="h-14 w-px bg-ink-100" />
                <div className="flex-1 space-y-2">
                  {relatedCase ? (
                    relatedCase.signals.map(s => (
                      <div key={s.label} className="flex items-start justify-between gap-3 text-[12.5px]">
                        <div>
                          <div className="font-medium text-ink-900">{s.label}</div>
                          <div className="text-ink-500">{s.detail}</div>
                        </div>
                        <RiskBadge level={s.severity} className="shrink-0" />
                      </div>
                    ))
                  ) : (
                    <p className="text-[12.5px] text-ink-500">No elevated risk signals detected for this transaction.</p>
                  )}
                </div>
              </div>
            </Card>

            {/* AI Recommendation */}
            <Card className="p-6 lg:col-span-1">
              <SectionHeading icon={Bot} title="AI Recommendation" />
              <p className="mt-4 text-[13px] leading-relaxed text-ink-700">{txn.data.aiRecommendation}</p>
              {relatedCase && (
                <div className="mt-4 flex items-center gap-2 rounded-[10px] bg-canvas px-3 py-2.5">
                  <Cpu className="h-4 w-4 text-brand-500" />
                  <div className="text-[12px]">
                    <span className="font-semibold text-ink-900">{relatedCase.confidence}%</span>{' '}
                    <span className="text-ink-500">model confidence</span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Verification status — only rendered when a verification request actually exists for this transaction */}
          {relatedVerification && (
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionHeading icon={ShieldQuestion} title="Verification Status" />
                <StatusBadge status={relatedVerification.status} />
              </div>
              <p className="mt-3 text-[12.5px] text-ink-500">{relatedVerification.reason}</p>
              <button
                onClick={() => navigate(`/verification/${relatedVerification.id}`)}
                className="mt-3 text-[12.5px] font-semibold text-brand-500 hover:underline"
              >
                Open verification request ({relatedVerification.id}) →
              </button>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6">
            <SectionHeading icon={ScrollText} title="Audit / Activity Timeline" />
            <div className="mt-4">
              {relatedLogs.length === 0 ? (
                <p className="text-[12.5px] text-ink-500">No audit events recorded for this transaction yet.</p>
              ) : (
                <ol className="space-y-4">
                  {relatedLogs.map(log => (
                    <li key={log.id} className="flex gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      <div className="flex-1 border-b border-ink-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[13px] font-medium text-ink-900">{log.action}</span>
                          <span className="text-[11.5px] text-ink-500">{formatDateTime(log.timestamp)}</span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-ink-500">{log.reason} — <span className="font-medium">{log.actor}</span></p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function SectionHeading({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-brand-500" />
      <h3 className="text-[13.5px] font-semibold text-ink-900">{title}</h3>
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
