import { Bell, PanelLeft } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const titles: Record<string, string> = {
  '/': 'Overview',
  '/transactions': 'Live Transactions',
  '/risk-monitoring': 'Risk Monitoring',
  '/investigations': 'Investigation Center',
  '/verification': 'Verification Center',
  '/customers': 'Customers',
  '/beneficiaries': 'Beneficiaries',
  '/analytics': 'Analytics',
  '/audit-logs': 'Audit Logs',
  '/settings': 'Settings',
}

export function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const base = '/' + pathname.split('/')[1]
  const title = titles[pathname] ?? titles[base] ?? 'PayShield AI'

  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-100 bg-surface px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </button>
        <h1 className="text-[15px] font-semibold text-ink-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-success-100 px-3 py-1.5 text-xs font-semibold text-success-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-600" />
          AI ENGINE ONLINE
        </div>
        <button className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-critical-600" />
        </button>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-semibold text-white"
          title={user?.name}
        >
          {user?.initials ?? '—'}
        </div>
      </div>
    </header>
  )
}
