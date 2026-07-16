"use server"

import { db } from "@/lib/db"
import {
  account,
  billing,
  bankConnections,
  bankTransactions,
  deviceTokens,
  gmailConnections,
  notificationPreferences,
  receipts,
  scans,
  sentNotifications,
  session as sessionTable,
  subscriptionAlerts,
  subscriptionUsage,
  subscriptions,
  user,
  verification,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireUserId } from "@/lib/session"
import { getSession } from "@/lib/session"
import { razorpay } from "@/lib/razorpay/client"

// Phrase the user must type to confirm. The client component has its own copy
// (a "use server" file can only export async functions, so it can't be shared
// from here). Keep the two in sync.
const DELETE_CONFIRMATION = "delete my account"

// Permanently deletes the signed-in user and every row that belongs to them.
// Irreversible. The client gates this behind a type-to-confirm dialog, but we
// re-validate the phrase here so the action can't be invoked directly without
// the same friction.
export async function deleteAccount(confirmation: string) {
  const userId = await requireUserId()

  if (confirmation.trim().toLowerCase() !== DELETE_CONFIRMATION) {
    throw new Error("Confirmation phrase does not match")
  }

  // If the user has a live Razorpay subscription, cancel it first so we don't
  // orphan a paid subscription that keeps billing a card for an account that no
  // longer exists. Best-effort: a Razorpay failure shouldn't block deletion of
  // the user's own data, but we surface it in logs.
  const [billingRow] = await db
    .select({
      razorpaySubscriptionId: billing.razorpaySubscriptionId,
      status: billing.status,
    })
    .from(billing)
    .where(eq(billing.userId, userId))
    .limit(1)

  if (
    billingRow?.razorpaySubscriptionId &&
    (billingRow.status === "active" || billingRow.status === "past_due")
  ) {
    try {
      // cancelAtCycleEnd = false → stop immediately; the account is going away.
      await razorpay.subscriptions.cancel(
        billingRow.razorpaySubscriptionId,
        false,
      )
    } catch (error) {
      console.error(
        "deleteAccount: failed to cancel Razorpay subscription",
        error,
      )
    }
  }

  const userEmail = (await getSession())?.user?.email

  // Delete children before parents to satisfy foreign keys. Wrapped in a
  // transaction so a partial failure never leaves a half-deleted account.
  await db.transaction(async (tx) => {
    await tx.delete(subscriptionAlerts).where(eq(subscriptionAlerts.userId, userId))
    await tx.delete(subscriptionUsage).where(eq(subscriptionUsage.userId, userId))
    await tx.delete(sentNotifications).where(eq(sentNotifications.userId, userId))
    await tx.delete(bankTransactions).where(eq(bankTransactions.userId, userId))
    await tx.delete(bankConnections).where(eq(bankConnections.userId, userId))
    await tx.delete(subscriptions).where(eq(subscriptions.userId, userId))
    await tx.delete(receipts).where(eq(receipts.userId, userId))
    await tx.delete(scans).where(eq(scans.userId, userId))
    await tx.delete(gmailConnections).where(eq(gmailConnections.userId, userId))
    await tx.delete(deviceTokens).where(eq(deviceTokens.userId, userId))
    await tx.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId))
    await tx.delete(billing).where(eq(billing.userId, userId))
    await tx.delete(sessionTable).where(eq(sessionTable.userId, userId))
    await tx.delete(account).where(eq(account.userId, userId))
    if (userEmail) {
      await tx.delete(verification).where(eq(verification.identifier, userEmail))
    }
    await tx.delete(user).where(eq(user.id, userId))
  })

  return { success: true }
}
