import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchInvestigations } from '@/services/api'
import type { CaseStatus, RiskLevel } from '@/types'
import { Card } from '@/components/ui/Card'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States'
import { formatDateTime } from '@/lib/format'
import { ArrowUpDown, ChevronRight, FileSearch, Search } from 'lucide-react'

type SortKey = 'createdAt' | 'riskScore'
const PAGE_SIZE = 8
const RISK_LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES: CaseStatus[] = ['OPEN', 'UNDER_REVIEW', 'ON_HOLD', 'VERIFIED', 'BLOCKED', 'FALSE_POSITIVE', 'RESOLVED']

export default function Investigations() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery({ queryKey: ['investigations'], queryFn: fetchInvestigations })

  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'ALL'>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!data) return []
    return data
      .filter(c => riskFilter === 'ALL' || c.riskLevel === riskFilter)
      .filter(c => statusFilter === 'ALL' || c.status === statusFilter)
      .filter(c => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return c.id.toLowerCase().includes(q) || c.transactionId.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const cmp = sortKey === 'createdAt'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : a.riskScore - b.riskScore
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [data, search, riskFilter, statusFilter, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
    setPage(1)
  }
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
              placeholder="Search by case ID, transaction ID, or customer…"
              className="w-full rounded-[10px] border border-ink-100 bg-canvas py-2.5 pl-9 pr-3 text-[13px] text-ink-900 placeholder:text-ink-500 focus:border-electric-500 focus:bg-surface focus:outline-none"
            />
          </div>
          <FilterSelect label="Risk" value={riskFilter} onChange={withReset(setRiskFilter)} options={['ALL', ...RISK_LEVELS]} />
          <FilterSelect label="Status" value={statusFilter} onChange={withReset(setStatusFilter)} options={['ALL', ...STATUSES]} />
        </div>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-ink-500" />
            <h2 className="text-[14.5px] font-semibold text-ink-900">Investigation Center</h2>
          </div>
          <span className="text-[12px] text-ink-500">{filtered.length} cases</span>
        </div>

        {isLoading && <div className="p-5"><TableSkeleton /></div>}
        {isError && <ErrorState message="Could not load investigation cases from the API service layer." />}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState title="No cases match your filters" description="Adjust search terms or clear filters to see more cases." />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3">Case ID</th>
                  <th className="px-3 py-3">Transaction</th>
                  <th className="px-3 py-3">Customer</th>
                  <SortableHeader label="Risk Score" active={sortKey === 'riskScore'} dir={sortDir} onClick={() => toggleSort('riskScore')} />
                  <th className="px-3 py-3">AI Recommendation</th>
                  <th className="px-3 py-3">Reviewer</th>
                  <th className="px-3 py-3">Status</th>
                  <SortableHeader label="Created" active={sortKey === 'createdAt'} dir={sortDir} onClick={() => toggleSort('createdAt')} />
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/investigations/${c.id}`)}
                    className="cursor-pointer border-b border-ink-100 text-[13px] text-ink-900 transition-colors last:border-0 hover:bg-canvas"
                  >
                    <td className="px-5 py-3.5 font-medium">{c.id}</td>
                    <td className="px-3 py-3.5 text-ink-700">{c.transactionId}</td>
                    <td className="px-3 py-3.5 text-ink-700">{c.customerName}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{c.riskScore}</span>
                        <RiskBadge level={c.riskLevel} />
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-[12px] font-medium text-ink-700">{c.recommendedAction}</td>
                    <td className="px-3 py-3.5 text-ink-500">{c.reviewer ?? '—'}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-3.5 text-ink-500">{formatDateTime(c.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/investigations/${c.id}`) }}
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

function SortableHeader({ label, active, dir, onClick }: { label: string; active: boolean; dir: 'asc' | 'desc'; onClick: () => void }) {
  return (
    <th className="px-3 py-3">
      <button onClick={onClick} className={`flex items-center gap-1 ${active ? 'text-brand-500' : 'hover:text-ink-700'}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active && dir === 'asc' ? 'rotate-180' : ''} transition-transform`} />
      </button>
    </th>
  )
}

function FilterSelect<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: T[] }) {
  return (
    <label className="flex items-center gap-2 rounded-[10px] border border-ink-100 bg-canvas px-3 py-2 text-[12.5px]">
      <span className="text-ink-500">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value as T)} className="bg-transparent font-medium text-ink-900 focus:outline-none">
        {options.map(o => <option key={o} value={o}>{o === 'ALL' ? 'All' : o.replace(/_/g, ' ')}</option>)}
      </select>
    </label>
  )
}
