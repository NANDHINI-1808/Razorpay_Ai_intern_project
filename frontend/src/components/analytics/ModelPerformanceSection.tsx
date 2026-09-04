import { useQuery } from '@tanstack/react-query'
import { fetchModelPerformance } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { CardSkeleton, ErrorState } from '@/components/ui/States'
import { RiskBadge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/format'
import type { ModelMetrics } from '@/types'
import { AlertTriangle, FlaskConical, ShieldCheck } from 'lucide-react'

function pct(v: number | null) {
  return v == null ? 'Not available' : `${(v * 100).toFixed(1)}%`
}

export function ModelPerformanceSection() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['model-performance'], queryFn: fetchModelPerformance })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}
      </div>
    )
  }
  if (isError || !data) return <ErrorState message="Model performance data unavailable — the risk engine result on individual transactions is unaffected." />

  const m = data.metricsAtOperatingThreshold

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5 rounded-[10px] border border-warning-100 bg-warning-100/40 px-4 py-3 text-[12px] text-ink-700">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" />
        <div>
          <span className="font-semibold text-warning-600">{data.datasetLabel}.</span> {data.datasetDisclosure}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Precision" value={pct(m.precision)} />
        <MetricTile label="Recall" value={pct(m.recall)} />
        <MetricTile label="F1 Score" value={pct(m.f1)} />
        <MetricTile label="Accuracy" value={pct(m.accuracy)} />
        <MetricTile label="False Positive Rate" value={pct(m.falsePositiveRate)} tone="text-critical-600" />
        <MetricTile label="False Negative Rate" value={pct(m.falseNegativeRate)} tone="text-critical-600" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Confusion matrix */}
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
            <h3 className="text-[14.5px] font-semibold text-ink-900">Confusion Matrix</h3>
          </div>
          <p className="mt-1 text-[12px] text-ink-500">
            At operating threshold {data.operatingThreshold} (risk score ≥ {data.operatingThreshold} → flagged suspicious)
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <ConfusionCell label="True Positive" value={m.confusionMatrix.truePositive} tone="bg-success-100 text-success-600" />
            <ConfusionCell label="False Positive" value={m.confusionMatrix.falsePositive} tone="bg-critical-100 text-critical-600" />
            <ConfusionCell label="False Negative" value={m.confusionMatrix.falseNegative} tone="bg-critical-100 text-critical-600" />
            <ConfusionCell label="True Negative" value={m.confusionMatrix.trueNegative} tone="bg-success-100 text-success-600" />
          </div>
          <div className="mt-3 grid grid-cols-2 text-center text-[10.5px] text-ink-500">
            <div>Predicted Suspicious</div>
            <div>Predicted Legitimate</div>
          </div>
        </Card>

        {/* False positive impact */}
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-critical-600" />
            <h3 className="text-[14.5px] font-semibold text-ink-900">False Positive Impact</h3>
          </div>
          <p className="mt-1 text-[12px] text-ink-500">A false positive incorrectly flags a legitimate transaction as suspicious.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="False Positives" value={data.falsePositiveImpact.falsePositiveCount.toString()} />
            <MiniStat label="False Positive Rate" value={pct(data.falsePositiveImpact.falsePositiveRate)} />
            <MiniStat label="Transactions Impacted" value={data.falsePositiveImpact.estimatedTransactionsImpacted.toString()} />
            <MiniStat label="Est. Merchant Cost" value={formatCurrency(data.falsePositiveImpact.estimatedMerchantCost)} />
          </div>
          <p className="mt-3 text-[10.5px] text-ink-500">
            Illustrative Cost Assumption — {formatCurrency(data.falsePositiveImpact.costPerFalsePositive)} per false positive
            (customer friction / support load), not a real merchant figure.
          </p>
        </Card>
      </div>

      {/* Threshold analysis */}
      <Card className="p-6">
        <h3 className="text-[14.5px] font-semibold text-ink-900">Risk Threshold Analysis</h3>
        <p className="mt-1 text-[12px] text-ink-500">
          How the flagging threshold trades off precision against recall. Current operating threshold: {data.operatingThreshold}.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="py-2 pr-4">Threshold</th>
                <th className="py-2 pr-4">Precision</th>
                <th className="py-2 pr-4">Recall</th>
                <th className="py-2 pr-4">False Positives</th>
                <th className="py-2 pr-4">False Negatives</th>
                <th className="py-2">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.thresholdComparison.map((row: ModelMetrics) => (
                <tr key={row.threshold} className={`border-b border-ink-100 last:border-0 ${row.threshold === data.operatingThreshold ? 'bg-brand-50' : ''}`}>
                  <td className="py-2.5 pr-4 font-semibold text-ink-900">
                    {row.threshold}
                    {row.threshold === data.operatingThreshold && <span className="ml-1.5 text-[10px] font-medium text-brand-600">(current)</span>}
                  </td>
                  <td className="py-2.5 pr-4 text-ink-700">{pct(row.precision)}</td>
                  <td className="py-2.5 pr-4 text-ink-700">{pct(row.recall)}</td>
                  <td className="py-2.5 pr-4 text-ink-700">{row.confusionMatrix.falsePositive}</td>
                  <td className="py-2.5 pr-4 text-ink-700">{row.confusionMatrix.falseNegative}</td>
                  <td className="py-2.5 text-ink-700">
                    {formatCurrency(row.confusionMatrix.falsePositive * data.falsePositiveImpact.costPerFalsePositive)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-500">
          <span className="font-medium text-ink-700">Why {data.operatingThreshold}?</span> Lower thresholds catch more
          fraud (higher recall) but flag more legitimate customers (higher false-positive cost); higher thresholds
          reduce customer friction but let more fraud through. {data.operatingThreshold} is used as the current
          operating point balancing both against this synthetic dataset — it is not tuned against real outcome data.
        </p>
      </Card>

      {/* Error analysis */}
      <Card className="p-6">
        <h3 className="text-[14.5px] font-semibold text-ink-900">Error Analysis</h3>
        <p className="mt-1 text-[12px] text-ink-500">Individual false positives and false negatives from the synthetic demo set (not a genuine held-out test set — see disclosure above).</p>
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-critical-600">False Positives</div>
            <p className="mt-1 text-[11.5px] text-ink-500">Legitimate transaction incorrectly flagged.</p>
            {data.falsePositiveExamples.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-ink-500">None at this threshold.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {data.falsePositiveExamples.slice(0, 5).map(e => (
                  <div key={e.transactionId} className="flex items-center justify-between rounded-[10px] border border-ink-100 px-3 py-2">
                    <div className="text-[12px] font-medium text-ink-900">{e.transactionId} · {e.customerName}</div>
                    <RiskBadge level={e.riskLevel} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-critical-600">False Negatives</div>
            <p className="mt-1 text-[11.5px] text-ink-500">Fraudulent transaction incorrectly classified as legitimate.</p>
            {data.falseNegativeExamples.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-ink-500">None at this threshold.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {data.falseNegativeExamples.slice(0, 5).map(e => (
                  <div key={e.transactionId} className="flex items-center justify-between rounded-[10px] border border-ink-100 px-3 py-2">
                    <div className="text-[12px] font-medium text-ink-900">{e.transactionId} · {e.customerName}</div>
                    <RiskBadge level={e.riskLevel} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

function MetricTile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card className="p-4">
      <div className={`font-[var(--font-display)] text-[20px] font-semibold ${tone ?? 'text-ink-900'}`}>{value}</div>
      <div className="text-[11px] text-ink-500">{label}</div>
    </Card>
  )
}

function ConfusionCell({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-[10px] p-4 ${tone}`}>
      <div className="font-[var(--font-display)] text-[24px] font-semibold">{value}</div>
      <div className="text-[11px] font-medium">{label}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-ink-100 p-3">
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-ink-900">{value}</div>
    </div>
  )
}
