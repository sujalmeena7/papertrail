import type { Subscription, SubscriptionAlert } from "@/lib/db/schema"

export function monthlyEquivalent(sub: Subscription): number {
  if (sub.cadence === "annual") return sub.currentAmountCents / 12
  if (sub.cadence === "quarterly") return sub.currentAmountCents / 3
  return sub.currentAmountCents
}

export interface SavingsCandidate {
  subscription: Subscription
  reason: string
  reasonType: "price_hike" | "missed_renewal" | "duplicate" | "low_usage" | "redundant_tool" | "zombie"
  potentialSavings: number
}

export function identifyCandidates(
  subscriptions: Subscription[],
  alerts: SubscriptionAlert[]
): SavingsCandidate[] {
  const candidates: SavingsCandidate[] = []
  const activeSubs = subscriptions.filter((s) => s.status === "active")

  const priceHikeAlerts = alerts.filter((a) => a.type === "price_hike")
  for (const alert of priceHikeAlerts) {
    const sub = activeSubs.find((s) => s.id === alert.subscriptionId)
    if (!sub) continue
    const details = alert.details as any
    candidates.push({
      subscription: sub,
      reason: `Price increased ${details.increasePercentage}% recently`,
      reasonType: "price_hike",
      potentialSavings: monthlyEquivalent(sub),
    })
  }

  const missedAlerts = alerts.filter((a) => a.type === "missed_renewal")
  for (const alert of missedAlerts) {
    const sub = activeSubs.find((s) => s.id === alert.subscriptionId)
    if (!sub) continue
    if (candidates.some((c) => c.subscription.id === sub.id)) continue
    candidates.push({
      subscription: sub,
      reason: `No charge detected in ${(alert.details as any).daysOverdue} days`,
      reasonType: "missed_renewal",
      potentialSavings: monthlyEquivalent(sub),
    })
  }

  const redundantAlerts = alerts.filter((a) => a.type === "redundant_tool")
  for (const alert of redundantAlerts) {
    const details = alert.details as any
    const vendors = (details.vendors as string[]) || []
    for (const vendor of vendors) {
      const subs = activeSubs.filter((s) => s.vendorNormalized === vendor)
      for (const sub of subs) {
        if (candidates.some((c) => c.subscription.id === sub.id)) continue
        candidates.push({
          subscription: sub,
          reason: `Redundant tool in "${details.category}" category`,
          reasonType: "redundant_tool",
          potentialSavings: monthlyEquivalent(sub),
        })
      }
    }
  }

  const zombieAlerts = alerts.filter((a) => a.type === "zombie")
  for (const alert of zombieAlerts) {
    const sub = activeSubs.find((s) => s.id === alert.subscriptionId)
    if (!sub) continue
    if (candidates.some((c) => c.subscription.id === sub.id)) continue
    candidates.push({
      subscription: sub,
      reason: "Unused subscription detected",
      reasonType: "zombie",
      potentialSavings: monthlyEquivalent(sub),
    })
  }

  for (const sub of activeSubs) {
    if (sub.confidence < 0.7 && !candidates.some((c) => c.subscription.id === sub.id)) {
      candidates.push({
        subscription: sub,
        reason: `Low detection confidence (${Math.round(sub.confidence * 100)}%)`,
        reasonType: "low_usage",
        potentialSavings: monthlyEquivalent(sub),
      })
    }
  }

  return candidates.sort((a, b) => b.potentialSavings - a.potentialSavings)
}
