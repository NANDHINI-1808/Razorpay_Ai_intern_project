import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ShieldCheck } from 'lucide-react'

export function ProtectedRoute() {
  const { user, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-gradient-to-br from-brand-500 to-accent-500">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-[12.5px] text-ink-500">Loading PayShield AI…</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
