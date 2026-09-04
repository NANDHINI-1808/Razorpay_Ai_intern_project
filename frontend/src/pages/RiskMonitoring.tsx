import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchHourlyRiskTrend, fetchModelPerformance, fetchRiskDistribution, fetchTransactions } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { RiskBadge } from '@/components/ui/Badge'
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/States'
import { formatCurrency, formatRelative } from '@/lib/format'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { AlertOctagon, ChevronRight, Gauge, ShieldAlert } from 'lucide-react'
import type { RiskLevel } from '@/types'

const riskColors: Record<RiskLevel, string> = {
  LOW: '#0F7A4B', MEDIUM: '#B45B08', HIGH: '#C2410C', CRITICAL: '#C0263A',
}

export default function RiskMonitoring() {
  const navigate = useNavigate()
  const txns = useQuery({ queryKey: ['transactions'], queryFn: fetchTransactions })
  const distribution = useQuery({ queryKey: ['risk-distribution'], queryFn: fetchRiskDistribution })
  const trendQuery = useQuery({ queryKey: ['hourly-risk-trend'], queryFn: fetchHourlyRiskTrend })
  const modelPerf = useQuery({ queryKey: ['model-performance'], queryFn: fetchModelPerformance })

  const isLoading = txns.isLoading || distribution.isLoading || trendQuery.isLoading
  const isError = txns.isError || distribution.isError || trendQuery.isError

  const stats = useMemo(() => {
    if (!txns.data) return null
    const total = txns.data.length
    const avgRisk = Math.round(txns.data.reduce((s, t) => s + t.riskScore, 0) / total)
    const suspicious = txns.data.filter(t => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL').length
    const byLevel = (level: RiskLevel) => txns.data!.filter(t => t.riskLevel === level).length
    return {
      total, avgRisk, suspicious,
      low: byLevel('LOW'), medium: byLevel('MEDIUM'), high: byLevel('HIGH'), critical: byLevel('CRITICAL'),
    }
  }, [txns.data])

  // Hourly risk trend now lives in services/mockData.ts (getHourlyRiskTrend) —
  // shared with the Analytics page instead of being computed here in JSX.
  const trend = trendQuery.data ?? []

  const highRisk = (txns.data ?? []).filter(t => t.riskLevel === 'HIGH').sort((a, b) => b.riskScore - a.riskScore)
  const critical = (txns.data ?? []).filter(t => t.riskLevel === 'CRITICAL').sort((a, b) => b.riskScore - a.riskScore)
  const recentEvents = (txns.data ?? [])
    .filter(t => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <CardSkeleton className="h-24" /><CardSkeleton className="h-24" />
        <CardSkeleton className="h-24" /><CardSkeleton className="h-24" />
        <CardSkeleton className="h-72 lg:col-span-2" /><CardSkeleton className="h-72 lg:col-span-2" />
      </div>
    )
  }

  if (isError) return <ErrorState message="Could not load risk data from the API service layer." />

  return (
    <div className="space-y-5">
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <StatTile label="Transactions Analyzed" value={stats!.total.toString()} icon={Gauge} tone="brand" />
        <StatTile label="Low Risk" value={stats!.low.toString()} icon={ShieldAlert} tone="success" />
        <StatTile label="Medium Risk" value={stats!.medium.toString()} icon={ShieldAlert} tone="warning" />
        <StatTile label="High Risk" value={stats!.high.toString()} icon={ShieldAlert} tone="high" />
        <StatTile label="Critical Risk" value={stats!.critical.toString()} icon={AlertOctagon} tone="critical" />
        <StatTile label="Avg Risk Score" value={stats!.avgRisk.toString()} icon={Gauge} tone="brand" />
      </div>

      {modelPerf.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label="Fraud Detection Rate (Recall)"
            value={modelPerf.data.metricsAtOperatingThreshold.recall != null ? `${(modelPerf.data.metricsAtOperatingThreshold.recall * 100).toFixed(1)}%` : 'Not available'}
            icon={ShieldAlert}
            tone="success"
          />
          <StatTile
            label="False Positive Rate"
            value={modelPerf.data.metricsAtOperatingThreshold.falsePositiveRate != null ? `${(modelPerf.data.metricsAtOperatingThreshold.falsePositiveRate * 100).toFixed(1)}%` : 'Not available'}
            icon={AlertOctagon}
            tone="critical"
          />
          <StatTile label="Current Risk Threshold" value={modelPerf.data.operatingThreshold.toString()} icon={Gauge} tone="brand" />
        </div>
      )}
      {modelPerf.data && (
        <p className="text-[11px] text-ink-500">
          Detection/false-positive rates computed against a {modelPerf.data.datasetLabel.toLowerCase()} — see Analytics
          → Model Performance for full methodology.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Distribution */}
        <Card className="p-6">
          <h3 className="text-[14.5px] font-semibold text-ink-900">Risk Distribution</h3>
          <p className="text-[12px] text-ink-500">{stats!.suspicious} suspicious transactions (high + critical)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distribution.data} margin={{ left: -20, top: 16 }}>
              <CartesianGrid vertical={false} stroke="#EDEFF5" />
              <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#F6F7FB' }} contentStyle={{ borderRadius: 10, border: '1px solid #EDEFF5', fontSize: 12.5 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {(distribution.data ?? []).map(d => <Cell key={d.level} fill={riskColors[d.level]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Trend */}
        <Card className="p-6">
          <h3 className="text-[14.5px] font-semibold text-ink-900">Risk Trend</h3>
          <p className="text-[12px] text-ink-500">Average risk score by hour, derived from transaction activity</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ left: -20, top: 16 }}>
              <CartesianGrid vertical={false} stroke="#EDEFF5" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #EDEFF5', fontSize: 12.5 }} />
              <Line type="monotone" dataKey="value" stroke="#2F4BC4" strokeWidth={2.5} dot={{ r: 3, fill: '#2F4BC4' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RiskListCard title="High-Risk Transactions" items={highRisk} onOpen={navigate} emptyText="No high-risk transactions right now." />
        <RiskListCard title="Critical Transactions" items={critical} onOpen={navigate} emptyText="No critical transactions right now." critical />
      </div>

      <Card className="p-6">
        <h3 className="text-[14.5px] font-semibold text-ink-900">Recent Risk Events</h3>
        {recentEvents.length === 0 ? (
          <EmptyState title="No recent risk events" description="High and critical risk transactions will appear here as they occur." />
        ) : (
          <ol className="mt-4 space-y-3">
            {recentEvents.map(t => (
              <li key={t.id}>
                <button
                  onClick={() => navigate(`/transactions/${t.id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-[10px] px-2 py-2.5 text-left transition-colors hover:bg-canvas"
                >
                  <div className="flex items-center gap-3">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: riskColors[t.riskLevel] }} />
                    <div>
                      <div className="text-[13px] font-medium text-ink-900">{t.customerName} · {t.id}</div>
                      <div className="text-[11.5px] text-ink-500">{t.aiRecommendation}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11.5px] text-ink-500">{formatRelative(t.timestamp)}</span>
                    <RiskBadge level={t.riskLevel} />
                  </div>
                </button>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}

function StatTile({
  label, value, icon: Icon, tone,
}: { label: string; value: string; icon: typeof Gauge; tone: 'brand' | 'success' | 'warning' | 'high' | 'critical' }) {
  const toneMap = {
    brand: 'bg-brand-100 text-brand-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    high: 'bg-[#FFE4D6] text-[#C2410C]',
    critical: 'bg-critical-100 text-critical-600',
  }
  return (
    <Card className="p-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${toneMap[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 font-[var(--font-display)] text-[22px] font-semibold text-ink-900">{value}</div>
      <div className="text-[11.5px] text-ink-500">{label}</div>
    </Card>
  )
}

function RiskListCard({
  title, items, onOpen, emptyText, critical = false,
}: {
  title: string
  items: { id: string; customerName: string; amount: number; currency: string; riskScore: number; riskLevel: RiskLevel; timestamp: string }[]
  onOpen: (path: string) => void
  emptyText: string
  critical?: boolean
}) {
  return (
    <Card className={`p-6 ${critical ? 'border-critical-100' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[14.5px] font-semibold text-ink-900">{title}</h3>
        <span className="text-[12px] text-ink-500">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-[12.5px] text-ink-500">{emptyText}</p>
      ) : (
        <div className="mt-3 space-y-1">
          {items.slice(0, 5).map(t => (
            <button
              key={t.id}
              onClick={() => onOpen(`/transactions/${t.id}`)}
              className="flex w-full items-center justify-between rounded-[10px] px-2 py-2.5 text-left transition-colors hover:bg-canvas"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-ink-900">{t.customerName}</div>
                <div className="text-[11.5px] text-ink-500">{t.id} · {formatCurrency(t.amount, t.currency)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-ink-900">{t.riskScore}</span>
                <ChevronRight className="h-4 w-4 text-ink-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
