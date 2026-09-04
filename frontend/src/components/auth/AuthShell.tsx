import { ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-canvas">
      {/* Left: brand hero */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden>
          <NetworkMotif />
        </div>
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/10">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="font-[var(--font-display)] leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">PayShield</div>
            <div className="text-[11px] font-medium tracking-[0.14em] text-white/60">AI PLATFORM</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-[var(--font-display)] text-[32px] font-semibold leading-[1.15] tracking-tight">
            Secure Every Payment with AI
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-white/70">
            AI-powered fraud detection, risk intelligence and human-led transaction protection —
            built for Razorpay Buildathon Track 02.
          </p>
        </div>

        <div className="relative text-[11.5px] text-white/40">
          © {new Date().getFullYear()} PayShield AI. Demo build.
        </div>
      </div>

      {/* Right: form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-500 to-accent-500">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="font-[var(--font-display)] text-[15px] font-semibold tracking-tight text-ink-900">PayShield AI</div>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

function NetworkMotif() {
  const nodes = [[60, 60], [220, 40], [340, 110], [120, 200], [300, 260], [50, 320], [380, 340]]
  return (
    <svg viewBox="0 0 420 400" className="h-full w-full">
      {nodes.map((a, i) =>
        nodes.slice(i + 1).map((b, j) => (
          <line key={`${i}-${j}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="white" strokeWidth="0.5" />
        )),
      )}
      {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4 : 2.5} fill="white" />)}
    </svg>
  )
}
