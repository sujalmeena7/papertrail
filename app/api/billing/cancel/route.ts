import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireUserId } from "@/lib/session"
import { razorpay } from "@/lib/razorpay/client"
import { db } from "@/lib/db"
import { billing } from "@/lib/db/schema"

// Cancels at the end of the current billing cycle — the user keeps Pro
// access until currentPeriodEnd (enforced by getUserPlan's grace check).
// The webhook (subscription.cancelled) is what actually flips `status` in
// the DB; this route just tells Razorpay to stop renewing.
export async function POST() {
  try {
    const userId = await requireUserId()

    const [row] = await db
      .select({ razorpaySubscriptionId: billing.razorpaySubscriptionId })
      .from(billing)
      .where(eq(billing.userId, userId))
      .limit(1)

    if (!row?.razorpaySubscriptionId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 })
    }

    await razorpay.subscriptions.cancel(row.razorpaySubscriptionId, true)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to cancel Razorpay subscription:", error)
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }
}
