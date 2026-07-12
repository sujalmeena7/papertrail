"use server"

import { db } from "@/lib/db"
import { subscriptions, subscriptionAlerts, receipts } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId as getUserId } from "@/lib/session"
import { analyzeSubscriptions } from "@/lib/subscriptions/detect"

export async function triggerSubscriptionAnalysis() {
  const userId = await getUserId()

  // Check if we analyzed recently (within the last hour)
  // to avoid running detection on every page load
  const latestSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    orderBy: [desc(subscriptions.analyzedAt)],
  })

  const ONE_HOUR = 60 * 60 * 1000
  if (latestSub && latestSub.analyzedAt.getTime() > Date.now() - ONE_HOUR) {
    return { status: "cached" as const, newAlerts: 0 }
  }

  // Count alerts before analysis
  const alertsBefore = await db
    .select()
    .from(subscriptionAlerts)
    .where(
      and(
        eq(subscriptionAlerts.userId, userId),
        eq(subscriptionAlerts.dismissed, false)
      )
    )

  await analyzeSubscriptions(userId)

  // Count alerts after analysis
  const alertsAfter = await db
    .select()
    .from(subscriptionAlerts)
    .where(
      and(
        eq(subscriptionAlerts.userId, userId),
        eq(subscriptionAlerts.dismissed, false)
      )
    )

  const newAlerts = alertsAfter.length - alertsBefore.length

  revalidatePath("/subscriptions")
  revalidatePath("/")
  return { status: "analyzed" as const, newAlerts }
}

export async function getSubscriptions() {
  const userId = await getUserId()

  return db.query.subscriptions.findMany({
    where: eq(subscriptions.userId, userId),
    orderBy: [desc(subscriptions.totalCharges)],
  })
}

export async function getSubscriptionAlerts() {
  const userId = await getUserId()

  return db.query.subscriptionAlerts.findMany({
    where: and(
      eq(subscriptionAlerts.userId, userId),
      eq(subscriptionAlerts.dismissed, false)
    ),
    orderBy: [desc(subscriptionAlerts.createdAt)],
  })
}

export async function dismissAlert(id: string) {
  const userId = await getUserId()
  if (!userId) throw new Error("Unauthorized")

  await db
    .update(subscriptionAlerts)
    .set({
      dismissed: true,
      dismissedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptionAlerts.id, id),
        eq(subscriptionAlerts.userId, userId)
      )
    )

  revalidatePath("/subscriptions")
  revalidatePath("/")
}

export async function cancelSubscription(id: string) {
  const userId = await getUserId()
  if (!userId) throw new Error("Unauthorized")

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.userId, userId)
      )
    )

  revalidatePath("/subscriptions")
  revalidatePath("/")
}

export async function getSubscriptionReceipts(vendorNormalized: string, currency: string) {
  const userId = await getUserId()
  if (!userId) throw new Error("Unauthorized")

  return db.query.receipts.findMany({
    where: and(
      eq(receipts.userId, userId),
      eq(receipts.vendorNormalized, vendorNormalized),
      eq(receipts.currency, currency)
    ),
    orderBy: [desc(receipts.receiptDate)],
  })
}
