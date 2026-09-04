import type { RecommendedAction, RiskLevel } from '@/types'
import { RiskBadge } from '@/components/ui/Badge'
import { ShieldCheck, ShieldQuestion, ShieldX, PauseCircle, Sparkles } from 'lucide-react'

const config: Record<RecommendedAction, { label: string; tone: string; icon: typeof ShieldCheck }> = {
  APPROVE: { label: 'Approve Transaction', tone: 'bg-success-100 text-success-600', icon: ShieldCheck },
  VERIFY: { label: 'Verify Transaction', tone: 'bg-warning-100 text-warning-600', icon: ShieldQuestion },
  HOLD: { label: 'Hold Transaction', tone: 'bg-[#FFE4D6] text-[#C2410C]', icon: PauseCircle },
  BLOCK: { label: 'Block Transaction', tone: 'bg-critical-100 text-critical-600', icon: ShieldX },
}

export function RecommendationPanel({
  action, reason, confidence, riskLevel, explanation,
}: { action: RecommendedAction; reason: string; confidence: number; riskLevel: RiskLevel; explanation: string }) {
  const { label, tone, icon: Icon } = config[action]
  return (
    <div className="rounded-[14px] border border-ink-100 bg-canvas p-5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        <Sparkles className="h-3 w-3" />
        AI Decision Support
      </div>
      <div className={`mt-2 inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-[15px] font-semibold ${tone}`}>
        <Icon className="h-[18px] w-[18px]" />
        {label.toUpperCase()}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-700">{reason}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[10px] border border-ink-100 bg-surface p-3">
          <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-500">Risk Level</div>
          <div className="mt-1"><RiskBadge level={riskLevel} /></div>
        </div>
        <div className="rounded-[10px] border border-ink-100 bg-surface p-3">
          <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-500">AI Confidence</div>
          <div className="mt-1 text-[15px] font-semibold text-ink-900">{confidence}%</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11.5px] text-ink-500">
          <span>Confidence</span>
          <span className="font-semibold text-ink-900">{confidence}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${confidence}%` }} />
        </div>
      </div>

      <div className="mt-4 border-t border-ink-100 pt-3.5">
        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-500">Why AI Recommended This</div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-700">{explanation}</p>
      </div>
    </div>
  )
}
