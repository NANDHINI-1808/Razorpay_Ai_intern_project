import { Card } from '@/components/ui/Card'
import { FadeIn } from '@/components/ui/FadeIn'
import { useCountUp } from '@/hooks/useCountUp'
import type { KPI } from '@/types'
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react'

export function KPIGrid({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi, i) => (
        <FadeIn key={kpi.label} delayMs={i * 40}>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-ink-500">{kpi.label}</span>
              <TrendingUp className="h-3.5 w-3.5 text-ink-300" />
            </div>
            <div className="mt-2 font-[var(--font-display)] text-[26px] font-semibold tracking-tight text-ink-900">
              <KPIValue value={kpi.value} />
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11.5px] text-ink-500">{kpi.supportingText}</span>
              {kpi.trend && (
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                    kpi.trend.direction === 'up' ? 'text-success-600' : 'text-critical-600'
                  }`}
                >
                  {kpi.trend.direction === 'up' ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {kpi.trend.value}
                </span>
              )}
            </div>
          </Card>
        </FadeIn>
      ))}
    </div>
  )
}

/**
 * Count-up applies only when the KPI value is a plain integer count
 * (optionally comma-formatted, e.g. "1,234") — never to compound strings
 * like "₹12.3K" or "94%", which aren't safely animatable without inventing
 * intermediate formatted states. Those render as static text.
 */
function KPIValue({ value }: { value: string }) {
  const numeric = /^[\d,]+$/.test(value) ? Number(value.replace(/,/g, '')) : null
  const animated = useCountUp(numeric ?? 0)
  if (numeric === null) return <>{value}</>
  return <>{Math.round(animated).toLocaleString()}</>
}
