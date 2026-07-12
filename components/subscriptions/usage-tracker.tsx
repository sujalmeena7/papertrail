"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { reportSubscriptionUsage } from "@/app/actions/usage"
import { useTransition, useState } from "react"
import { Loader2, Activity, Zap, Clock, CalendarCheck, Ghost, HelpCircle } from "lucide-react"

const STATUS_CONFIG = {
  active_daily: {
    label: "Daily",
    dot: "bg-emerald-500",
    glow: "shadow-[0_0_6px_oklch(0.72_0.17_160)]",
    icon: <Zap className="size-3" />,
  },
  active_weekly: {
    label: "Weekly",
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_6px_oklch(0.82_0.13_160)]",
    icon: <CalendarCheck className="size-3" />,
  },
  active_monthly: {
    label: "Monthly",
    dot: "bg-blue-400",
    glow: "shadow-[0_0_6px_oklch(0.67_0.17_240)]",
    icon: <CalendarCheck className="size-3" />,
  },
  rarely: {
    label: "Rarely",
    dot: "bg-amber-500",
    glow: "shadow-[0_0_6px_oklch(0.77_0.18_85)]",
    icon: <Clock className="size-3" />,
  },
  never: {
    label: "Never",
    dot: "bg-destructive",
    glow: "shadow-[0_0_6px_oklch(0.6_0.2_25)]",
    icon: <Ghost className="size-3" />,
  },
  unknown: {
    label: "Unknown",
    dot: "bg-muted-foreground/40",
    glow: "",
    icon: <HelpCircle className="size-3" />,
  },
}

export function UsageTracker({
  subscriptions,
  usages,
}: {
  subscriptions: any[]
  usages: any[]
}) {
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)

  const usageMap = new Map(usages.map((u) => [u.subscriptionId, u]))

  const handleStatusChange = (subId: string, value: string) => {
    setActiveId(subId)
    startTransition(async () => {
      try {
        await reportSubscriptionUsage(subId, value as any)
      } finally {
        setActiveId(null)
      }
    })
  }

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-2xl border border-dashed border-border/60">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Activity className="size-7 text-primary" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-base">No active subscriptions</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Active subscriptions will appear here for usage tracking.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-4 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
          <Activity className="size-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Usage Tracking</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Report how often you use each service. Unused subscriptions for 90+ days will trigger a zombie alert.
          </p>
        </div>
      </div>

      {/* Usage cards */}
      <div className="flex flex-col gap-2.5">
        {subscriptions.map((sub) => {
          const usage = usageMap.get(sub.id)
          const status = (usage?.usageStatus as keyof typeof STATUS_CONFIG) || "unknown"
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown

          const amount = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: sub.currency,
          }).format(sub.averageAmountCents / 100)

          const isLoading = isPending && activeId === sub.id

          return (
            <div
              key={sub.id}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm px-5 py-3.5 transition-all"
            >
              {/* Status dot */}
              <div
                className={`size-2.5 shrink-0 rounded-full ${config.dot} ${config.glow}`}
              />

              {/* Vendor */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold capitalize text-sm truncate">
                  {sub.vendorNormalized}
                </p>
                <p className="text-xs text-muted-foreground">
                  {amount}/{sub.cadence === "monthly" ? "mo" : "yr"}
                </p>
              </div>

              {/* Last used */}
              <div className="hidden sm:block text-right text-xs text-muted-foreground shrink-0">
                {usage?.lastUsedAt ? (
                  <>
                    <p className="font-medium">Last used</p>
                    <p>{new Date(usage.lastUsedAt).toLocaleDateString("en-US")}</p>
                  </>
                ) : (
                  <p>Never recorded</p>
                )}
              </div>

              {/* Status select */}
              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={status}
                  onValueChange={(val) => handleStatusChange(sub.id, val)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8 w-36 text-xs border-border/50 bg-background/50">
                    <SelectValue placeholder="Set usage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${cfg.dot}`}
                          />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoading && (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
