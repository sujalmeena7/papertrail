"use client"

import type { Subscription } from "@/lib/db/schema"
import type { Plan } from "@/lib/billing/plan"
import { cancelSubscription } from "@/app/actions/subscriptions"
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  XCircle,
  ShieldCheck,
  MoreHorizontal,
  Activity,
  Minus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button, buttonVariants } from "@/components/ui/button"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { SubscriptionHistoryDialog } from "./subscription-history-dialog"
import { CancellationPlaybookDialog } from "./cancellation-playbook-dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
  })
}

function formatDate(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

function getVendorColor(name: string): string {
  const colors = [
    "from-violet-500 to-indigo-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-rose-500 to-pink-600",
    "from-purple-500 to-violet-600",
    "from-sky-500 to-blue-600",
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function SubscriptionsTable({
  initialSubscriptions,
  plan,
}: {
  initialSubscriptions: Subscription[]
  plan: Plan
}) {
  const [isPending, startTransition] = useTransition()
  const [subs, setSubs] = useState<Subscription[]>(
    initialSubscriptions.filter((s) => s.status === "active")
  )
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [playbookSub, setPlaybookSub] = useState<Subscription | null>(null)
  const [isPlaybookOpen, setIsPlaybookOpen] = useState(false)

  const handleCancel = (id: string, vendor: string) => {
    startTransition(async () => {
      try {
        await cancelSubscription(id)
        setSubs((prev) => prev.filter((s) => s.id !== id))
        toast.success(`Marked ${vendor} as cancelled`)
      } catch (err) {
        toast.error("Failed to cancel subscription")
      }
    })
  }

  const totalMonthly = subs.reduce((sum, s) => sum + monthlyEquivalent(s), 0)
  const totalAnnual = totalMonthly * 12

  if (subs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-2xl border border-dashed border-border/60">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50">
          <Calendar className="size-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-base">No active subscriptions detected</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            We'll automatically detect recurring subscriptions from your scanned receipts.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Active Subscriptions",
            value: subs.length.toString(),
            sub: "Currently tracked",
          },
          {
            label: "Monthly Spend",
            value: formatAmount(totalMonthly, "USD"),
            sub: "Across all services",
          },
          {
            label: "Annual Spend",
            value: formatAmount(totalAnnual, "USD"),
            sub: "Projected yearly cost",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/50 bg-card/60 px-4 py-3 backdrop-blur-sm"
          >
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Subscription cards */}
      <div className="flex flex-col gap-2.5">
        {subs.map((sub) => {
          const isTrendingUp = sub.currentAmountCents > sub.averageAmountCents
          const isTrendingDown = sub.currentAmountCents < sub.averageAmountCents
          const monthly = monthlyEquivalent(sub)

          const daysUntilNext = sub.nextExpectedDate
            ? Math.ceil(
                (new Date(sub.nextExpectedDate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            : null

          const isRenewingSoon = daysUntilNext !== null && daysUntilNext <= 7 && daysUntilNext >= 0

          return (
            <div
              key={sub.id}
              className="group relative rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-200"
              style={{
                boxShadow: isRenewingSoon
                  ? "0 0 0 1px oklch(0.6 0.2 25 / 0.25), 0 2px 12px oklch(0.6 0.2 25 / 0.08)"
                  : undefined,
              }}
            >
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div
                  className={`relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getVendorColor(sub.vendorNormalized)} shadow-lg`}
                >
                  <span className="text-[13px] font-bold text-white">
                    {getVendorInitials(sub.vendorNormalized)}
                  </span>
                </div>

                {/* Name + badge */}
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold capitalize text-[15px] truncate">
                      {sub.vendorNormalized}
                    </span>
                    <Badge
                      variant="secondary"
                      className="capitalize text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-0"
                    >
                      {sub.cadence}
                    </Badge>
                    {isRenewingSoon && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-1.5 bg-amber-500/15 text-amber-500 border-0"
                      >
                        Renews in {daysUntilNext}d
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Last: {formatDate(sub.lastChargeDate)}</span>
                    <span className="opacity-40">·</span>
                    <span>
                      Next:{" "}
                      {sub.nextExpectedDate
                        ? formatDate(sub.nextExpectedDate)
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Trend indicator */}
                <div className="hidden sm:flex items-center justify-center w-16">
                  {isTrendingUp ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                      <TrendingUp className="size-3.5" />
                      Up
                    </span>
                  ) : isTrendingDown ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                      <TrendingDown className="size-3.5" />
                      Down
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Minus className="size-3.5" />
                      Stable
                    </span>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className="text-[17px] font-bold tracking-tight tabular-nums">
                    {formatAmount(sub.currentAmountCents, sub.currency)}
                  </p>
                  {sub.cadence !== "monthly" && (
                    <p className="text-[11px] text-muted-foreground">
                      ≈ {formatAmount(monthly, sub.currency)}/mo
                    </p>
                  )}
                </div>

                {/* Actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    )}
                    disabled={isPending}
                  >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Actions</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedSub(sub)
                        setIsHistoryOpen(true)
                      }}
                    >
                      <Activity className="mr-2 size-4" />
                      View history
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setPlaybookSub(sub)
                        setIsPlaybookOpen(true)
                      }}
                    >
                      <ShieldCheck className="mr-2 size-4" />
                      Cancellation guide
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleCancel(sub.id, sub.vendorNormalized)}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <XCircle className="mr-2 size-4" />
                      Mark as cancelled
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Subtle bottom progress bar: % of total spend */}
              <div className="h-[2px] bg-border/30 rounded-b-xl overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getVendorColor(sub.vendorNormalized)} opacity-60`}
                  style={{
                    width: `${Math.round((monthly / totalMonthly) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <SubscriptionHistoryDialog
        subscription={selectedSub}
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />
      <CancellationPlaybookDialog
        subscription={playbookSub}
        plan={plan}
        open={isPlaybookOpen}
        onOpenChange={setIsPlaybookOpen}
        onCancelled={(id) => setSubs((prev) => prev.filter((s) => s.id !== id))}
      />
    </div>
  )
}
