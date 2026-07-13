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
