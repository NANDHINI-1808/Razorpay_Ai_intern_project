import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitVerificationDecision, type VerificationDecisionAction } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { VerificationRequest } from '@/types'
import { AlertTriangle, ArrowRight, Check, ShieldQuestion, X } from 'lucide-react'

export function VerificationRequestCard({ verification }: { verification: VerificationRequest }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [note, setNote] = useState('')
  const [pendingAction, setPendingAction] = useState<VerificationDecisionAction | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const isPending = verification.status === 'PENDING'

  const mutation = useMutation({
    mutationFn: (action: VerificationDecisionAction) =>
      submitVerificationDecision(verification.id, action, user?.name ?? 'Unknown Reviewer', note),
    onMutate: (action) => setPendingAction(action),
    onSettled: () => setPendingAction(null),
    onSuccess: (result, action) => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] })
      queryClient.invalidateQueries({ queryKey: ['verification', verification.id] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['transaction', verification.transactionId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['kpis'] })
      setToast(action === 'VERIFY' ? 'Payment verified — audit entry created.' : 'Payment rejected — audit entry created.')
      setNote('')
    },
    // Toast only ever appears after a successful mutation above — no
    // optimistic/pre-emptive success message is shown before this resolves.
  })

  return (
    <div className="overflow-hidden rounded-[16px] border-2 border-brand-100 bg-surface">
      <div className="flex items-center gap-2.5 bg-brand-50 px-5 py-4">
        <ShieldQuestion className="h-[18px] w-[18px] text-brand-600" />
        <div>
          <div className="text-[13.5px] font-bold tracking-wide text-brand-700">PAYMENT VERIFICATION REQUIRED</div>
          <div className="text-[12px] text-brand-600/80">
            {isPending ? 'Additional verification is required before this payment can proceed.' : 'This verification request has been resolved.'}
          </div>
        </div>
        <StatusBadge status={verification.status} className="ml-auto" />
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-canvas p-4">
          <div className="flex items-center gap-3 text-[13px]">
            <div className="text-right">
              <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">Sender</div>
              <div className="font-medium text-ink-900">{verification.senderName}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-ink-300" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">Receiver</div>
              <div className="font-medium text-ink-900">{verification.receiverName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">Amount</div>
            <div className="font-[var(--font-display)] text-[20px] font-semibold text-ink-900">
              {formatCurrency(verification.amount, verification.currency)}
            </div>
            <div className="text-[11px] text-ink-500">{verification.paymentMethod}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Risk Score" value={verification.riskScore.toString()} />
          <MiniStat label="Risk Level" value={<RiskBadge level={verification.riskLevel} />} />
          <MiniStat label="Requested" value={formatDateTime(verification.createdAt)} />
          <MiniStat label={isPending ? 'Expires' : 'Decided'} value={formatDateTime(isPending ? verification.expiresAt : (verification.verifiedAt ?? verification.expiresAt))} />
        </div>

        <div className="mt-4 rounded-[10px] border border-ink-100 p-3.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">Reason</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-700">{verification.reason}</p>
        </div>

        {isPending ? (
          <>
            <div className="mt-4">
              <label htmlFor="verification-note" className="text-[12px] font-medium text-ink-500">
                Decision note <span className="text-ink-300">(optional)</span>
              </label>
              <textarea
                id="verification-note"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder='e.g. "Customer confirmed the transaction via callback."'
                rows={2}
                className="mt-1.5 w-full resize-none rounded-[10px] border border-ink-100 bg-canvas px-3 py-2 text-[12.5px] text-ink-900 placeholder:text-ink-300 focus:border-electric-500 focus:bg-surface focus:outline-none"
              />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                onClick={() => mutation.mutate('VERIFY')}
                disabled={mutation.isPending}
                className="flex items-center justify-center gap-2 rounded-[10px] bg-success-600 px-3 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-success-600/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                {pendingAction === 'VERIFY' && mutation.isPending ? 'Verifying…' : 'Verify Payment'}
              </button>
              <button
                onClick={() => mutation.mutate('REJECT')}
                disabled={mutation.isPending}
                className="flex items-center justify-center gap-2 rounded-[10px] bg-critical-600 px-3 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-critical-600/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                {pendingAction === 'REJECT' && mutation.isPending ? 'Rejecting…' : 'Reject Payment'}
              </button>
            </div>
            {mutation.isError && (
              <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-critical-100 px-3 py-2.5 text-[12px] text-critical-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {mutation.error instanceof Error ? mutation.error.message : 'Could not submit this decision. Please try again.'}
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-[10px] bg-canvas p-3.5 text-[12.5px] text-ink-700">
            <span className="font-semibold">{verification.status}</span>
            {verification.verifiedBy && <> by <span className="font-medium">{verification.verifiedBy}</span></>}
            {verification.decisionNote && <div className="mt-1 text-ink-500">"{verification.decisionNote}"</div>}
          </div>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-ink-500">
          Demo notification — no real SMS/email/WhatsApp is sent in this build. This card represents the
          verification request itself; a production deployment would need a configured notification provider.
        </p>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-ink-100 bg-canvas p-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-ink-900">{value}</div>
    </div>
  )
}
