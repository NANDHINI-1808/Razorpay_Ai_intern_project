import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchRiskThresholds } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import {
  Bell, Fingerprint, Laptop, LogOut, ShieldAlert, SlidersHorizontal, UserCircle,
} from 'lucide-react'

export default function Settings() {
  const thresholds = useQuery({ queryKey: ['risk-thresholds'], queryFn: fetchRiskThresholds })
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Profile */}
      <SettingsSection icon={UserCircle} title="Profile" description="Your PayShield AI account identity.">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-[16px] font-semibold text-white">
              {user?.initials ?? '—'}
            </div>
            <div>
              <div className="text-[14px] font-semibold text-ink-900">{user?.name ?? 'Signed out'}</div>
              <div className="text-[12.5px] text-ink-500">{user?.role} · {user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-ink-100 px-3 py-2 text-[12.5px] font-medium text-ink-700 transition-colors hover:bg-canvas"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
        <p className="mt-4 text-[11.5px] text-ink-500">
          Profile fields are read-only in this build — this is a demo authentication session, not a connected backend.
        </p>
      </SettingsSection>

      {/* Security */}
      <SettingsSection icon={Fingerprint} title="Security" description="Session and access controls.">
        <ToggleRow label="Require step-up verification for critical actions" defaultChecked persisted={false} />
        <ToggleRow label="Email me on new device sign-in" defaultChecked={false} persisted={false} />
        <div className="mt-4 flex items-center gap-3 rounded-[10px] bg-canvas p-3.5">
          <Laptop className="h-4 w-4 shrink-0 text-ink-500" />
          <div className="text-[12.5px] text-ink-700">
            Current session · <span className="text-ink-500">{navigator.userAgent.match(/Chrome|Firefox|Safari|Edge/)?.[0] ?? 'This browser'}</span>
          </div>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={Bell} title="Notifications" description="Choose what PayShield AI should notify you about.">
        <ToggleRow label="Critical risk transactions" defaultChecked persisted={false} />
        <ToggleRow label="New investigation case assigned to me" defaultChecked persisted={false} />
        <ToggleRow label="Weekly analytics digest" defaultChecked={false} persisted={false} />
      </SettingsSection>

      {/* Risk Configuration */}
      <SettingsSection icon={ShieldAlert} title="Risk Configuration" description="Current thresholds used by the risk engine.">
        {thresholds.data ? (
          <div className="grid grid-cols-3 gap-3">
            <ThresholdTile label="Critical ≥" value={thresholds.data.CRITICAL} tone="text-critical-600" />
            <ThresholdTile label="High ≥" value={thresholds.data.HIGH} tone="text-[#C2410C]" />
            <ThresholdTile label="Medium ≥" value={thresholds.data.MEDIUM} tone="text-warning-600" />
          </div>
        ) : (
          <div className="h-16 animate-pulse rounded-[10px] bg-ink-100" />
        )}
        <p className="mt-4 text-[11.5px] text-ink-500">
          Thresholds are read-only here, reflecting the risk engine's current configuration. Editable threshold
          management will require a connected risk-engine admin API.
        </p>
      </SettingsSection>

      {/* Application Preferences */}
      <SettingsSection icon={SlidersHorizontal} title="Application Preferences" description="Interface behavior for this session.">
        <ToggleRow label="Compact table density" defaultChecked={false} persisted={false} />
        <ToggleRow label="Auto-refresh dashboard every 60s" defaultChecked={false} persisted={false} />
      </SettingsSection>
    </div>
  )
}

function SettingsSection({
  icon: Icon, title, description, children,
}: { icon: typeof UserCircle; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-500" />
        <h3 className="text-[14px] font-semibold text-ink-900">{title}</h3>
      </div>
      <p className="mt-1 text-[12px] text-ink-500">{description}</p>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

function ToggleRow({ label, defaultChecked, persisted }: { label: string; defaultChecked: boolean; persisted: boolean }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <label className="flex items-center justify-between border-b border-ink-100 py-3 last:border-0">
      <span className="text-[13px] text-ink-700">
        {label}
        {!persisted && <span className="ml-2 text-[10.5px] font-medium uppercase tracking-wide text-ink-300">not saved</span>}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked(v => !v)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-ink-100'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  )
}

function ThresholdTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-[10px] border border-ink-100 p-3.5 text-center">
      <div className={`font-[var(--font-display)] text-[22px] font-semibold ${tone}`}>{value}</div>
      <div className="text-[11px] text-ink-500">{label}</div>
    </div>
  )
}
