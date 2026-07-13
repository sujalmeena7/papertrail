import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/session"
import { razorpay } from "@/lib/razorpay/client"
import { db } from "@/lib/db"
import { billing } from "@/lib/db/schema"
import { randomUUID } from "crypto"

// Razorpay Subscriptions don't take a customer_id up front — the customer is
// linked automatically once they complete the authorization payment at
// checkout. So this route just creates the Subscription against our fixed
// Plan (RAZORPAY_PLAN_ID, an INR ₹999/mo plan) and hands the id to the
// client to open in Razorpay's Checkout. The webhook is what actually
// confirms/activates it — this route never grants Pro access itself.
const TOTAL_BILLING_CYCLES = 120 // 10 years of monthly cycles; Razorpay requires a bound

export async function POST() {
  try {
    const userId = await requireUserId()
    const planId = process.env.RAZORPAY_PLAN_ID
    if (!planId) {
      return NextResponse.json({ error: "Billing is not configured" }, { status: 500 })
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: TOTAL_BILLING_CYCLES,
      customer_notify: 1,
      notes: { userId },
    })

    await db
      .insert(billing)
      .values({
        userId,
        razorpaySubscriptionId: subscription.id,
      })
      .onConflictDoUpdate({
        target: billing.userId,
        set: {
          razorpaySubscriptionId: subscription.id,
          updatedAt: new Date(),
        },
      })

    return NextResponse.json({ subscriptionId: subscription.id })
  } catch (error) {
    console.error("Failed to create Razorpay subscription:", error)
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 })
  }
}
