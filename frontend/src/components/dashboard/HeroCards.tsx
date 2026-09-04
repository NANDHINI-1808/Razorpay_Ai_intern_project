import { ShieldCheck, ArrowUpRight, Radar } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HeroCards() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
      <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 p-8 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.15]" aria-hidden>
          <NetworkMotif />
        </div>
        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-electric-500" />
            AI-POWERED SECURITY
          </span>
          <h2 className="mt-4 font-[var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-tight">
            Protect every payment with intelligent risk detection
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-white/70">
            Detect suspicious payment behaviour, investigate risk signals, and make safer
            transaction decisions with AI — before funds ever move.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              to="/transactions"
              className="rounded-[10px] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-brand-800 transition-colors hover:bg-white/90"
            >
              View Live Transactions
            </Link>
            <Link
              to="/risk-monitoring"
              className="rounded-[10px] border border-white/25 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Open Risk Monitoring
            </Link>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-accent-600 to-accent-500 p-8 text-white">
        <Radar className="absolute -right-4 -top-4 h-32 w-32 text-white/10" strokeWidth={1} />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide">
          <ShieldCheck className="h-3 w-3" />
          AI POWERED
        </span>
        <h3 className="mt-4 font-[var(--font-display)] text-[22px] font-semibold leading-tight tracking-tight">
          Investigate suspicious transactions
        </h3>
        <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">
          Understand risk signals, evidence and AI recommendations from every investigation.
        </p>
        <Link
          to="/investigations"
          className="mt-6 inline-flex items-center gap-1.5 rounded-[10px] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-accent-600 transition-colors hover:bg-white/90"
        >
          Open Investigation Center
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

function NetworkMotif() {
  const nodes = [
    [40, 40], [140, 20], [230, 70], [80, 120], [190, 150], [30, 190], [260, 190],
  ]
  return (
    <svg viewBox="0 0 300 220" className="h-full w-full">
      {nodes.map((a, i) =>
        nodes.slice(i + 1).map((b, j) => (
          <line key={`${i}-${j}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="white" strokeWidth="0.5" />
        )),
      )}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4 : 2.5} fill="white" />
      ))}
    </svg>
  )
}
