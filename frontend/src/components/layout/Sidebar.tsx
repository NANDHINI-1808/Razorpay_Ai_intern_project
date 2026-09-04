import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Activity, ShieldAlert, Search, Users, Landmark,
  BarChart3, ScrollText, Settings, ShieldCheck, LogOut, ShieldQuestion,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const nav = [
  { to: '/', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/transactions', label: 'Live Transactions', icon: Activity },
  { to: '/risk-monitoring', label: 'Risk Monitoring', icon: ShieldAlert },
  { to: '/investigations', label: 'Investigation Center', icon: Search },
  { to: '/verification', label: 'Verification Center', icon: ShieldQuestion },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/beneficiaries', label: 'Beneficiaries', icon: Landmark },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex h-full w-[248px] flex-col bg-brand-950 text-white">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-400 to-accent-500">
          <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>
        <div className="font-[var(--font-display)] leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">PayShield</div>
          <div className="text-[11px] font-medium tracking-[0.14em] text-brand-400">AI PLATFORM</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/90',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {label}
          </NavLink>
        ))}

        <div className="my-2 h-px bg-white/10" />

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium transition-colors',
              isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white/90',
            )
          }
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
          Settings
        </NavLink>
      </nav>

      <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-[12px] bg-white/5 px-3 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-400 text-xs font-semibold">
          {user?.initials ?? '—'}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-medium text-white">{user?.name ?? 'Signed out'}</div>
          <div className="truncate text-[11px] text-white/50">{user?.role ?? ''}</div>
        </div>
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="shrink-0 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
