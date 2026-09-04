import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Animates a numeric display value from 0 up to `value` over `durationMs`.
 * Only ever animates a real number that was passed in — never fabricates
 * or interpolates toward a placeholder. Skips the animation entirely (shows
 * the final value immediately) when the user prefers reduced motion.
 */
export function useCountUp(value: number, durationMs = 700): number {
  const [display, setDisplay] = useState(prefersReducedMotion() ? value : 0)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion() || !Number.isFinite(value)) {
      setDisplay(value)
      return
    }
    fromRef.current = display
    startRef.current = null

    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(1, elapsed / durationMs)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(fromRef.current + (value - fromRef.current) * eased)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs])

  return display
}
