"use client"

import type { Subscription } from "@/lib/db/schema"
import { BarChart3, TrendingDown, TrendingUp, DollarSign, Zap } from "lucide-react"

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

function monthlyEquivalent(sub: Subscription): number {
  if (sub.cadence === "annual") return sub.currentAmountCents / 12
  if (sub.cadence === "quarterly") return sub.currentAmountCents / 3
  return sub.currentAmountCents
}

function generateMonthlyData(subscriptions: Subscription[]) {
  const activeSubs = subscriptions.filter((s) => s.status === "active")
  const months: { label: string; totalCents: number; count: number }[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = d.getTime()
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime()

    let totalCents = 0
    let count = 0

    for (const sub of activeSubs) {
      const firstCharge = new Date(sub.firstChargeDate).getTime()
      const lastCharge = new Date(sub.lastChargeDate).getTime()
      if (firstCharge <= monthEnd && lastCharge >= monthStart) {
        totalCents += monthlyEquivalent(sub)
        count++
      }
    }

    months.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      totalCents: Math.round(totalCents),
      count,
    })
  }

  return months
}

export function SpendTrendChart({
  subscriptions,
}: {
  subscriptions: Subscription[]
}) {
  const data = generateMonthlyData(subscriptions)
  const maxCents = Math.max(...data.map((d) => d.totalCents), 1)

  const currentMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]
  let changePercent = 0
  if (previousMonth && previousMonth.totalCents > 0) {
    changePercent = Math.round(
      ((currentMonth.totalCents - previousMonth.totalCents) /
        previousMonth.totalCents) *
        100
    )
  }

  // Total active monthly spend
  const activeSubs = subscriptions.filter((s) => s.status === "active")
  const totalMonthly = activeSubs.reduce((sum, s) => sum + monthlyEquivalent(s), 0)

  if (data.every((d) => d.totalCents === 0)) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Spend Trend</p>
            <p className="text-[11px] text-muted-foreground">Last 6 months of subscription spend</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">This Month</p>
            <p className="text-lg font-bold tabular-nums">{formatAmount(currentMonth.totalCents)}</p>
          </div>
          {changePercent !== 0 && (
            <div
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                changePercent > 0
                  ? "bg-destructive/10 text-destructive"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              {changePercent > 0 ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {changePercent > 0 ? "+" : ""}
              {changePercent}%
            </div>
          )}
        </div>
      </div>

      {/* Chart area */}
      <div className="px-6 pt-4 pb-5">
        <div className="flex items-end gap-2" style={{ height: 140 }}>
          {data.map((month, i) => {
            const barAreaHeight = 110
            const barHeight = Math.max(
              Math.round((month.totalCents / maxCents) * barAreaHeight),
              4
            )
            const isCurrentMonth = i === data.length - 1

            return (
              <div
                key={month.label}
                className="group relative flex flex-1 flex-col items-center justify-end"
                style={{ height: 140 }}
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-14 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-border/60 bg-popover/90 backdrop-blur px-3 py-2 text-center text-xs text-popover-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  <p className="font-bold">{formatAmount(month.totalCents)}</p>
                  <p className="text-muted-foreground">{month.count} sub{month.count !== 1 ? "s" : ""}</p>
                </div>

                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isCurrentMonth
                      ? "bg-gradient-to-t from-primary/80 to-primary shadow-[0_-4px_20px_oklch(var(--primary)/0.35)]"
                      : "bg-gradient-to-t from-primary/15 to-primary/40 group-hover:from-primary/25 group-hover:to-primary/55"
                  }`}
                  style={{ height: barHeight }}
                />

                {/* Label */}
                <span
                  className={`mt-2.5 text-[10px] font-medium ${
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {month.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
