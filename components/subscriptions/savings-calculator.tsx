"use client"

import type { Subscription, SubscriptionAlert } from "@/lib/db/schema"
import { cancelSubscription } from "@/app/actions/subscriptions"
import { Scissors, Sparkles, TrendingUp, CalendarX, Copy, XCircle, Layers, Ghost } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function formatAmount(cents: number, currency: string = "USD"): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  })
}

function monthlyEquivalent(sub: Subscription): number {
  if (sub.cadence === "annual") return sub.currentAmountCents / 12
  if (sub.cadence === "quarterly") return sub.currentAmountCents / 3
  return sub.currentAmountCents
}

function getVendorInitials(name: string): string {
  return name.substring(0, 2).toUpperCase()
}

interface SavingsCandidate {
  subscription: Subscription
  reason: string
  reasonType: "price_hike" | "missed_renewal" | "duplicate" | "low_usage" | "redundant_tool" | "zombie"
  potentialSavings: number
}

const REASON_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  price_hike: {
    icon: <TrendingUp className="size-4" />,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  missed_renewal: {
    icon: <CalendarX className="size-4" />,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  duplicate: {
    icon: <Copy className="size-4" />,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  redundant_tool: {
    icon: <Layers className="size-4" />,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  low_usage: {
    icon: <Sparkles className="size-4" />,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  zombie: {
    icon: <Ghost className="size-4" />,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
}

function identifyCandidates(
  subscriptions: Subscription[],
  alerts: SubscriptionAlert[]
): SavingsCandidate[] {
  const candidates: SavingsCandidate[] = []
  const activeSubs = subscriptions.filter((s) => s.status === "active")

  const priceHikeAlerts = alerts.filter((a) => a.type === "price_hike")
  for (const alert of priceHikeAlerts) {
    const sub = activeSubs.find((s) => s.id === alert.subscriptionId)
    if (!sub) continue
    const details = alert.details as any
    candidates.push({
      subscription: sub,
      reason: `Price increased ${details.increasePercentage}% recently`,
      reasonType: "price_hike",
      potentialSavings: monthlyEquivalent(sub),
    })
  }

  const missedAlerts = alerts.filter((a) => a.type === "missed_renewal")
  for (const alert of missedAlerts) {
    const sub = activeSubs.find((s) => s.id === alert.subscriptionId)
    if (!sub) continue
    if (candidates.some((c) => c.subscription.id === sub.id)) continue
    candidates.push({
      subscription: sub,
      reason: `No charge detected in ${(alert.details as any).daysOverdue} days`,
      reasonType: "missed_renewal",
      potentialSavings: monthlyEquivalent(sub),
    })
  }

  const redundantAlerts = alerts.filter((a) => a.type === "redundant_tool")
  for (const alert of redundantAlerts) {
    const details = alert.details as any
    const vendors = (details.vendors as string[]) || []
    for (const vendor of vendors) {
      const subs = activeSubs.filter((s) => s.vendorNormalized === vendor)
      for (const sub of subs) {
        if (candidates.some((c) => c.subscription.id === sub.id)) continue
        candidates.push({
          subscription: sub,
          reason: `Redundant tool in "${details.category}" category`,
          reasonType: "redundant_tool",
          potentialSavings: monthlyEquivalent(sub),
        })
      }
    }
  }

  const zombieAlerts = alerts.filter((a) => a.type === "zombie")
  for (const alert of zombieAlerts) {
    const sub = activeSubs.find((s) => s.id === alert.subscriptionId)
    if (!sub) continue
    if (candidates.some((c) => c.subscription.id === sub.id)) continue
    candidates.push({
      subscription: sub,
      reason: "Unused subscription detected",
      reasonType: "zombie",
      potentialSavings: monthlyEquivalent(sub),
    })
  }

  for (const sub of activeSubs) {
    if (sub.confidence < 0.7 && !candidates.some((c) => c.subscription.id === sub.id)) {
      candidates.push({
        subscription: sub,
        reason: `Low detection confidence (${Math.round(sub.confidence * 100)}%)`,
        reasonType: "low_usage",
        potentialSavings: monthlyEquivalent(sub),
      })
    }
  }

  return candidates.sort((a, b) => b.potentialSavings - a.potentialSavings)
}

export function SavingsCalculator({
  subscriptions,
  alerts,
}: {
  subscriptions: Subscription[]
  alerts: SubscriptionAlert[]
}) {
  const candidates = identifyCandidates(subscriptions, alerts)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const visibleCandidates = candidates.filter((c) => !dismissed.has(c.subscription.id))
  const totalPotentialSavings = visibleCandidates.reduce((sum, c) => sum + c.potentialSavings, 0)

  const handleCancel = (id: string, vendor: string) => {
    startTransition(async () => {
      try {
        await cancelSubscription(id)
        setDismissed((prev) => new Set(prev).add(id))
        toast.success(`Marked ${vendor} as cancelled`)
      } catch {
        toast.error("Failed to cancel subscription")
      }
    })
  }

  const handleDismissCandidate = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }

  if (visibleCandidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-2xl border border-dashed border-border/60">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Sparkles className="size-7 text-emerald-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-base">Finances look optimized!</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            No obvious savings opportunities found. Your subscriptions look healthy.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Savings hero banner */}
      <div
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-5"
        style={{
          background:
            "radial-gradient(ellipse at top left, oklch(0.72 0.17 160 / 0.08), transparent 60%), oklch(0.17 0.01 260 / 0.5)",
        }}
      >
        <div className="flex items-center gap-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15">
            <Scissors className="size-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">
              Save up to{" "}
              <span className="text-emerald-500">
                {formatAmount(totalPotentialSavings, "USD")}
              </span>
              <span className="text-base font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              by reviewing {visibleCandidates.length} subscription
              {visibleCandidates.length === 1 ? "" : "s"} below
            </p>
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {visibleCandidates.length} Recommendation{visibleCandidates.length !== 1 ? "s" : ""}
      </p>

      {/* Candidates */}
      {visibleCandidates.map((candidate) => {
        const sub = candidate.subscription
        const config = REASON_CONFIG[candidate.reasonType] ?? REASON_CONFIG.low_usage

        return (
          <div
            key={sub.id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm px-5 py-4 transition-all"
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Avatar */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-xs font-bold text-muted-foreground">
                {getVendorInitials(sub.vendorNormalized)}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold capitalize text-sm">{sub.vendorNormalized}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}>
                  <span className={`flex size-5 items-center justify-center rounded-md ${config.bg} ${config.color}`}>
                    {config.icon}
                  </span>
                  {candidate.reason}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <p className="text-lg font-bold tabular-nums">
                {formatAmount(candidate.potentialSavings, sub.currency)}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={isPending}
                  onClick={() => handleCancel(sub.id, sub.vendorNormalized)}
                >
                  <XCircle className="mr-1 size-3" />
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleDismissCandidate(sub.id)}
                >
                  Keep
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
