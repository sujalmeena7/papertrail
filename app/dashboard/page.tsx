import { getAnalytics, getReceiptsPaginated, getScans } from "@/app/actions/receipts"
import { getSubscriptions, getSubscriptionAlerts, triggerSubscriptionAnalysis } from "@/app/actions/subscriptions"
import { db } from "@/lib/db"
import { gmailConnections } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

import { Dashboard } from "@/components/dashboard"
import { getSession } from "@/lib/session"
import { getUserPlan } from "@/lib/billing/plan"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")

  // Run ALL data fetches in parallel — including subscription analysis
  const [paginated, analytics, scans, connectionCount, subscriptions, subscriptionAlertsList, analysisResult, plan] = await Promise.all([
    getReceiptsPaginated(0),
    getAnalytics(),
    getScans(),
    db.$count(
      gmailConnections,
      eq(gmailConnections.userId, session.user.id)
    ),
    getSubscriptions(),
    getSubscriptionAlerts(),
    triggerSubscriptionAnalysis().catch(() => ({ status: "error" as const, newAlerts: 0 })),
    getUserPlan(session.user.id),
  ])

  const isGmailConnected = connectionCount > 0

  return (
    <Dashboard
      initialReceipts={paginated.receipts}
      initialTotal={paginated.total}
      analytics={analytics}
      scans={scans}
      isGmailConnected={isGmailConnected}
      subscriptions={subscriptions}
      subscriptionAlerts={subscriptionAlertsList}
      newAlertCount={analysisResult.newAlerts}
      isPro={plan === "pro"}
    />
  )
}
