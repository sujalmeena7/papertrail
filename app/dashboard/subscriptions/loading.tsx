import { Skeleton } from "@/components/ui/skeleton"

export default function SubscriptionsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Chart skeleton */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="mb-4 h-4 w-48" />
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <Skeleton className="w-full rounded-t-md" style={{ height: `${20 + i * 12}%` }} />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar + Table layout skeleton */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar tabs skeleton */}
        <div className="w-full md:w-56 shrink-0 space-y-1">
          {["Active", "Alerts", "Savings", "All Receipts"].map((label) => (
            <Skeleton key={label} className="h-10 w-full rounded-md" />
          ))}
        </div>

        {/* Table skeleton */}
        <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex items-center gap-4 border-b px-6 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b px-6 py-4 last:border-0">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
