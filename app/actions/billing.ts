"use server"

import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { billing } from "@/lib/db/schema"
import { requireUserId } from "@/lib/session"
import { getUserPlan } from "@/lib/billing/plan"

export async function getBilling() {
  const userId = await requireUserId()

  const [row] = await db
    .select({
      status: billing.status,
      currentPeriodEnd: billing.currentPeriodEnd,
    })
    .from(billing)
    .where(eq(billing.userId, userId))
    .limit(1)

  const plan = await getUserPlan(userId)

  return {
    plan,
    status: row?.status ?? "none",
    currentPeriodEnd: row?.currentPeriodEnd ?? null,
  }
}
