"use client"

import type { getAnalytics } from "@/app/actions/receipts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Analytics = Awaited<ReturnType<typeof getAnalytics>>

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}

const CATEGORY_LABELS: Record<string, string> = {
  software: "Software",
  hosting: "Hosting",
  advertising: "Advertising",
  travel: "Travel",
  office: "Office",
  services: "Services",
  other: "Other",
}

export function AnalyticsCards({ analytics }: { analytics: Analytics }) {
  const maxVendorCents = Math.max(
    ...analytics.byVendor.map((v) => v.totalCents),
    1,
  )

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="premium-card premium-glow">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total captured
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-3xl font-semibold tracking-tight">
            {formatUsd(analytics.totalCents)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            across {analytics.count} receipt{analytics.count === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>

      <Card className="premium-card premium-glow">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top vendors
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {analytics.byVendor.slice(0, 4).map((v) => (
            <div key={v.vendor} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{v.vendor}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {formatUsd(v.totalCents)}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.max((v.totalCents / maxVendorCents) * 100, 4)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="premium-card premium-glow">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            By category
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {analytics.byCategory.map((c) => (
            <div
              key={c.category}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>{CATEGORY_LABELS[c.category] ?? c.category}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {c.count} · {formatUsd(c.totalCents)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
