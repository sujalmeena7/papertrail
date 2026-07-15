"use client"

import type { SubscriptionAlert } from "@/lib/db/schema"
import { dismissAlert } from "@/app/actions/subscriptions"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  ArrowUpRight,
  CalendarX,
  Check,
  Copy,
  Layers,
  X,
  Ghost,
  ChevronRight,
} from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function formatAmount(cents: number, currency: string = "USD"): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
  })
}

const ALERT_CONFIG = {
  price_hike: {
    icon: ArrowUpRight,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    borderColor: "border-l-destructive/60",
    badgeColor: "bg-destructive/10 text-destructive",
    label: "Price Increase",
    badge: "Cost Up",
  },
  missed_renewal: {
    icon: CalendarX,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    borderColor: "border-l-amber-500/60",
    badgeColor: "bg-amber-500/10 text-amber-500",
    label: "Missed Renewal",
    badge: "Overdue",
  },
  duplicate: {
    icon: Copy,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    borderColor: "border-l-blue-500/60",
    badgeColor: "bg-blue-500/10 text-blue-500",
    label: "Duplicate",
    badge: "Duplicate",
  },
  redundant_tool: {
    icon: Layers,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    borderColor: "border-l-indigo-500/60",
    badgeColor: "bg-indigo-500/10 text-indigo-500",
    label: "Redundant Tool",
    badge: "Overlap",
  },
  zombie: {
    icon: Ghost,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
    borderColor: "border-l-purple-500/60",
    badgeColor: "bg-purple-500/10 text-purple-500",
    label: "Zombie",
    badge: "Unused",
  },
}

export function AlertsList({
  initialAlerts,
}: {
  initialAlerts: SubscriptionAlert[]
}) {
  const [isPending, startTransition] = useTransition()
  const [alerts, setAlerts] = useState<SubscriptionAlert[]>(initialAlerts)

  const handleDismiss = (id: string) => {
    startTransition(async () => {
      try {
        await dismissAlert(id)
        setAlerts((prev) => prev.filter((a) => a.id !== id))
        toast.success("Alert dismissed")
      } catch (err) {
        toast.error("Failed to dismiss alert")
      }
    })
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-2xl border border-dashed border-border/60">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Check className="size-7 text-emerald-500" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-base">All clear — no alerts</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            No issues detected. Your subscriptions look healthy.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Count header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {alerts.length} Active Alert{alerts.length !== 1 ? "s" : ""}
        </p>
      </div>

      <AnimatePresence initial={false}>
        {alerts.map((alert) => {
          const details = alert.details as any
          const config = ALERT_CONFIG[alert.type as keyof typeof ALERT_CONFIG] ?? {
            icon: AlertCircle,
            iconColor: "text-muted-foreground",
            iconBg: "bg-muted",
            borderColor: "border-l-border",
            badgeColor: "bg-muted text-muted-foreground",
            label: "Alert",
            badge: "Alert",
          }
          const Icon = config.icon

          let description = "Action needed on a subscription."

          if (alert.type === "price_hike") {
            const prev = formatAmount(details.previousAmountCents)
            const curr = formatAmount(details.newAmountCents)
            description = `Amount increased ${details.increasePercentage}% — from ${prev} to ${curr}.`
          } else if (alert.type === "missed_renewal") {
            description = `Expected ${details.daysOverdue} days ago on ${details.expectedDate}. Did you cancel?`
          } else if (alert.type === "duplicate") {
            const vendor = details.vendorNormalized || "a vendor"
            description = `${details.chargesInMonth} charges from "${vendor}" in ${details.month}.`
          } else if (alert.type === "redundant_tool") {
            const vendorsList = Array.isArray(details.vendors)
              ? details.vendors.join(", ")
              : "multiple tools"
            description = `Multiple "${details.category}" tools: ${vendorsList}. Consider consolidating.`
          } else if (alert.type === "zombie") {
            description = `Appears unused. ${details.reason} (~$${(details.monthlyCostCents / 100).toFixed(2)}/mo wasted)`
          }

          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="group flex items-start gap-4 overflow-hidden rounded-xl border border-border/50 border-l-2 bg-card/60 backdrop-blur-sm px-5 py-4"
              style={{
                borderLeftColor: config.borderColor
                  .replace("border-l-", "")
                  .replace("/", " / "),
              }}
            >
              {/* Icon */}
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${config.iconBg} mt-0.5`}
              >
                <Icon className={`size-4 ${config.iconColor}`} />
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{config.label}</span>
                  <span
                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${config.badgeColor}`}
                  >
                    {config.badge}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Dismiss */}
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                disabled={isPending}
                onClick={() => handleDismiss(alert.id)}
              >
                <X className="size-3.5" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
