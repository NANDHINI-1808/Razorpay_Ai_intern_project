import type { RiskBreakdownFactor } from '@/types'

const severityWidth: Record<string, number> = { LOW: 25, MEDIUM: 50, HIGH: 75, CRITICAL: 100 }
const severityColor: Record<string, string> = {
  LOW: '#0F7A4B', MEDIUM: '#B45B08', HIGH: '#C2410C', CRITICAL: '#C0263A',
}

export function RiskBreakdown({ factors }: { factors: RiskBreakdownFactor[] }) {
  return (
    <div className="space-y-3">
      {factors.map(f => (
        <div key={f.category}>
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="font-medium text-ink-700">{f.category}</span>
            <span className={f.severity ? 'font-semibold text-ink-900' : 'text-ink-500'}>
              {f.severity ?? 'No elevated risk'}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${f.severity ? severityWidth[f.severity] : 4}%`,
                background: f.severity ? severityColor[f.severity] : '#C6CAD6',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
