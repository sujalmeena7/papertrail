import { and, eq, gte, lte, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  billing,
  notificationPreferences,
  sentNotifications,
  subscriptions,
  user,
} from "@/lib/db/schema"
import { createUnsubscribeToken } from "@/lib/email/unsubscribe-token"
import { sendEmail } from "@/lib/email/client"
import { RenewalAlertEmail } from "@/lib/email/templates/renewal-alert"
import { resolvePlan } from "@/lib/billing/plan"

const DEDUPE_WINDOW_DAYS = 20
const DEFAULT_ALERT_DAYS_BEFORE = 3

export async function sendRenewalAlerts(): Promise<{
  sent: number
  skipped: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch all active subscriptions with a nextExpectedDate that could be
  // coming up, joined against the user's notification preferences (or
  // defaults if they haven't set any yet).
  const candidates = await db
    .select({
      subscription: subscriptions,
      userEmail: user.email,
      userName: user.name,
      preferencesDays:
        notificationPreferences.renewalAlertDaysBefore,
      preferencesEnabled:
        notificationPreferences.renewalAlertsEnabled,
      billingStatus: billing.status,
      billingCurrentPeriodEnd: billing.currentPeriodEnd,
    })
    .from(subscriptions)
    .innerJoin(user, eq(subscriptions.userId, user.id))
    .leftJoin(
      notificationPreferences,
      eq(subscriptions.userId, notificationPreferences.userId),
    )
    .leftJoin(billing, eq(subscriptions.userId, billing.userId))
    .where(
      and(
        eq(subscriptions.status, "active"),
        sql`${subscriptions.nextExpectedDate} is not null`,
      ),
    )

  // Batch-fetch existing sent notifications for dedupe — avoid N+1
  const recentWindows = await db
    .select({
      subscriptionId: sentNotifications.subscriptionId,
      sentAt: sentNotifications.sentAt,
    })
    .from(sentNotifications)
    .where(
      and(
        eq(sentNotifications.type, "renewal_alert"),
        gte(
          sentNotifications.sentAt,
          new Date(
            Date.now() - DEDUPE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
          ),
        ),
      ),
    )

  const alreadySent = new Set(recentWindows.map((r) => r.subscriptionId))

  const APP_URL =
    process.env.BETTER_AUTH_URL || "http://localhost:3000"

  let sent = 0
  let skipped = 0

  for (const c of candidates) {
    const nextDateStr = c.subscription.nextExpectedDate
    if (!nextDateStr) continue

    const nextDate = new Date(nextDateStr)

    // Skip users who explicitly disabled alerts
    if (c.preferencesEnabled === false) {
      skipped++
      continue
    }

    // Renewal alert emails are Pro-only
    if (resolvePlan({ status: c.billingStatus ?? "none", currentPeriodEnd: c.billingCurrentPeriodEnd ?? null }) !== "pro") {
      skipped++
      continue
    }

    // Dedupe — skip if already sent within window
    if (alreadySent.has(c.subscription.id)) {
      skipped++
      continue
    }

    const daysBefore =
      c.preferencesDays ?? DEFAULT_ALERT_DAYS_BEFORE

    // Check if the renewal is within the user's configured window
    const daysUntilRenewal = Math.floor(
      (nextDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24),
    )

    if (daysUntilRenewal < 0 || daysUntilRenewal > daysBefore) {
      skipped++
      continue
    }

    // Send the email
    const token = createUnsubscribeToken(c.subscription.userId)
    const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?token=${token}`
    const dashboardUrl = `${APP_URL}/dashboard`

    const amount = (c.subscription.currentAmountCents / 100).toFixed(2)

    try {
      await sendEmail({
        to: c.userEmail,
        subject: `${c.subscription.vendorNormalized} renews on ${nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        react: RenewalAlertEmail({
          vendorName: c.subscription.vendorNormalized,
          amount,
          renewalDate: nextDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          currency: c.subscription.currency,
          dashboardUrl,
          unsubscribeUrl,
        }),
      })

      // Record the sent notification for dedupe
      await db.insert(sentNotifications).values({
        userId: c.subscription.userId,
        subscriptionId: c.subscription.id,
        type: "renewal_alert",
      })

      sent++
    } catch (err) {
      console.error(
        `Failed to send renewal alert for subscription ${c.subscription.id}:`,
        err,
      )
      skipped++
    }
  }

  return { sent, skipped }
}
