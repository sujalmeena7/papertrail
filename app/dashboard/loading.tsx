import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-8 w-32" />
          </Card>
        ))}
      </div>

      {/* Scan + Gmail cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <Skeleton className="mb-3 h-5 w-32" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-9 w-28" />
        </Card>
        <Card className="p-5">
          <Skeleton className="mb-3 h-5 w-24" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-9 w-28" />
        </Card>
      </div>

      {/* Table skeleton */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
