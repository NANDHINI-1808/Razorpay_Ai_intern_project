import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitHumanReview, type HumanReviewAction } from '@/services/api'
import type { CaseStatus, RecommendedAction, RiskLevel } from '@/types'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { AlertTriangle, Check, Flag, PauseCircle, ShieldAlert, ShieldOff, UserCheck } from 'lucide-react'
import { useState } from 'react'

const terminal: CaseStatus[] = ['VERIFIED', 'BLOCKED', 'FALSE_POSITIVE', 'RESOLVED']

const actions: { action: HumanReviewAction; label: string; icon: typeof Check; tone: string }[] = [
  { action: 'APPROVE', label: 'Approve Transaction', icon: Check, tone: 'bg-success-600 hover:bg-success-600/90' },
  { action: 'REQUEST_VERIFICATION', label: 'Request Verification', icon: UserCheck, tone: 'bg-warning-600 hover:bg-warning-600/90' },
  { action: 'HOLD', label: 'Place on Hold', icon: PauseCircle, tone: 'bg-[#C2410C] hover:bg-[#C2410C]/90' },
  { action: 'BLOCK', label: 'Block Transaction', icon: ShieldOff, tone: 'bg-critical-600 hover:bg-critical-600/90' },
  { action: 'FALSE_POSITIVE', label: 'Mark False Positive', icon: Flag, tone: 'bg-ink-700 hover:bg-ink-700/90' },
]

export function HumanReviewPanel({
  caseId, transactionId, status, reviewer, riskScore, riskLevel, recommendedAction, confidence,
}: {
  caseId: string
  transactionId: string
  status: CaseStatus
  reviewer: string | null
  riskScore: number
  riskLevel: RiskLevel
  recommendedAction: RecommendedAction
  confidence: number
}) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [pendingAction, setPendingAction] = useState<HumanReviewAction | null>(null)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const isResolved = terminal.includes(status)

  const mutation = useMutation({
    mutationFn: (action: HumanReviewAction) =>
      submitHumanReview(caseId, action, user?.name ?? 'Unknown Analyst', note),
    onMutate: (action) => setPendingAction(action),
    onSettled: () => setPendingAction(null),
    onSuccess: (result, action) => {
      queryClient.invalidateQueries({ queryKey: ['investigation', caseId] })
      queryClient.invalidateQueries({ queryKey: ['investigations'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      const actionLabel = actions.find(a => a.action === action)?.label ?? action
      setToast(`${actionLabel} recorded — case is now ${result.investigation.status.replace(/_/g, ' ')}.`)
      setNote('')
    },
    onError: () => {
      setToast('Could not submit this review — please try again.')
    },
  })

  return (
    <div className="overflow-hidden rounded-[16px] border-2 border-brand-100 bg-surface">
      <div className="flex items-center gap-2.5 bg-brand-50 px-5 py-4">
        <ShieldAlert className="h-[18px] w-[18px] text-brand-600" />
        <div>
          <div className="text-[13.5px] font-bold tracking-wide text-brand-700">
            {isResolved ? 'HUMAN REVIEW' : 'HUMAN REVIEW REQUIRED'}
          </div>
          {!isResolved && (
            <div className="text-[12px] text-brand-600/80">
              This transaction requires analyst verification before final action.
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <SnapshotStat label="Risk Score" value={riskScore.toString()} />
          <SnapshotStat label="Risk Level" value={<RiskBadge level={riskLevel} />} />
          <SnapshotStat label="AI Recommendation" value={recommendedAction} />
          <SnapshotStat label="AI Confidence" value={`${confidence}%`} />
          <SnapshotStat label="Investigation Status" value={<StatusBadge status={status} />} />
        </div>

        {isResolved ? (
          <p className="mt-5 border-t border-ink-100 pt-4 text-[13px] text-ink-700">
            This case is <span className="font-semibold">{status.replace(/_/g, ' ')}</span>
            {reviewer && <> — reviewed by <span className="font-medium">{reviewer}</span></>}.
          </p>
        ) : (
          <>
            <div className="mt-5 border-t border-ink-100 pt-4">
              <label className="text-[12px] font-medium text-ink-500" htmlFor="review-note">
                Review note <span className="text-ink-300">(optional — recorded with the decision)</span>
              </label>
              <textarea
                id="review-note"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder='e.g. "Customer confirmed the transaction over a callback."'
                rows={2}
                className="mt-1.5 w-full resize-none rounded-[10px] border border-ink-100 bg-canvas px-3 py-2 text-[12.5px] text-ink-900 placeholder:text-ink-300 focus:border-electric-500 focus:bg-surface focus:outline-none"
              />
            </div>
            <p className="mt-3 text-[13px] text-ink-500">Choose the outcome for this investigation.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {actions.map(({ action, label, icon: Icon, tone }) => (
                <button
                  key={action}
                  onClick={() => mutation.mutate(action)}
                  disabled={mutation.isPending}
                  className={`flex items-center justify-center gap-2 rounded-[10px] px-3 py-2.5 text-[12.5px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${tone}`}
                >
                  <Icon className="h-4 w-4" />
                  {pendingAction === action && mutation.isPending ? 'Submitting…' : label}
                </button>
              ))}
            </div>
            {mutation.isError && (
              <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-critical-100 px-3 py-2.5 text-[12px] text-critical-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Could not submit this review. Please try again.
              </div>
            )}
          </>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-ink-500">
          Actions update the case and transaction status through the mock service layer for this demo build, and
          create an audit log entry. Wiring to a real review backend later requires no change to this component.
        </p>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function SnapshotStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-ink-100 bg-canvas p-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-ink-900">{value}</div>
    </div>
  )
}
