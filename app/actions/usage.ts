"use server"

import { requireUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { subscriptionUsage, subscriptions, subscriptionAlerts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"

export async function reportSubscriptionUsage(
  subscriptionId: string, 
  usageStatus: "active_daily" | "active_weekly" | "active_monthly" | "rarely" | "never" | "unknown"
) {
  const userId = await requireUserId()

  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.id, subscriptionId),
      eq(subscriptions.userId, userId)
    )
  })

  if (!sub) throw new Error("Subscription not found")

  const existingUsage = await db.query.subscriptionUsage.findFirst({
    where: eq(subscriptionUsage.subscriptionId, subscriptionId)
  })

  const now = new Date()

  if (existingUsage) {
    await db.update(subscriptionUsage)
      .set({ 
        usageStatus, 
        lastUsedAt: usageStatus === "never" ? existingUsage.lastUsedAt : now,
        updatedAt: now 
      })
      .where(eq(subscriptionUsage.id, existingUsage.id))
  } else {
    await db.insert(subscriptionUsage).values({
      id: randomUUID(),
      userId,
      subscriptionId,
      usageStatus,
      lastUsedAt: usageStatus === "never" ? null : now,
      loginSource: "manual"
    })
  }

  // Update lastActivityAt on the subscription if it's being used
  if (usageStatus !== "never" && usageStatus !== "unknown" && usageStatus !== "rarely") {
    await db.update(subscriptions)
      .set({ lastActivityAt: now })
      .where(eq(subscriptions.id, subscriptionId))
  }

  // Dismiss any existing zombie alerts if they just reported usage
  if (usageStatus !== "never") {
    await db.update(subscriptionAlerts)
      .set({ dismissed: true, dismissedAt: now })
      .where(and(
        eq(subscriptionAlerts.subscriptionId, subscriptionId),
        eq(subscriptionAlerts.type, "zombie")
      ))
  }

  revalidatePath("/subscriptions")
}
