import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCustomerSummaries } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States'
import { formatCurrency, formatDateTime, formatRelative } from '@/lib/format'
import type { CustomerSummary, RiskLevel } from '@/types'
import { ChevronRight, Search, Users } from 'lucide-react'

const PAGE_SIZE = 8
const RISK_LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function Customers() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['customer-summaries'], queryFn: fetchCustomerSummaries })
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<CustomerSummary | null>(null)

  const filtered = useMemo(() => {
    if (!data) return []
    return data
      .filter(c => riskFilter === 'ALL' || c.riskProfile === riskFilter)
      .filter(c => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
      })
  }, [data, search, riskFilter])

  const summary = useMemo(() => {
    if (!data) return null
    return {
      total: data.length,
      active: data.filter(c => c.status === 'ACTIVE').length,
      underReview: data.filter(c => c.status === 'UNDER_REVIEW').length,
      elevated: data.filter(c => c.riskProfile === 'HIGH' || c.riskProfile === 'CRITICAL').length,
    }
  }, [data])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5">
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryTile label="Total Customers" value={summary.total} />
          <SummaryTile label="Active" value={summary.active} tone="text-success-600" />
          <SummaryTile label="Under Review" value={summary.underReview} tone="text-warning-600" />
          <SummaryTile label="Elevated Risk" value={summary.elevated} tone="text-critical-600" />
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name, email, or customer ID…"
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
            <Users className="h-4 w-4 text-ink-500" />
            <h2 className="text-[14.5px] font-semibold text-ink-900">Customers</h2>
          </div>
          <span className="text-[12px] text-ink-500">{filtered.length} results</span>
        </div>

        {isLoading && <div className="p-5"><TableSkeleton /></div>}
        {isError && <ErrorState message="Could not load customers from the API service layer." />}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState title="No customers match your filters" description="Try a different search term or clear the risk filter." />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-3 py-3">Transactions</th>
                  <th className="px-3 py-3">Total Amount</th>
                  <th className="px-3 py-3">Risk Level</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Last Activity</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="cursor-pointer border-b border-ink-100 text-[13px] text-ink-900 transition-colors last:border-0 hover:bg-canvas"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-[11.5px] text-ink-500">{c.email}</div>
                    </td>
                    <td className="px-3 py-3.5 text-ink-700">{c.totalTransactions}</td>
                    <td className="px-3 py-3.5 font-medium">{formatCurrency(c.totalAmount)}</td>
                    <td className="px-3 py-3.5"><RiskBadge level={c.riskProfile} /></td>
                    <td className="px-3 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-3.5 text-ink-500">{c.lastActivityAt ? formatRelative(c.lastActivityAt) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(c) }}
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
        subtitle={selected ? `${selected.id} · ${selected.email}` : undefined}
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Risk Profile" content={<RiskBadge level={selected.riskProfile} />} />
              <MiniStat label="Status" content={<StatusBadge status={selected.status} />} />
              <MiniStat label="Account Age" content={selected.accountAge} />
              <MiniStat label="Total Transactions" content={selected.totalTransactions.toString()} />
            </div>
            <div className="rounded-[10px] bg-canvas p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">Total Transaction Amount</div>
              <div className="mt-1 font-[var(--font-display)] text-[22px] font-semibold text-ink-900">{formatCurrency(selected.totalAmount)}</div>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-ink-900">Recent Activity</h3>
              {selected.recentTransactions.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-ink-500">No transactions recorded for this customer.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {selected.recentTransactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between rounded-[10px] border border-ink-100 px-3 py-2.5">
                      <div>
                        <div className="text-[12.5px] font-medium text-ink-900">{t.id}</div>
                        <div className="text-[11px] text-ink-500">{formatDateTime(t.timestamp)}</div>
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

function SummaryTile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="p-4">
      <div className={`font-[var(--font-display)] text-[24px] font-semibold ${tone ?? 'text-ink-900'}`}>{value}</div>
      <div className="text-[11.5px] text-ink-500">{label}</div>
    </Card>
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
