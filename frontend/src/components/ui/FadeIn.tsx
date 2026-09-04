import type { ReactNode } from 'react'

/**
 * Lightweight fade+slide entrance for a section. Pure CSS keyframes (no
 * animation library) — respects prefers-reduced-motion via the
 * motion-reduce: variant, which Tailwind maps to that media query.
 */
export function FadeIn({
  children, delayMs = 0, className,
}: { children: ReactNode; delayMs?: number; className?: string }) {
  return (
    <div
      className={`animate-[fadeInUp_0.45s_ease-out_both] motion-reduce:animate-none ${className ?? ''}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}
