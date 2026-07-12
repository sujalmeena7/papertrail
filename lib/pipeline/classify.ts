import { generateText, Output } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import type { ClassificationResult, EmailMessage } from "./types"

const classificationSchema = z.object({
  isReceipt: z
    .boolean()
    .describe(
      "True only if this email confirms a completed business payment (receipt, invoice, or charge confirmation). False for marketing, payment failures, trials, quotes, or personal purchases.",
    ),
  reason: z.string().describe("One short sentence explaining the decision."),
  vendor: z
    .string()
    .nullable()
    .describe(
      "Canonical vendor/company name (e.g. 'AWS', 'OpenAI', 'Vercel'). Null if not a receipt.",
    ),
  amountCents: z
    .number()
    .int()
    .nullable()
    .describe(
      "Total amount charged, in cents (e.g. $20.00 → 2000). Null if not a receipt or no amount found.",
    ),
  currency: z
    .string()
    .nullable()
    .describe("ISO 4217 currency code, e.g. 'USD', 'EUR'. Null if unknown."),
  date: z
    .string()
    .nullable()
    .describe(
      "Payment/receipt date in YYYY-MM-DD. Use the email date if no explicit date in the body. Null if not a receipt.",
    ),
  invoiceNumber: z
    .string()
    .nullable()
    .describe("Invoice or receipt number if present, otherwise null."),
  category: z
    .enum([
      "cloud",
      "saas",
      "ai",
      "domains",
      "payments",
      "design",
      "productivity",
      "marketing",
      "other",
    ])
    .nullable()
    .describe("Business expense category. Null if not a receipt."),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence that this is a genuine business receipt, 0 to 1."),
})

const MODEL = openai("gpt-4o-mini")

/**
 * True for errors that won't resolve by retrying — a bad/missing API key or
 * exhausted quota. The scan uses this to abort immediately instead of trying
 * every candidate email against a provider that will reject all of them.
 */
export function isFatalAiError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    msg.includes("api key") ||
    msg.includes("api_key") ||
    msg.includes("unauthorized") ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("permission") ||
    msg.includes("quota") ||
    msg.includes("billing") ||
    msg.includes("exceeded")
  )
}

const SYSTEM_PROMPT = `You are a receipt-detection engine for a business expense tool used by freelancers and small agencies.

You are given a single email (from, subject, date, body, attachment names). Decide if it is a RECEIPT: a confirmation that money was actually charged for a business product/service (SaaS subscription, cloud usage, domain renewal, API credits, software license, etc).

NOT receipts:
- Marketing/promotional emails, newsletters, product announcements (even from billing domains)
- Payment FAILURE or card-declined notices
- Trial started / trial ending notices with no charge
- Quotes, estimates, pro-forma invoices not yet paid
- Shipping/delivery notifications without payment info
- Personal purchases (food delivery, rideshare, retail shopping, entertainment subscriptions like Netflix/Spotify for personal use)

Edge cases:
- "Your invoice is available" from a business SaaS vendor with an amount = receipt (paid invoices)
- Annual renewal confirmations = receipt
- $0.00 credits/free-tier notices = NOT a receipt
- Refund notifications = NOT a receipt (Cycle 1 scope)

Extract exact values. Amounts must be the TOTAL charged, converted to integer cents. If the body shows "$23.40", amountCents is 2340. Never guess an amount that isn't in the email.`

export async function classifyEmail(
  email: EmailMessage,
): Promise<ClassificationResult> {
  const emailText = [
    `From: ${email.from}`,
    `Subject: ${email.subject}`,
    `Date: ${email.date}`,
    email.attachments?.length
      ? `Attachments: ${email.attachments.join(", ")}`
      : null,
    "",
    email.body.slice(0, 6000),
  ]
    .filter((l) => l !== null)
    .join("\n")

  const { output } = await generateText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    prompt: emailText,
    output: Output.object({ schema: classificationSchema }),
    // Fail fast: the AI SDK otherwise retries with 30-40s backoffs, so a dead
    // key or exhausted quota would hang a full scan for minutes. One email
    // occasionally lost to a transient blip is recovered on the next re-scan.
    maxRetries: 0,
  })

  if (
    output.isReceipt &&
    output.vendor &&
    output.amountCents !== null &&
    output.amountCents > 0 &&
    output.date
  ) {
    return {
      isReceipt: true,
      vendor: output.vendor,
      amountCents: output.amountCents,
      currency: output.currency ?? "USD",
      date: output.date,
      invoiceNumber: output.invoiceNumber,
      category: output.category ?? "other",
      confidence: output.confidence,
    }
  }

  return {
    isReceipt: false,
    reason: output.reason,
  }
}
