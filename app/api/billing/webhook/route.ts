import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { verifyRazorpayWebhook } from "@/lib/internal-auth"
import { db } from "@/lib/db"
import { billing, billingEvents } from "@/lib/db/schema"

// Razorpay Subscription lifecycle events we care about. Anything else is
// acknowledged (200) and ignored so unrelated webhook types don't retry forever.
const ACTIVATING_EVENTS = new Set(["subscription.activated", "subscription.charged"])
const PAST_DUE_EVENTS = new Set(["subscription.pending", "subscription.halted"])
const CANCELLING_EVENTS = new Set(["subscription.cancelled", "subscription.completed"])

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-razorpay-signature")

  if (!verifyRazorpayWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // Razorpay doesn't guarantee a stable event id in the payload body, but it
  // redelivers the identical payload on retry — hash the raw body as the
  // idempotency key so a redelivered webhook is processed exactly once.
  const eventId = createHash("sha256").update(rawBody).digest("hex")

  const body = JSON.parse(rawBody)
  const eventType: string = body.event
  const subscriptionEntity = body.payload?.subscription?.entity
  const userId: string | undefined = subscriptionEntity?.notes?.userId
  const razorpaySubscriptionId: string | undefined = subscriptionEntity?.id
  const razorpayCustomerId: string | undefined = subscriptionEntity?.customer_id
  const currentEndUnix: number | undefined = subscriptionEntity?.current_end

  try {
    const [existing] = await db
      .select({ id: billingEvents.id })
      .from(billingEvents)
      .where(eq(billingEvents.eventId, eventId))
      .limit(1)

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    await db.insert(billingEvents).values({
      eventId,
      type: eventType,
      payload: body,
    })

    if (userId && razorpaySubscriptionId) {
      if (ACTIVATING_EVENTS.has(eventType)) {
        await db
          .insert(billing)
          .values({
            userId,
            plan: "pro",
            status: "active",
            razorpaySubscriptionId,
            razorpayCustomerId,
            currentPeriodEnd: currentEndUnix ? new Date(currentEndUnix * 1000) : null,
          })
          .onConflictDoUpdate({
            target: billing.userId,
            set: {
              plan: "pro",
              status: "active",
              razorpaySubscriptionId,
              razorpayCustomerId,
              currentPeriodEnd: currentEndUnix ? new Date(currentEndUnix * 1000) : null,
              updatedAt: new Date(),
            },
          })
      } else if (PAST_DUE_EVENTS.has(eventType)) {
        await db
          .update(billing)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(eq(billing.userId, userId))
      } else if (CANCELLING_EVENTS.has(eventType)) {
        await db
          .update(billing)
          .set({
            status: "cancelled",
            currentPeriodEnd: currentEndUnix ? new Date(currentEndUnix * 1000) : null,
            updatedAt: new Date(),
          })
          .where(eq(billing.userId, userId))
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Failed to process Razorpay webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
