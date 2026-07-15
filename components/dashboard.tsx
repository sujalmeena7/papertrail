"use client"

import type { getAnalytics } from "@/app/actions/receipts"
import { AnalyticsCards } from "@/components/analytics-cards"
import { ReceiptsTable } from "@/components/receipts-table"
import { ScanCard } from "@/components/scan-card"
import type { Receipt, Scan, Subscription, SubscriptionAlert } from "@/lib/db/schema"
import { SubscriptionRadarCard } from "@/components/subscriptions/subscription-radar-card"
import { UpgradeBanner } from "@/components/upgrade-banner"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useEffect } from "react"

type Analytics = Awaited<ReturnType<typeof getAnalytics>>

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

export function Dashboard({
  initialReceipts,
  initialTotal,
  analytics,
  scans,
  isGmailConnected,
  subscriptions,
  subscriptionAlerts,
  newAlertCount,
  isPro,
}: {
  initialReceipts: Receipt[]
  initialTotal: number
  analytics: Analytics
  scans: Scan[]
  isGmailConnected: boolean
  subscriptions: Subscription[]
  subscriptionAlerts: SubscriptionAlert[]
  newAlertCount?: number
  isPro: boolean
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
    <motion.div
      className="flex flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Receipts
        </h1>
        <p className="text-sm text-muted-foreground">
          Every business receipt, found and filed automatically.
        </p>
      </motion.div>

      {!isPro && <UpgradeBanner alertCount={subscriptionAlerts.length} />}

      <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <ScanCard scans={scans} hasReceipts={initialTotal > 0} isGmailConnected={isGmailConnected} />
      </motion.div>

      {subscriptions.length > 0 && (
        <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <SubscriptionRadarCard subscriptions={subscriptions} alerts={subscriptionAlerts} />
        </motion.div>
      )}

      {analytics.count > 0 && (
        <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <AnalyticsCards analytics={analytics} />
        </motion.div>
      )}

      <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <ReceiptsTable initialReceipts={initialReceipts} />
      </motion.div>
    </motion.div>
  )
}
