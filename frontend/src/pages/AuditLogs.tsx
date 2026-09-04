import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { RiskBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States'
import { formatDateTime } from '@/lib/format'
import type { RiskLevel } from '@/types'
import { ScrollText, Search } from 'lucide-react'

const PAGE_SIZE = 10
const RISK_LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function AuditLogs() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['audit-logs'], queryFn: fetchAuditLogs })
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [actorFilter, setActorFilter] = useState('ALL')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [dateFilter, setDateFilter] = useState<'ALL' | '24H' | '7D'>('ALL')
  const [page, setPage] = useState(1)

  const actions = useMemo(() => Array.from(new Set((data ?? []).map(l => l.action))), [data])
  const actors = useMemo(() => Array.from(new Set((data ?? []).map(l => l.actor))), [data])

  const filtered = useMemo(() => {
    if (!data) return []
    const now = Date.now()
    return data
      .filter(l => actionFilter === 'ALL' || l.action === actionFilter)
      .filter(l => actorFilter === 'ALL' || l.actor === actorFilter)
      .filter(l => riskFilter === 'ALL' || l.riskLevel === riskFilter)
      .filter(l => {
        if (dateFilter === 'ALL') return true
        const ageMs = now - new Date(l.timestamp).getTime()
        return dateFilter === '24H' ? ageMs <= 24 * 3600_000 : ageMs <= 7 * 24 * 3600_000
      })
      .filter(l => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return (
          (l.transactionId ?? '').toLowerCase().includes(q) ||
          (l.caseId ?? '').toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.reason.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [data, search, actionFilter, actorFilter, riskFilter, dateFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function withReset<T>(setter: (v: T) => void) { return (v: T) => { setter(v); setPage(1) } }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={e => withReset(setSearch)(e.target.value)}
              placeholder="Search by transaction ID, case ID, actor, or reason…"
              className="w-full rounded-[10px] border border-ink-100 bg-canvas py-2.5 pl-9 pr-3 text-[13px] text-ink-900 placeholder:text-ink-500 focus:border-electric-500 focus:bg-surface focus:outline-none"
            />
          </div>
          <FilterSelect label="Action" value={actionFilter} onChange={withReset(setActionFilter)} options={['ALL', ...actions]} />
          <FilterSelect label="Actor" value={actorFilter} onChange={withReset(setActorFilter)} options={['ALL', ...actors]} />
          <FilterSelect label="Risk" value={riskFilter} onChange={withReset(setRiskFilter)} options={['ALL', ...RISK_LEVELS]} />
          <FilterSelect label="Date" value={dateFilter} onChange={withReset(setDateFilter)} options={['ALL', '24H', '7D']} />
        </div>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-ink-500" />
            <h2 className="text-[14.5px] font-semibold text-ink-900">Audit Logs</h2>
          </div>
          <span className="text-[12px] text-ink-500">{filtered.length} events</span>
        </div>

        {isLoading && <div className="p-5"><TableSkeleton cols={9} /></div>}
        {isError && <ErrorState message="Could not load audit logs from the API service layer." />}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState title="No audit events match your filters" description="Try adjusting search terms or clearing filters." />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-3 py-3">Actor</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Transaction</th>
                  <th className="px-3 py-3">Case</th>
                  <th className="px-3 py-3">Previous → New</th>
                  <th className="px-3 py-3">Reason</th>
                  <th className="px-3 py-3">AI Model</th>
                  <th className="px-5 py-3">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(log => (
                  <tr key={log.id} className="border-b border-ink-100 text-[13px] text-ink-900 last:border-0">
                    <td className="px-5 py-3.5 text-ink-500">{formatDateTime(log.timestamp)}</td>
                    <td className="px-3 py-3.5 font-medium">{log.actor}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        {log.action}
                        {log.riskLevel && <RiskBadge level={log.riskLevel} />}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-ink-700">{log.transactionId ?? '—'}</td>
                    <td className="px-3 py-3.5 text-ink-700">{log.caseId ?? '—'}</td>
                    <td className="px-3 py-3.5 text-[12px] text-ink-500">
                      {log.previousState && log.newState
                        ? <>{log.previousState.replace(/_/g, ' ')} → <span className="font-medium text-ink-900">{log.newState.replace(/_/g, ' ')}</span></>
                        : '—'}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3.5 text-[12px] text-ink-500" title={log.reason}>{log.reason}</td>
                    <td className="px-3 py-3.5 text-[12px] text-ink-500">{log.aiModel ?? '—'}</td>
                    <td className="px-5 py-3.5 text-[12px] text-ink-500">{log.confidence != null ? `${log.confidence}%` : '—'}</td>
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

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex items-center gap-2 rounded-[10px] border border-ink-100 bg-canvas px-3 py-2 text-[12.5px]">
      <span className="text-ink-500">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="bg-transparent font-medium text-ink-900 focus:outline-none">
        {options.map(o => <option key={o} value={o}>{o === 'ALL' ? 'All' : o}</option>)}
      </select>
    </label>
  )
}
