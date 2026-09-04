import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchBeneficiarySummaries } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { RiskBadge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States'
import { formatCurrency, formatDateTime, formatRelative } from '@/lib/format'
import type { BeneficiarySummary, RiskLevel } from '@/types'
import { ArrowUpDown, ChevronRight, Landmark, Search } from 'lucide-react'

const PAGE_SIZE = 8
const RISK_LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
type SortKey = 'totalAmount' | 'transactionCount' | 'lastTransactionAt'

export default function Beneficiaries() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['beneficiary-summaries'], queryFn: fetchBeneficiarySummaries })
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('totalAmount')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<BeneficiarySummary | null>(null)

  const filtered = useMemo(() => {
    if (!data) return []
    return data
      .filter(b => riskFilter === 'ALL' || b.riskFlag === riskFilter)
      .filter(b => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return b.name.toLowerCase().includes(q) || b.bank.toLowerCase().includes(q) || (b.primaryCustomer ?? '').toLowerCase().includes(q)
      })
      .sort((a, b) => {
        let cmp = 0
        if (sortKey === 'totalAmount') cmp = a.totalAmount - b.totalAmount
        if (sortKey === 'transactionCount') cmp = a.transactionCount - b.transactionCount
        if (sortKey === 'lastTransactionAt') {
          cmp = new Date(a.lastTransactionAt ?? 0).getTime() - new Date(b.lastTransactionAt ?? 0).getTime()
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [data, search, riskFilter, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by beneficiary, bank, or customer…"
              className="w-full rounded-[10px] border border-ink-100 bg-canvas py-2.5 pl-9 pr-3 text-[13px] text-ink-900 placeholder:text-ink-500 focus:border-electric-500 focus:bg-surface focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 rounded-[10px] border border-ink-100 bg-canvas px-3 py-2 text-[12.5px]">
            <span className="text-ink-500">Risk</span>
            <select
              value={riskFilter}
              onChange={e => { setRiskFilter(e.target.value as RiskLevel | 'ALL'); setPage(1) }}
              className="bg-transparent font-medium text-ink-900 focus:outline-none"
            >
              <option value="ALL">All</option>
              {RISK_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
        </div>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-ink-500" />
            <h2 className="text-[14.5px] font-semibold text-ink-900">Beneficiaries</h2>
          </div>
          <span className="text-[12px] text-ink-500">{filtered.length} results</span>
        </div>

        {isLoading && <div className="p-5"><TableSkeleton /></div>}
        {isError && <ErrorState message="Could not load beneficiaries from the API service layer." />}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState title="No beneficiaries match your filters" description="Try a different search term or clear the risk filter." />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3">Beneficiary</th>
                  <th className="px-3 py-3">Customer</th>
                  <SortableHeader label="Transactions" active={sortKey === 'transactionCount'} dir={sortDir} onClick={() => toggleSort('transactionCount')} />
                  <SortableHeader label="Total Amount" active={sortKey === 'totalAmount'} dir={sortDir} onClick={() => toggleSort('totalAmount')} />
                  <th className="px-3 py-3">Risk Status</th>
                  <SortableHeader label="Last Transaction" active={sortKey === 'lastTransactionAt'} dir={sortDir} onClick={() => toggleSort('lastTransactionAt')} />
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map(b => (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className="cursor-pointer border-b border-ink-100 text-[13px] text-ink-900 transition-colors last:border-0 hover:bg-canvas"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{b.name}</div>
                      <div className="text-[11.5px] text-ink-500">{b.bank} · {b.accountRef}</div>
                    </td>
                    <td className="px-3 py-3.5 text-ink-700">{b.primaryCustomer ?? '—'}</td>
                    <td className="px-3 py-3.5 text-ink-700">{b.transactionCount}</td>
                    <td className="px-3 py-3.5 font-medium">{formatCurrency(b.totalAmount)}</td>
                    <td className="px-3 py-3.5"><RiskBadge level={b.riskFlag} /></td>
                    <td className="px-3 py-3.5 text-ink-500">{b.lastTransactionAt ? formatRelative(b.lastTransactionAt) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(b) }}
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

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={selected ? `${selected.bank} · ${selected.accountRef}` : undefined}
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Risk Status" content={<RiskBadge level={selected.riskFlag} />} />
              <MiniStat label="Transactions" content={selected.transactionCount.toString()} />
              <MiniStat label="Total Amount" content={formatCurrency(selected.totalAmount)} />
              <MiniStat label="Added On" content={formatDateTime(selected.addedOn)} />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-ink-900">Transaction History</h3>
              {selected.transactions.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-ink-500">No transactions on record for this beneficiary yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {selected.transactions.slice(0, 8).map(t => (
                    <div key={t.id} className="flex items-center justify-between rounded-[10px] border border-ink-100 px-3 py-2.5">
                      <div>
                        <div className="text-[12.5px] font-medium text-ink-900">{t.customerName}</div>
                        <div className="text-[11px] text-ink-500">{t.id} · {formatDateTime(t.timestamp)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12.5px] font-semibold text-ink-900">{formatCurrency(t.amount, t.currency)}</div>
                        <RiskBadge level={t.riskLevel} className="mt-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
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

function MiniStat({ label, content }: { label: string; content: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-ink-100 p-3">
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-[13px] font-medium text-ink-900">{content}</div>
    </div>
  )
}
