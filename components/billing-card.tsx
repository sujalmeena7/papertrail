"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getBilling } from "@/app/actions/billing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CreditCard } from "lucide-react"
import { PRO_PRICE } from "@/lib/billing/pricing"
import { UpgradeDialog } from "@/components/upgrade-dialog"

type Billing = Awaited<ReturnType<typeof getBilling>>

export function BillingCard() {
  const router = useRouter()
  const [billing, setBilling] = useState<Billing | null>(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getBilling().then(setBilling)
  }, [])

  const handleCancel = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/cancel", { method: "POST" })
        if (!res.ok) throw new Error()
        toast.success("Subscription set to cancel at period end")
        router.refresh()
        getBilling().then(setBilling)
      } catch {
        toast.error("Failed to cancel subscription")
      }
    })
  }

  const isPro = billing?.plan === "pro"
  const isCancelling = billing?.status === "cancelled" && isPro

  return (
    <Card className="premium-card premium-glow">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">Billing</CardTitle>
          </div>
          <Badge variant={isPro ? "default" : "outline"}>
            {isPro ? "Pro" : "Free"}
          </Badge>
        </div>
        <CardDescription className="leading-relaxed">
          {isPro
            ? isCancelling && billing?.currentPeriodEnd
              ? `Pro access ends ${new Date(billing.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
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
      </CardContent>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </Card>
  )
}
