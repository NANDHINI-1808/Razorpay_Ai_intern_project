import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Inbox } from 'lucide-react'

export function EmptyState({
  icon: Icon = Inbox, title, description,
}: { icon?: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100">
        <Icon className="h-5 w-5 text-ink-500" />
      </div>
      <p className="text-[13.5px] font-medium text-ink-700">{title}</p>
      {description && <p className="max-w-xs text-[12.5px] text-ink-500">{description}</p>}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong while loading this data.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-critical-100">
        <AlertTriangle className="h-5 w-5 text-critical-600" />
      </div>
      <p className="text-[13.5px] font-medium text-ink-700">Couldn't load data</p>
      <p className="max-w-xs text-[12.5px] text-ink-500">{message}</p>
    </div>
  )
}

export function TableSkeleton({ rows = 6, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 rounded-[10px] px-2 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 flex-1 rounded bg-ink-100" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[16px] bg-ink-100 ${className ?? 'h-24'}`} />
}
