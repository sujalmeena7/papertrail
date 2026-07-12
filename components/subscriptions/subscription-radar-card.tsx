import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import type { Subscription, SubscriptionAlert } from "@/lib/db/schema"
import { Radar, ArrowRight, TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0, // usually we don't care about cents for high level stats
  })
}

export function SubscriptionRadarCard({
  subscriptions,
  alerts,
}: {
  subscriptions: Subscription[]
  alerts: SubscriptionAlert[]
}) {
  if (subscriptions.length === 0) {
    return null // Only show if they have subscriptions
  }

  const activeSubs = subscriptions.filter(s => s.status === 'active')
  
  // Calculate total monthly spend roughly
  const totalMonthlySpendCents = activeSubs.reduce((acc, sub) => {
    let monthlyEquivalent = sub.currentAmountCents
    if (sub.cadence === 'annual') monthlyEquivalent = sub.currentAmountCents / 12
    if (sub.cadence === 'quarterly') monthlyEquivalent = sub.currentAmountCents / 3
    return acc + monthlyEquivalent
  }, 0)

  const topSubs = [...activeSubs]
    .sort((a, b) => b.currentAmountCents - a.currentAmountCents)
    .slice(0, 3)

  return (
    <Card className="premium-card premium-glow overflow-hidden border-indigo-500/20 shadow-sm shadow-indigo-500/10">
      <CardHeader className="flex flex-row items-center justify-between bg-indigo-500/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10">
            <Radar className="size-5 text-indigo-500" />
          </div>
          <CardTitle className="text-lg">Subscription Radar</CardTitle>
        </div>
        {alerts.length > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1 font-normal">
            <AlertTriangle className="size-3" />
            {alerts.length} action{alerts.length === 1 ? '' : 's'} needed
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-1 flex-col justify-center border-b p-6 sm:border-b-0 sm:border-r">
            <p className="text-sm font-medium text-muted-foreground">Detected Spend</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight">
                {formatAmount(totalMonthlySpendCents, "USD")}
              </span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              across <span className="font-medium text-foreground">{activeSubs.length}</span> active subscriptions
            </p>
            <Link href="/dashboard/subscriptions" className={buttonVariants({ variant: "outline", className: "mt-6 w-full sm:w-auto" })}>
              View all subscriptions
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
          
          <div className="flex-1 bg-muted/20 p-6">
            <h4 className="text-sm font-medium mb-4 text-muted-foreground">Top Subscriptions</h4>
            <div className="flex flex-col gap-4">
              {topSubs.map(sub => (
                <div key={sub.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-background border text-xs font-medium uppercase text-muted-foreground">
                      {sub.vendorNormalized.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{sub.vendorNormalized}</p>
                      <p className="text-xs text-muted-foreground capitalize">{sub.cadence}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatAmount(sub.currentAmountCents, sub.currency)}</p>
                    {sub.currentAmountCents > sub.averageAmountCents && (
                      <span className="flex items-center justify-end gap-1 text-[10px] text-destructive">
                        <TrendingUp className="size-3" />
                        Trending up
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
