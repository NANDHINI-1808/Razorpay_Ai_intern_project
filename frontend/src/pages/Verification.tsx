import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchVerificationRequests } from '@/services/api'
import type { VerificationStatus } from '@/types'
import { Card } from '@/components/ui/Card'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States'
import { FadeIn } from '@/components/ui/FadeIn'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { ChevronRight, Search, ShieldQuestion } from 'lucide-react'

const PAGE_SIZE = 8
const STATUSES: VerificationStatus[] = ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'CANCELLED']

export default function Verification() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery({ queryKey: ['verification-requests'], queryFn: fetchVerificationRequests })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!data) return []
    return data
      .filter(v => statusFilter === 'ALL' || v.status === statusFilter)
      .filter(v => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return v.id.toLowerCase().includes(q) || v.transactionId.toLowerCase().includes(q) ||
          v.senderName.toLowerCase().includes(q) || v.receiverName.toLowerCase().includes(q)
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [data, search, statusFilter])

  const summary = useMemo(() => {
    if (!data) return null
    return {
      pending: data.filter(v => v.status === 'PENDING').length,
      verified: data.filter(v => v.status === 'VERIFIED').length,
      rejected: data.filter(v => v.status === 'REJECTED').length,
      expired: data.filter(v => v.status === 'EXPIRED').length,
    }
  }, [data])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5">
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <FadeIn delayMs={0}><SummaryTile label="Pending" value={summary.pending} tone="text-warning-600" /></FadeIn>
          <FadeIn delayMs={40}><SummaryTile label="Verified" value={summary.verified} tone="text-success-600" /></FadeIn>
          <FadeIn delayMs={80}><SummaryTile label="Rejected" value={summary.rejected} tone="text-critical-600" /></FadeIn>
          <FadeIn delayMs={120}><SummaryTile label="Expired" value={summary.expired} tone="text-ink-500" /></FadeIn>
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by verification ID, transaction, sender, or receiver…"
              className="w-full rounded-[10px] border border-ink-100 bg-canvas py-2.5 pl-9 pr-3 text-[13px] text-ink-900 placeholder:text-ink-500 focus:border-electric-500 focus:bg-surface focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 rounded-[10px] border border-ink-100 bg-canvas px-3 py-2 text-[12.5px]">
            <span className="text-ink-500">Status</span>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as VerificationStatus | 'ALL'); setPage(1) }}
              className="bg-transparent font-medium text-ink-900 focus:outline-none"
            >
              <option value="ALL">All</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldQuestion className="h-4 w-4 text-ink-500" />
            <h2 className="text-[14.5px] font-semibold text-ink-900">Verification Center</h2>
          </div>
          <span className="text-[12px] text-ink-500">{filtered.length} requests</span>
        </div>

        {isLoading && <div className="p-5"><TableSkeleton /></div>}
        {isError && <ErrorState message="Could not load verification requests from the API service layer." />}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState title="No verification requests match your filters" description="Try a different search term or clear the status filter." />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3">Verification</th>
                  <th className="px-3 py-3">Sender → Receiver</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Risk</th>
                  <th className="px-3 py-3">Requested</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map(v => (
                  <tr
                    key={v.id}
                    onClick={() => navigate(`/verification/${v.id}`)}
                    className="cursor-pointer border-b border-ink-100 text-[13px] text-ink-900 transition-colors last:border-0 hover:bg-canvas"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{v.id}</div>
                      <div className="text-[11.5px] text-ink-500">{v.transactionId}</div>
                    </td>
                    <td className="px-3 py-3.5 text-ink-700">{v.senderName} → {v.receiverName}</td>
                    <td className="px-3 py-3.5 font-medium">{formatCurrency(v.amount, v.currency)}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{v.riskScore}</span>
                        <RiskBadge level={v.riskLevel} />
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-ink-500">{formatDateTime(v.createdAt)}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={v.status} /></td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/verification/${v.id}`) }}
                        className="flex items-center gap-0.5 text-[12px] font-semibold text-brand-500 hover:underline"
                      >
                        Open <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="px-5 pb-4">
            <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  )
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="p-4">
      <div className={`font-[var(--font-display)] text-[24px] font-semibold ${tone ?? 'text-ink-900'}`}>{value}</div>
      <div className="text-[11.5px] text-ink-500">{label}</div>
    </Card>
  )
}
