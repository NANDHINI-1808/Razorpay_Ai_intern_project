import type { RiskLevel } from '@/types'

const riskColors: Record<RiskLevel, string> = {
  LOW: '#0F7A4B', MEDIUM: '#B45B08', HIGH: '#C2410C', CRITICAL: '#C0263A',
}

export function RiskGauge({ score, level, size = 148 }: { score: number; level: RiskLevel; size?: number }) {
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score)) / 100
  const color = riskColors[level]

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDEFF5" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-[var(--font-display)] text-[30px] font-semibold leading-none text-ink-900">{score}</span>
        <span className="text-[11px] font-medium text-ink-500">/ 100</span>
      </div>
    </div>
  )
}
