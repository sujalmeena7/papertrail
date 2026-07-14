"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, CreditCard } from "lucide-react"
import type { getBilling } from "@/app/actions/billing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PLANS, PRO_PRICE } from "@/lib/billing/pricing"
import { UpgradeDialog } from "@/components/upgrade-dialog"

type Billing = Awaited<ReturnType<typeof getBilling>>

export function BillingManager({ initial }: { initial: Billing }) {
  const router = useRouter()
  const [billing, setBilling] = useState(initial)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isPro = billing.plan === "pro"
  const isCancelling = billing.status === "cancelled" && isPro
  const isPastDue = billing.status === "past_due"

  const handleCancel = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/cancel", { method: "POST" })
        if (!res.ok) throw new Error()
        toast.success("Subscription set to cancel at period end")
        router.refresh()
        setBilling((prev) => ({ ...prev, status: "cancelled" }))
      } catch {
        toast.error("Failed to cancel subscription")
      }
    })
  }

  const periodEndLabel = billing.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <div className="flex flex-col gap-6">
      {/* Current plan / status */}
      <Card className="premium-card premium-glow">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-base">Current plan</CardTitle>
            </div>
            <Badge variant={isPro ? "default" : "outline"}>
              {isPro ? "Pro" : "Free"}
            </Badge>
          </div>
          <CardDescription className="leading-relaxed">
            {isPastDue
              ? "Your last payment failed. Update your payment method to keep Pro access."
              : isPro
                ? isCancelling && periodEndLabel
                  ? `Pro access ends ${periodEndLabel}.`
                  : periodEndLabel
                    ? `You're on PaperTrail Pro. Renews ${periodEndLabel}.`
                    : "You're on PaperTrail Pro — every feature is unlocked."
                : "You're on the Free plan. Upgrade to unlock every leak, cancellation help, and alerts."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPro ? (
            !isCancelling && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel subscription
              </Button>
            )
          ) : (
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => setUpgradeOpen(true)}>
                Upgrade to Pro — {PRO_PRICE.usdPerMonth}
              </Button>
              <span className="text-xs text-muted-foreground">{PRO_PRICE.inrNote}</span>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Billed securely via Razorpay. Receipts are emailed to you after every charge.
          </p>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrentPlan = plan.tier === billing.plan
          return (
            <Card
              key={plan.tier}
              className={cn(
                "premium-card flex flex-col",
                plan.featured && "premium-glow border-primary/50"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  {plan.featured && !isCurrentPlan && (
                    <Badge variant="default">Most popular</Badge>
                  )}
                  {isCurrentPlan && <Badge variant="outline">Current plan</Badge>}
                </div>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-semibold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                {plan.note && (
                  <p className="text-xs text-muted-foreground">{plan.note}</p>
                )}
                <CardDescription className="pt-1 leading-relaxed">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="flex flex-1 flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.tier === "pro" ? (
                  <Button
                    className="w-full"
                    disabled={isCurrentPlan}
                    onClick={() => setUpgradeOpen(true)}
                  >
                    {isCurrentPlan ? "Current plan" : plan.cta}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    {isCurrentPlan ? "Current plan" : plan.cta}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  )
}
