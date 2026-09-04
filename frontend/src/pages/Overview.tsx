import { useQuery } from '@tanstack/react-query'
import { fetchKpis, fetchRiskDistribution, fetchTransactions } from '@/services/api'
import { HeroCards } from '@/components/dashboard/HeroCards'
import { KPIGrid } from '@/components/dashboard/KPIGrid'
import { RiskOverview } from '@/components/dashboard/RiskOverview'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { FadeIn } from '@/components/ui/FadeIn'

export default function Overview() {
  const kpis = useQuery({ queryKey: ['kpis'], queryFn: fetchKpis })
  const risk = useQuery({ queryKey: ['risk-distribution'], queryFn: fetchRiskDistribution })
  const txns = useQuery({ queryKey: ['transactions'], queryFn: fetchTransactions })

  return (
    <div className="space-y-6">
      <FadeIn><HeroCards /></FadeIn>

      {kpis.data && <KPIGrid kpis={kpis.data} />}

      <FadeIn delayMs={120} className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
        {risk.data && <RiskOverview data={risk.data} />}
        {txns.data && <RecentTransactions transactions={txns.data} />}
      </FadeIn>
    </div>
  )
}
