// Pure, deterministic derivations from existing Investigation data.
// No network calls, no fabricated values — every output here is computed
// directly from fields the mock service layer already returns.
import type { Investigation, RecommendedAction, RiskBreakdownFactor } from '@/types'

/**
 * Short, user-facing explanation of why the AI recommended its action —
 * built from the case's actual signal labels. Not a chain-of-thought dump,
 * just a one-sentence summary suitable for an analyst-facing UI.
 */
export function getRecommendationExplanation(investigation: Investigation): string {
  const labels = investigation.signals.map(s => s.label.toLowerCase())
  if (labels.length === 0) return 'No elevated risk signals were detected for this transaction.'
  if (labels.length === 1) return `A risk signal was detected: ${labels[0]}.`
  const last = labels[labels.length - 1]
  const rest = labels.slice(0, -1).join(', ')
  return `Multiple risk signals were detected, including ${rest} and ${last}.`
}

const NEXT_BEST_ACTION: Record<RecommendedAction, string> = {
  APPROVE: 'No further action needed — release the transaction.',
  VERIFY: 'Request customer verification before releasing the transaction.',
  HOLD: 'Place the transaction on hold pending analyst review.',
  BLOCK: 'Block the transaction and flag the account for manual investigation.',
}

export function getNextBestAction(action: RecommendedAction): string {
  return NEXT_BEST_ACTION[action]
}

export function getConfidenceLabel(confidence: number): 'High Confidence' | 'Medium Confidence' | 'Low Confidence' {
  if (confidence >= 85) return 'High Confidence'
  if (confidence >= 65) return 'Medium Confidence'
  return 'Low Confidence'
}

/**
 * Qualitative risk-factor breakdown. There is no granular numeric score per
 * category in the underlying data, so each factor is bucketed to the
 * severity of whichever existing signal maps to it — not an invented number.
 * A category with no matching signal is shown as having no elevated risk.
 */
export function getRiskBreakdown(investigation: Investigation): RiskBreakdownFactor[] {
  const find = (keywords: string[]) => {
    const match = investigation.signals.find(s =>
      keywords.some(k => s.label.toLowerCase().includes(k)),
    )
    return match?.severity ?? null
  }
  return [
    { category: 'Device Risk', severity: find(['device']) },
    { category: 'Transaction Risk', severity: find(['beneficiary', 'amount', 'transaction']) },
    { category: 'Behaviour Risk', severity: find(['velocity', 'behaviour', 'behavior', 'pattern']) },
    { category: 'Location Risk', severity: find(['location', 'geo']) },
  ]
}
