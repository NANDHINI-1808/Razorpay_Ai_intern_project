import { Card } from '@/components/ui/Card'
import { RiskBadge } from '@/components/ui/Badge'
import type { Transaction } from '@/types'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14.5px] font-semibold text-ink-900">Recent Transactions</h3>
        <Link to="/transactions" className="flex items-center gap-1 text-[12.5px] font-medium text-brand-500 hover:underline">
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-1">
        {transactions.slice(0, 6).map(t => (
          <Link
            key={t.id}
            to={`/transactions/${t.id}`}
            className="flex items-center justify-between rounded-[10px] px-2 py-2.5 transition-colors hover:bg-canvas"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-ink-900">{t.customerName}</div>
              <div className="text-[11.5px] text-ink-500">{t.id} · {t.method}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-ink-900">₹{t.amount.toLocaleString('en-IN')}</span>
              <RiskBadge level={t.riskLevel} />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
