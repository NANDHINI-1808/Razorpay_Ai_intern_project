import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'

const riskStyles: Record<RiskLevel, string> = {
  LOW: 'bg-success-100 text-success-600',
  MEDIUM: 'bg-warning-100 text-warning-600',
  HIGH: 'bg-[#FFE4D6] text-[#C2410C]',
  CRITICAL: 'bg-critical-100 text-critical-600',
}

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
        riskStyles[level],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level}
    </span>
  )
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone =
    status === 'BLOCKED' || status === 'REJECTED' ? 'bg-critical-100 text-critical-600' :
    status === 'ON_HOLD' ? 'bg-[#FFE4D6] text-[#C2410C]' :
    status === 'VERIFICATION_REQUIRED' || status === 'PENDING_REVIEW' || status === 'UNDER_REVIEW' || status === 'OPEN' || status === 'PENDING' ? 'bg-warning-100 text-warning-600' :
    status === 'VERIFIED' || status === 'RESOLVED' || status === 'APPROVED' || status === 'ACTIVE' ? 'bg-success-100 text-success-600' :
    status === 'EXPIRED' || status === 'CANCELLED' ? 'bg-ink-100 text-ink-500' :
    'bg-ink-100 text-ink-700'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tone, className)}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
