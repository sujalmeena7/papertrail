"use client"

import type { getAnalytics } from "@/app/actions/receipts"
import { AnalyticsCards } from "@/components/analytics-cards"
import { ReceiptsTable } from "@/components/receipts-table"
import { ScanCard } from "@/components/scan-card"
import type { Receipt, Scan, Subscription, SubscriptionAlert } from "@/lib/db/schema"
import { SubscriptionRadarCard } from "@/components/subscriptions/subscription-radar-card"
import { toast } from "sonner"
import { useEffect } from "react"

type Analytics = Awaited<ReturnType<typeof getAnalytics>>

export function Dashboard({
  initialReceipts,
  initialTotal,
  analytics,
  scans,
  isGmailConnected,
  subscriptions,
  subscriptionAlerts,
  newAlertCount,
}: {
  initialReceipts: Receipt[]
  initialTotal: number
  analytics: Analytics
  scans: Scan[]
  isGmailConnected: boolean
  subscriptions: Subscription[]
  subscriptionAlerts: SubscriptionAlert[]
  newAlertCount?: number
}) {
  useEffect(() => {
    if (newAlertCount && newAlertCount > 0) {
      toast.warning(
        `${newAlertCount} new subscription alert${newAlertCount === 1 ? "" : "s"} detected`,
        {
          description: "Check your Subscription Radar for details.",
          action: {
            label: "View",
            onClick: () => window.location.assign("/dashboard/subscriptions"),
          },
        }
      )
    }
  }, [newAlertCount])
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Receipts
        </h1>
        <p className="text-sm text-muted-foreground">
          Every business receipt, found and filed automatically.
        </p>
      </div>

      <ScanCard scans={scans} hasReceipts={initialTotal > 0} isGmailConnected={isGmailConnected} />

      {subscriptions.length > 0 && (
        <SubscriptionRadarCard subscriptions={subscriptions} alerts={subscriptionAlerts} />
      )}

      {analytics.count > 0 && <AnalyticsCards analytics={analytics} />}

      <ReceiptsTable initialReceipts={initialReceipts} />
    </div>
  )
}
