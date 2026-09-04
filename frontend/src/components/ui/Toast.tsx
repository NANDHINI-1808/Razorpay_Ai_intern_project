import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2 } from 'lucide-react'

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200)
    return () => clearTimeout(t)
  }, [onDismiss])

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 rounded-[12px] border border-ink-100 bg-surface px-4 py-3 shadow-[var(--shadow-card-hover)]">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-success-600" />
      <span className="text-[12.5px] font-medium text-ink-900">{message}</span>
    </div>,
    document.body,
  )
}
