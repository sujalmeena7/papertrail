import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  notificationPreferences,
  subscriptionAlerts,
  subscriptions,
  user,
  type Subscription,
  type SubscriptionAlert,
} from "@/lib/db/schema"
import { identifyCandidates } from "@/lib/subscriptions/savings"
import { createUnsubscribeToken } from "@/lib/email/unsubscribe-token"
import { sendEmail } from "@/lib/email/client"
import { WeeklyDigestEmail } from "@/lib/email/templates/weekly-digest"

const DIGEST_INTERVAL_DAYS = 6
const MAX_CANDIDATES_IN_EMAIL = 5

export async function sendWeeklyDigests(): Promise<{
  sent: number
  skipped: number
}> {
  const cutoff = new Date(Date.now() - DIGEST_INTERVAL_DAYS * 24 * 60 * 60 * 1000)

  const users = await db
    .select({
      userId: user.id,
      userEmail: user.email,
      weeklyDigestEnabled: notificationPreferences.weeklyDigestEnabled,
      lastDigestSentAt: notificationPreferences.lastDigestSentAt,
    })
    .from(user)
    .leftJoin(notificationPreferences, eq(user.id, notificationPreferences.userId))

  const activeSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"))

  const openAlerts = await db
    .select()
    .from(subscriptionAlerts)
    .where(eq(subscriptionAlerts.dismissed, false))

  const subsByUser = new Map<string, Subscription[]>()
  for (const sub of activeSubs) {
    const list = subsByUser.get(sub.userId) ?? []
    list.push(sub)
    subsByUser.set(sub.userId, list)
  }

  const alertsByUser = new Map<string, SubscriptionAlert[]>()
  for (const alert of openAlerts) {
    const list = alertsByUser.get(alert.userId) ?? []
    list.push(alert)
    alertsByUser.set(alert.userId, list)
  }

  const APP_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000"

  let sent = 0
  let skipped = 0

  for (const u of users) {
    if (u.weeklyDigestEnabled === false) {
      skipped++
      continue
    }

    if (u.lastDigestSentAt && u.lastDigestSentAt > cutoff) {
      skipped++
      continue
    }

    const candidates = identifyCandidates(
      subsByUser.get(u.userId) ?? [],
      alertsByUser.get(u.userId) ?? [],
    )

    if (candidates.length === 0) {
      skipped++
      continue
    }

    const totalMonthlyCents = candidates.reduce(
      (sum, c) => sum + c.potentialSavings,
      0,
    )
    const currency = candidates[0].subscription.currency

    const token = createUnsubscribeToken(u.userId)
    const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?token=${token}&type=digest`
    const dashboardUrl = `${APP_URL}/dashboard`

    try {
      await sendEmail({
        to: u.userEmail,
        subject: `You could save on ${candidates.length} subscription${candidates.length === 1 ? "" : "s"} this week`,
        react: WeeklyDigestEmail({
          candidates: candidates.slice(0, MAX_CANDIDATES_IN_EMAIL).map((c) => ({
            vendorName: c.subscription.vendorNormalized,
            reason: c.reason,
            amountCents: c.potentialSavings,
          })),
          totalMonthlyCents,
          currency,
          dashboardUrl,
          unsubscribeUrl,
        }),
      })

      await db
        .insert(notificationPreferences)
        .values({ userId: u.userId, lastDigestSentAt: new Date() })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: { lastDigestSentAt: new Date(), updatedAt: new Date() },
        })

      sent++
    } catch (err) {
      console.error(`Failed to send weekly digest for user ${u.userId}:`, err)
      skipped++
    }
  }

  return { sent, skipped }
}
