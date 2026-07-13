import { cache } from "react"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { billing } from "@/lib/db/schema"

export type Plan = "free" | "pro"

type BillingPlanRow = { status: string; currentPeriodEnd: Date | null } | null | undefined

// Pure resolution logic, shared between the per-request getUserPlan() below
// and batch email jobs (lib/notifications/*) that join the billing table
// themselves to avoid N+1 queries across hundreds of users.
//
// A user is "pro" when their subscription is active, OR when they've cancelled
// but the paid period hasn't ended yet (grace period — don't yank access they
// already paid for). Anything else — no row, past_due, or an expired cancelled
// period — is "free".
export function resolvePlan(row: BillingPlanRow): Plan {
  if (!row) return "free"

  if (row.status === "active") return "pro"

  if (
    row.status === "cancelled" &&
    row.currentPeriodEnd &&
    row.currentPeriodEnd > new Date()
  ) {
    return "pro"
  }

  return "free"
}

// Memoized per request with React's cache() (same reasoning as getSession):
// gating is checked at several points in a single render, and this collapses
// them into one DB round trip.
export const getUserPlan = cache(async (userId: string): Promise<Plan> => {
  const [row] = await db
    .select({
      status: billing.status,
      currentPeriodEnd: billing.currentPeriodEnd,
    })
    .from(billing)
    .where(eq(billing.userId, userId))
    .limit(1)

  return resolvePlan(row)
})

export async function isPro(userId: string): Promise<boolean> {
  return (await getUserPlan(userId)) === "pro"
}

// Guard for server actions / route handlers that must be Pro-only.
// Mirrors requireUserId()'s throw-on-failure style.
export async function requirePro(userId: string): Promise<void> {
  if (!(await isPro(userId))) {
    throw new Error("Upgrade required")
  }
}
