import { db } from "@/lib/db"
import { receipts, subscriptions, subscriptionAlerts } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { randomUUID } from "crypto"
import { getVendorCategory } from "@/lib/subscriptions/vendors"
import { subscriptionUsage } from "@/lib/db/schema"

// Known SaaS vendors that are almost always subscription-based.
// If a vendor matches this list, confidence gets a +0.1 boost.
const KNOWN_RECURRING_VENDORS = new Set([
  "aws", "vercel", "notion", "figma", "stripe", "openai",
  "github", "google cloud", "google workspace", "anthropic",
  "digitalocean", "namecheap", "cloudflare", "atlassian", "adobe",
  "microsoft", "slack", "linear", "railway", "supabase",
  "netlify", "heroku", "datadog", "sentry", "1password",
  "zoom", "grammarly", "webflow", "framer", "canva",
  "dropbox", "spotify", "apple", "netflix", "hulu",
])

/**
 * Compute a dynamic confidence score for a detected subscription.
 *
 * Starts at 1.0 and gets penalized for:
 *   - Only 2 charges (×0.7)
 *   - High variance in cadence intervals (×0.6)
 *   - Vendor not in known-recurring list (×0.9)
 */
function computeConfidence(
  chargeCount: number,
  diffsDays: number[],
  avgDiff: number,
  vendorNormalized: string
): number {
  let confidence = 1.0

  // Penalty: only 2 data points
  if (chargeCount === 2) {
    confidence *= 0.7
  } else if (chargeCount === 3) {
    confidence *= 0.85
  }

  // Penalty: high variance in intervals
  if (diffsDays.length >= 2) {
    const variance =
      diffsDays.reduce((sum, d) => sum + Math.pow(d - avgDiff, 2), 0) /
      diffsDays.length
    const stdDev = Math.sqrt(variance)
    // If std deviation is > 20% of the average interval, penalize
    if (stdDev / avgDiff > 0.2) {
      confidence *= 0.6
    } else if (stdDev / avgDiff > 0.1) {
      confidence *= 0.8
    }
  }

  // Boost: vendor is a known SaaS company
  if (KNOWN_RECURRING_VENDORS.has(vendorNormalized)) {
    confidence = Math.min(1.0, confidence + 0.1)
  } else {
    confidence *= 0.9
  }

  return Math.round(confidence * 100) / 100 // Round to 2 decimals
}

/**
 * Determine price hike severity based on percentage increase.
 *   >50% → critical
 *   >20% → warning
 *   >10% → info
 */
function priceHikeSeverity(
  pctIncrease: number
): "info" | "warning" | "critical" {
  if (pctIncrease > 50) return "critical"
  if (pctIncrease > 20) return "warning"
  return "info"
}

export async function analyzeSubscriptions(userId: string) {
  // 1. Fetch all receipts for the user (only positive amounts — ignore refunds/credits)
  const userReceipts = await db.query.receipts.findMany({
    where: and(eq(receipts.userId, userId)),
    orderBy: [asc(receipts.receiptDate)],
  })

  const positiveReceipts = userReceipts.filter((r) => r.amountCents > 0)

  // 2. Group by vendorNormalized + currency
  const groups = new Map<string, typeof positiveReceipts>()
  for (const r of positiveReceipts) {
    if (!r.vendorNormalized) continue
    const key = `${r.vendorNormalized}:::${r.currency}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  // 3. Fetch existing subscriptions & alerts to upsert/diff
  const existingSubsList = await db.query.subscriptions.findMany({
    where: eq(subscriptions.userId, userId),
  })
  const existingSubs = new Map(
    existingSubsList.map((s) => [`${s.vendorNormalized}:::${s.currency}`, s])
  )

  const activeSubKeys = new Set<string>()

  // 3b. Fetch all non-dismissed alerts once, up front, to avoid per-item
  // lookups inside the loops below (price_hike/missed_renewal/zombie are
  // keyed by subscriptionId+type; redundant_tool is keyed by category).
  const existingAlertsList = await db.query.subscriptionAlerts.findMany({
    where: and(eq(subscriptionAlerts.userId, userId), eq(subscriptionAlerts.dismissed, false)),
  })
  const alertTypesBySubscription = new Map<string, Set<string>>()
  const redundantToolCategories = new Set<string>()
  for (const a of existingAlertsList) {
    if (a.subscriptionId) {
      if (!alertTypesBySubscription.has(a.subscriptionId)) {
        alertTypesBySubscription.set(a.subscriptionId, new Set())
      }
      alertTypesBySubscription.get(a.subscriptionId)!.add(a.type)
    }
    if (a.type === "redundant_tool") {
      const category = (a.details as any)?.category
      if (category) redundantToolCategories.add(category)
    }
  }
  const newAlerts: (typeof subscriptionAlerts.$inferInsert)[] = []

  // 4. Analyze each group
  for (const [key, groupReceipts] of groups.entries()) {
    if (groupReceipts.length < 2) continue // Need at least 2 to detect cadence

    const [vendorNormalized, currency] = key.split(":::")

    // Calculate diffs between consecutive receipt dates
    const dates = groupReceipts.map((r) => new Date(r.receiptDate).getTime())
    const diffsDays: number[] = []
    for (let i = 1; i < dates.length; i++) {
      diffsDays.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24))
    }

    const avgDiff = diffsDays.reduce((a, b) => a + b, 0) / diffsDays.length

    let cadence: "monthly" | "annual" | "quarterly" | "irregular" = "irregular"
    let nextExpectedDays = 0

    if (avgDiff >= 25 && avgDiff <= 35) {
      cadence = "monthly"
      nextExpectedDays = 30
    } else if (avgDiff >= 350 && avgDiff <= 380) {
      cadence = "annual"
      nextExpectedDays = 365
    } else if (avgDiff >= 85 && avgDiff <= 95) {
      cadence = "quarterly"
      nextExpectedDays = 90
    }

    if (cadence === "irregular") continue // Only track regular subscriptions for now

    activeSubKeys.add(key)
    const existing = existingSubs.get(key)

    const firstChargeDate = groupReceipts[0].receiptDate
    const lastCharge = groupReceipts[groupReceipts.length - 1]
    const lastChargeDate = lastCharge.receiptDate
    const currentAmountCents = lastCharge.amountCents
    const previousAmountCents =
      groupReceipts.length > 1
        ? groupReceipts[groupReceipts.length - 2].amountCents
        : currentAmountCents

    const totalCharges = groupReceipts.length
    const averageAmountCents = Math.round(
      groupReceipts.reduce((sum, r) => sum + r.amountCents, 0) / totalCharges
    )

    // Dynamic confidence scoring
    const confidence = computeConfidence(
      totalCharges,
      diffsDays,
      avgDiff,
      vendorNormalized
    )

    // Calculate next expected date
    const lastDateObj = new Date(lastChargeDate)
    lastDateObj.setDate(lastDateObj.getDate() + nextExpectedDays)
    const nextExpectedDate = lastDateObj.toISOString().split("T")[0]

    // Upsert subscription
    let subId = existing?.id
    if (existing) {
      await db
        .update(subscriptions)
        .set({
          cadence,
          confidence,
          firstChargeDate,
          lastChargeDate,
          nextExpectedDate,
          currentAmountCents,
          averageAmountCents,
          totalCharges,
          status: "active",
          analyzedAt: new Date(),
        })
        .where(eq(subscriptions.id, existing.id))
    } else {
      subId = randomUUID()
      await db.insert(subscriptions).values({
        id: subId,
        userId,
        vendorNormalized,
        cadence,
        confidence,
        firstChargeDate,
        lastChargeDate,
        nextExpectedDate,
        currentAmountCents,
        currency,
        averageAmountCents,
        totalCharges,
        status: "active",
      })
    }

    // --- ALERTS ---

    // 1. Price Hike Alert
    if (currentAmountCents > previousAmountCents * 1.1) {
      const pctIncrease = Math.round(
        ((currentAmountCents - previousAmountCents) / previousAmountCents) * 100
      )
      const hasExistingAlert = alertTypesBySubscription.get(subId!)?.has("price_hike")

      if (!hasExistingAlert) {
        newAlerts.push({
          id: randomUUID(),
          userId,
          subscriptionId: subId!,
          type: "price_hike",
          severity: priceHikeSeverity(pctIncrease),
          details: {
            previousAmountCents,
            newAmountCents: currentAmountCents,
            increasePercentage: pctIncrease,
          },
        })
      }
    }

    // 2. Missed Renewal Alert
    const now = new Date()
    const nextExpected = new Date(nextExpectedDate)
    const daysOverdue =
      (now.getTime() - nextExpected.getTime()) / (1000 * 60 * 60 * 24)

    if (daysOverdue > 7) {
      const hasExistingAlert = alertTypesBySubscription.get(subId!)?.has("missed_renewal")

      if (!hasExistingAlert) {
        newAlerts.push({
          id: randomUUID(),
          userId,
          subscriptionId: subId!,
          type: "missed_renewal",
          severity: "warning",
          details: {
            daysOverdue: Math.floor(daysOverdue),
            expectedDate: nextExpectedDate,
          },
        })
      }
    }
  }

  // 5. Duplicate detection — find vendors with multiple charges in the same calendar month
  // that are within 10% of each other in amount (possible multi-seat duplicate)
  const existingDuplicateAlerts = await db.query.subscriptionAlerts.findMany({
    where: and(
      eq(subscriptionAlerts.userId, userId),
      eq(subscriptionAlerts.type, "duplicate"),
      eq(subscriptionAlerts.dismissed, false)
    ),
  })
  const vendorsWithDuplicateAlert = new Set(
    existingDuplicateAlerts.map((a) => (a.details as any)?.vendorNormalized)
  )

  for (const [key, groupReceipts] of groups.entries()) {
    if (groupReceipts.length < 2) continue
    const [vendorNormalized, currency] = key.split(":::")

    // Group charges by calendar month (YYYY-MM)
    const byMonth = new Map<string, typeof groupReceipts>()
    for (const r of groupReceipts) {
      const month = r.receiptDate.substring(0, 7) // "YYYY-MM"
      if (!byMonth.has(month)) byMonth.set(month, [])
      byMonth.get(month)!.push(r)
    }

    for (const [month, monthReceipts] of byMonth.entries()) {
      if (monthReceipts.length < 2) continue

      // Check if amounts are within 10% of each other
      const amounts = monthReceipts.map((r) => r.amountCents)
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const allSimilar = amounts.every(
        (a) => Math.abs(a - avgAmount) / avgAmount < 0.1
      )

      if (allSimilar) {
        // Only create one duplicate alert per vendor (avoid spamming)
        if (!vendorsWithDuplicateAlert.has(vendorNormalized)) {
          newAlerts.push({
            id: randomUUID(),
            userId,
            subscriptionId: null, // global alert, not tied to one subscription row
            type: "duplicate",
            severity: "info",
            details: {
              vendorNormalized,
              currency,
              month,
              chargesInMonth: monthReceipts.length,
              amounts,
            },
          })
          vendorsWithDuplicateAlert.add(vendorNormalized)
        }
        break // One alert per vendor is enough
      }
    }
  }

  // 6. Cleanup / mark cancelled
  for (const [key, sub] of existingSubs.entries()) {
    if (!activeSubKeys.has(key) && sub.status === "active") {
      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          analyzedAt: new Date(),
        })
        .where(eq(subscriptions.id, sub.id))
    }
  }

  // 7. Redundant Tool Detection (Actionable Insights)
  // Fetch all active subscriptions after the updates above
  const currentActiveSubs = await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active")
    )
  })

  const subsByCategory = new Map<string, typeof currentActiveSubs>()
  for (const sub of currentActiveSubs) {
    const category = getVendorCategory(sub.vendorNormalized)
    if (category !== "Uncategorized") {
      if (!subsByCategory.has(category)) subsByCategory.set(category, [])
      subsByCategory.get(category)!.push(sub)
    }
  }

  for (const [category, categorySubs] of subsByCategory.entries()) {
    if (categorySubs.length > 1) {
      if (!redundantToolCategories.has(category)) {
        newAlerts.push({
          id: randomUUID(),
          userId,
          subscriptionId: null,
          type: "redundant_tool",
          severity: "info",
          details: {
            category,
            vendors: categorySubs.map(s => s.vendorNormalized),
          },
        })
      }
    }
  }

  // 8. Zombie Detection (Usage tracking)
  const usages = await db.query.subscriptionUsage.findMany({
    where: eq(subscriptionUsage.userId, userId)
  })
  
  const usageMap = new Map(usages.map(u => [u.subscriptionId, u]))
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  for (const sub of currentActiveSubs) {
    const usage = usageMap.get(sub.id)
    
    let isZombie = false
    let reason = ""

    // Condition 1: Explicitly marked as never used or rarely used long ago
    if (usage && usage.usageStatus === "never") {
      isZombie = true
      reason = "Marked as never used."
    } else if (usage && usage.lastUsedAt && new Date(usage.lastUsedAt) < ninetyDaysAgo) {
      isZombie = true
      reason = `Last used on ${new Date(usage.lastUsedAt).toLocaleDateString()}, over 90 days ago.`
    } 
    // Condition 2: No usage data, and no receipt activity in 90 days
    else if (!usage && new Date(sub.lastChargeDate) < ninetyDaysAgo) {
      isZombie = true
      reason = `No recent usage recorded and last charge was over 90 days ago.`
    }

    if (isZombie) {
      const hasExistingAlert = alertTypesBySubscription.get(sub.id)?.has("zombie")

      if (!hasExistingAlert) {
        // Severity based on cost
        let severity = "info"
        const cost = sub.averageAmountCents
        if (cost > 5000) severity = "critical" // > $50
        else if (cost > 2000) severity = "warning" // > $20

        newAlerts.push({
          id: randomUUID(),
          userId,
          subscriptionId: sub.id,
          type: "zombie",
          severity,
          details: {
            reason,
            monthlyCostCents: sub.averageAmountCents,
          },
        })
      }
    }
  }

  if (newAlerts.length > 0) {
    await db.insert(subscriptionAlerts).values(newAlerts)
  }
}
