import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({
  page, pageCount, total, pageSize, onPageChange,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  if (total === 0) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between border-t border-ink-100 px-1 pt-3">
      <span className="text-[12px] text-ink-500">
        Showing <span className="font-medium text-ink-700">{start}–{end}</span> of{' '}
        <span className="font-medium text-ink-700">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-ink-100 text-ink-600 transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-[12.5px] font-medium text-ink-700">
          {page} / {pageCount}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-ink-100 text-ink-600 transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
