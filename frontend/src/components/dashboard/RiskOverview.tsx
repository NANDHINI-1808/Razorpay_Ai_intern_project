import { Card } from '@/components/ui/Card'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RiskLevel } from '@/types'

const colors: Record<RiskLevel, string> = {
  LOW: '#0F7A4B',
  MEDIUM: '#B45B08',
  HIGH: '#C2410C',
  CRITICAL: '#C0263A',
}

export function RiskOverview({ data }: { data: { level: RiskLevel; count: number }[] }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[14.5px] font-semibold text-ink-900">Risk Overview</h3>
          <p className="text-[12px] text-ink-500">Transaction distribution by risk level, last 24h</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid vertical={false} stroke="#EDEFF5" />
          <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7183' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: '#F6F7FB' }}
            contentStyle={{ borderRadius: 10, border: '1px solid #EDEFF5', fontSize: 12.5 }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map(d => (
              <Cell key={d.level} fill={colors[d.level]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
