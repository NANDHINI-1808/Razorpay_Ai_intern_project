import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAuditLogs, fetchVerificationRequest } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, CardSkeleton } from '@/components/ui/States'
import { VerificationRequestCard } from '@/components/verification/VerificationRequestCard'
import { formatDateTime } from '@/lib/format'
import { ArrowLeft, ScrollText, ShieldQuestion } from 'lucide-react'

export default function VerificationDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const verification = useQuery({
    queryKey: ['verification', id],
    queryFn: () => fetchVerificationRequest(id!),
    enabled: !!id,
  })
  const auditLogs = useQuery({ queryKey: ['audit-logs'], queryFn: fetchAuditLogs })

  const relatedLogs = (auditLogs.data ?? [])
    .filter(l => l.transactionId === verification.data?.transactionId && l.action.startsWith('VERIFICATION'))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/verification')}
        className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Verification Center
      </button>

      {(verification.isLoading || auditLogs.isLoading) && <CardSkeleton className="h-96" />}

      {!verification.isLoading && verification.isError && (
        <ErrorState message="Could not load this verification request from the API service layer." />
      )}

      {!verification.isLoading && !verification.isError && !verification.data && (
        <EmptyState icon={ShieldQuestion} title="Verification request not found" description={`No request matches ID "${id}".`} />
      )}

      {verification.data && (
        <>
          <VerificationRequestCard verification={verification.data} />

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-brand-500" />
              <h3 className="text-[13.5px] font-semibold text-ink-900">Verification Audit Trail</h3>
            </div>
            {relatedLogs.length === 0 ? (
              <p className="mt-4 text-[12.5px] text-ink-500">No verification events recorded yet.</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {relatedLogs.map(log => (
                  <li key={log.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    <div className="flex-1 border-b border-ink-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-ink-900">{log.action.replace(/_/g, ' ')}</span>
                        <span className="text-[11.5px] text-ink-500">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-ink-500">{log.reason} — <span className="font-medium">{log.actor}</span></p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="p-5">
            <button
              onClick={() => navigate(`/transactions/${verification.data!.transactionId}`)}
              className="text-[12.5px] font-semibold text-brand-500 hover:underline"
            >
              View full transaction ({verification.data.transactionId}) →
            </button>
          </Card>
        </>
      )}
    </div>
  )
}
