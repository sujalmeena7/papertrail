// Single source of truth for how the Pro price is displayed across the app.
//
// The Razorpay account is INR-only for now (international payments pending
// approval), so the actual Razorpay Plan is created in INR at ₹999/mo. The UI
// — which already speaks USD everywhere — shows the USD equivalent as the
// primary figure with an INR microcopy line, so the ₹999 shown on Razorpay's
// hosted checkout popup is expected rather than a surprise.
//
// The real charged amount/currency lives in the Razorpay Plan (RAZORPAY_PLAN_ID),
// not here — these strings are display copy only. When international payments are
// approved, create a USD Plan, swap RAZORPAY_PLAN_ID, and update the copy below.

export const PRO_PRICE = {
  /** Primary display figure. */
  usd: "$10",
  /** Full "$10/mo" form for buttons/headlines. */
  usdPerMonth: "$10/mo",
  /** Microcopy shown under the USD figure so the INR checkout amount is expected. */
  inrNote: "billed in INR (₹999/mo)",
} as const

export type PlanTier = "free" | "pro"

export type PlanDisplay = {
  tier: PlanTier
  name: string
  price: string
  period: string
  note?: string
  description: string
  features: string[]
  featured: boolean
  cta: string
}

// Shared plan copy for the landing pricing section and the in-app billing page.
// Keep this the single source of truth for feature lists so the two surfaces
// never drift out of sync.
export const PLANS: PlanDisplay[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    description:
      "Scan every inbox and see exactly what your subscriptions are costing you.",
    features: [
      "Unlimited Gmail scanning",
      "Full spend analytics & trend chart",
      "Total savings + leak count, always visible",
      "Top money leak in full detail",
    ],
    featured: false,
    cta: "Get started free",
  },
  {
    tier: "pro",
    name: "Pro",
    price: PRO_PRICE.usd,
    period: "/mo",
    note: PRO_PRICE.inrNote,
    description: "Unlock every leak and act on it in one click.",
    features: [
      "Every money leak, fully broken down",
      "One-click cancellation links",
      "Renewal alert emails",
      "Full weekly digest (not just a teaser)",
      "Bank-linked stealth subscription detection",
      "CSV export",
    ],
    featured: true,
    cta: "Upgrade to Pro",
  },
]
