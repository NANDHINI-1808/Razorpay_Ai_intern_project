import { useQuery } from '@tanstack/react-query'
import { fetchAnalyticsSummary } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { CardSkeleton, ErrorState } from '@/components/ui/States'
import { ModelPerformanceSection } from '@/components/analytics/ModelPerformanceSection'
import { FadeIn } from '@/components/ui/FadeIn'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { BadgeInfo, LineChart as LineChartIcon, TrendingUp } from 'lucide-react'
import type { CaseStatus, RiskLevel } from '@/types'

const riskColors: Record<RiskLevel, string> = {
  LOW: '#0F7A4B', MEDIUM: '#B45B08', HIGH: '#C2410C', CRITICAL: '#C0263A',
}
const caseStatusColors: Record<CaseStatus, string> = {
  OPEN: '#6B7183', UNDER_REVIEW: '#B45B08', ON_HOLD: '#C2410C', VERIFIED: '#0F7A4B',
  BLOCKED: '#C0263A', FALSE_POSITIVE: '#4C64D6', RESOLVED: '#5B4FE0',
}

export default function Analytics() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['analytics-summary'], queryFn: fetchAnalyticsSummary })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}
        <CardSkeleton className="h-72 lg:col-span-2" />
        <CardSkeleton className="h-72 lg:col-span-2" />
      </div>
    )
  }

  if (isError || !data) return <ErrorState message="Could not load analytics from the API service layer." />

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-[10px] bg-brand-50 px-3.5 py-2.5 text-[12px] text-brand-600">
        <BadgeInfo className="h-4 w-4 shrink-0" />
        Figures below are computed from PayShield AI's synthetic demo dataset — not live production data.
      </div>

      <div className="flex items-center gap-2 pt-1">
        <TrendingUp className="h-4 w-4 text-brand-500" />
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-700">Business Performance</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.kpis.map((kpi, i) => (
          <FadeIn key={kpi.label} delayMs={i * 40}>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-medium text-ink-500">{kpi.label}</span>
                <TrendingUp className="h-3.5 w-3.5 text-ink-300" />
              </div>
              <div className="mt-2 font-[var(--font-display)] text-[24px] font-semibold tracking-tight text-ink-900">{kpi.value}</div>
              <div className="mt-1 text-[11.5px] text-ink-500">{kpi.supportingText}</div>
            </Card>
          </FadeIn>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-[14.5px] font-semibold text-ink-900">Transaction Volume Trend</h3>
          <p className="text-[12px] text-ink-500">Transaction count by hour</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.volumeTrend} margin={{ left: -20, top: 16 }}>
              <defs>
                <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2F4BC4" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2F4BC4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#EDEFF5" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #EDEFF5', fontSize: 12.5 }} />
              <Area type="monotone" dataKey="value" stroke="#2F4BC4" strokeWidth={2.5} fill="url(#volumeFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-[14.5px] font-semibold text-ink-900">Risk Distribution</h3>
          <p className="text-[12px] text-ink-500">Transactions by risk level</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.riskDistribution} margin={{ left: -20, top: 16 }}>
              <CartesianGrid vertical={false} stroke="#EDEFF5" />
              <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #EDEFF5', fontSize: 12.5 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.riskDistribution.map(d => <Cell key={d.level} fill={riskColors[d.level]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-[14.5px] font-semibold text-ink-900">Risk Trend</h3>
          <p className="text-[12px] text-ink-500">Average risk score by hour</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.riskTrend} margin={{ left: -20, top: 16 }}>
              <CartesianGrid vertical={false} stroke="#EDEFF5" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #EDEFF5', fontSize: 12.5 }} />
              <Line type="monotone" dataKey="value" stroke="#B45B08" strokeWidth={2.5} dot={{ r: 3, fill: '#B45B08' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-[14.5px] font-semibold text-ink-900">High-Risk Transaction Trend</h3>
          <p className="text-[12px] text-ink-500">High + critical transactions by hour</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.highRiskTrend} margin={{ left: -20, top: 16 }}>
              <defs>
                <linearGradient id="highRiskFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C0263A" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#C0263A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#EDEFF5" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #EDEFF5', fontSize: 12.5 }} />
              <Area type="monotone" dataKey="value" stroke="#C0263A" strokeWidth={2.5} fill="url(#highRiskFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-[14.5px] font-semibold text-ink-900">Detection Performance</h3>
        <p className="text-[12px] text-ink-500">
          Outcome breakdown of investigated cases — a proxy for detection performance derived from case
          resolution status, since this dataset has no independent ground-truth fraud label.
        </p>
        <div className="mt-2 flex flex-col items-center gap-6 sm:flex-row">
          <ResponsiveContainer width="100%" height={220} className="max-w-[260px]">
            <PieChart>
              <Pie
                data={data.detectionPerformance}
                dataKey="count"
                nameKey="status"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.detectionPerformance.map(d => <Cell key={d.status} fill={caseStatusColors[d.status]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #EDEFF5', fontSize: 12.5 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {data.detectionPerformance.map(d => (
              <div key={d.status} className="flex items-center justify-between text-[12.5px]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: caseStatusColors[d.status] }} />
                  <span className="text-ink-700">{d.status.replace(/_/g, ' ')}</span>
                </div>
                <span className="font-semibold text-ink-900">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 pt-2">
        <LineChartIcon className="h-4 w-4 text-brand-500" />
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-700">Model / Risk Engine Performance</h2>
      </div>
      <ModelPerformanceSection />
    </div>
  )
}
