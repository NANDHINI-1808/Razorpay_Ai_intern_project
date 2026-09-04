import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchTransactions } from '@/services/api'
import type { RiskLevel, Transaction, TransactionStatus } from '@/types'
import { Card } from '@/components/ui/Card'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { ArrowUpDown, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'

type SortKey = 'timestamp' | 'amount' | 'riskScore'
type SortDir = 'asc' | 'desc'
const PAGE_SIZE = 8

const RISK_LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES: TransactionStatus[] = ['APPROVED', 'PENDING_REVIEW', 'VERIFICATION_REQUIRED', 'ON_HOLD', 'BLOCKED', 'FLAGGED']

export default function Transactions() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery({ queryKey: ['transactions'], queryFn: fetchTransactions })

  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'ALL'>('ALL')
  const [methodFilter, setMethodFilter] = useState<Transaction['method'] | 'ALL'>('ALL')
  const [dateFilter, setDateFilter] = useState<'ALL' | '24H' | '7D'>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const methods = useMemo(() => Array.from(new Set((data ?? []).map(t => t.method))), [data])

  const filtered = useMemo(() => {
    if (!data) return []
    const now = Date.now()
    return data
      .filter(t => riskFilter === 'ALL' || t.riskLevel === riskFilter)
      .filter(t => statusFilter === 'ALL' || t.status === statusFilter)
      .filter(t => methodFilter === 'ALL' || t.method === methodFilter)
      .filter(t => {
        if (dateFilter === 'ALL') return true
        const ageMs = now - new Date(t.timestamp).getTime()
        if (dateFilter === '24H') return ageMs <= 24 * 3600_000
        return ageMs <= 7 * 24 * 3600_000
      })
      .filter(t => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return (
          t.id.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.beneficiary.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortKey === 'timestamp') cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        if (sortKey === 'amount') cmp = a.amount - b.amount
        if (sortKey === 'riskScore') cmp = a.riskScore - b.riskScore
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [data, search, riskFilter, statusFilter, methodFilter, dateFilter, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  function resetToFirstPage<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1) }
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={e => resetToFirstPage(setSearch)(e.target.value)}
              placeholder="Search by transaction ID, customer, or beneficiary…"
              className="w-full rounded-[10px] border border-ink-100 bg-canvas py-2.5 pl-9 pr-3 text-[13px] text-ink-900 placeholder:text-ink-500 focus:border-electric-500 focus:bg-surface focus:outline-none"
            />
          </div>

          <FilterSelect label="Risk" value={riskFilter} onChange={resetToFirstPage(setRiskFilter)} options={['ALL', ...RISK_LEVELS]} />
          <FilterSelect label="Status" value={statusFilter} onChange={resetToFirstPage(setStatusFilter)} options={['ALL', ...STATUSES]} />
          <FilterSelect label="Method" value={methodFilter} onChange={resetToFirstPage(setMethodFilter)} options={['ALL', ...methods]} />
          <FilterSelect label="Date" value={dateFilter} onChange={resetToFirstPage(setDateFilter)} options={['ALL', '24H', '7D']} />
        </div>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-ink-500" />
            <h2 className="text-[14.5px] font-semibold text-ink-900">Live Transactions</h2>
          </div>
          <span className="text-[12px] text-ink-500">{filtered.length} results</span>
        </div>

        {isLoading && <div className="p-5"><TableSkeleton /></div>}
        {isError && <ErrorState message="Could not load transactions from the API service layer." />}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState title="No transactions match your filters" description="Try adjusting search terms or clearing filters." />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3">Transaction</th>
                  <th className="px-3 py-3">Customer</th>
                  <SortableHeader label="Amount" active={sortKey === 'amount'} dir={sortDir} onClick={() => toggleSort('amount')} />
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3">Location / Device</th>
                  <SortableHeader label="Timestamp" active={sortKey === 'timestamp'} dir={sortDir} onClick={() => toggleSort('timestamp')} />
                  <SortableHeader label="Risk Score" active={sortKey === 'riskScore'} dir={sortDir} onClick={() => toggleSort('riskScore')} />
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">AI Recommendation</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/transactions/${t.id}`)}
                    className="cursor-pointer border-b border-ink-100 text-[13px] text-ink-900 transition-colors last:border-0 hover:bg-canvas"
                  >
                    <td className="px-5 py-3.5 font-medium">{t.id}</td>
                    <td className="px-3 py-3.5 text-ink-700">{t.customerName}</td>
                    <td className="px-3 py-3.5 font-medium">{formatCurrency(t.amount, t.currency)}</td>
                    <td className="px-3 py-3.5 text-ink-700">{t.method}</td>
                    <td className="px-3 py-3.5 text-ink-500">
                      <div>{t.location}</div>
                      <div className="text-[11.5px]">{t.device}</div>
                    </td>
                    <td className="px-3 py-3.5 text-ink-500">{formatDateTime(t.timestamp)}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{t.riskScore}</span>
                        <RiskBadge level={t.riskLevel} />
                      </div>
                    </td>
                    <td className="px-3 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="max-w-[220px] truncate px-3 py-3.5 text-[12px] text-ink-500" title={t.aiRecommendation}>
                      {t.aiRecommendation}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/transactions/${t.id}`) }}
                        className="flex items-center gap-0.5 text-[12px] font-semibold text-brand-500 hover:underline"
                      >
                        View <ChevronRight className="h-3.5 w-3.5" />
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

function SortableHeader({
  label, active, dir, onClick,
}: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <th className="px-3 py-3">
      <button onClick={onClick} className={`flex items-center gap-1 ${active ? 'text-brand-500' : 'hover:text-ink-700'}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active && dir === 'asc' ? 'rotate-180' : ''} transition-transform`} />
      </button>
    </th>
  )
}

function FilterSelect<T extends string>({
  label, value, onChange, options,
}: { label: string; value: T; onChange: (v: T) => void; options: T[] }) {
  return (
    <label className="flex items-center gap-2 rounded-[10px] border border-ink-100 bg-canvas px-3 py-2 text-[12.5px]">
      <span className="text-ink-500">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="bg-transparent font-medium text-ink-900 focus:outline-none"
      >
        {options.map(o => (
          <option key={o} value={o}>{o === 'ALL' ? 'All' : o.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </label>
  )
}
