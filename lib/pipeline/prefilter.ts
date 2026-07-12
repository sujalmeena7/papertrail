import type { EmailMessage } from "./types"

// Rule-based pre-filter: cheaply decides whether an email is worth sending to
// the LLM. Errs on the side of inclusion (false positives are fine — the LLM
// rejects them; false negatives are lost receipts).

const RECEIPT_KEYWORDS = [
  "receipt",
  "invoice",
  "payment",
  "billing",
  "charged",
  "subscription",
  "order confirmation",
  "your order",
  "renewal",
  "statement",
  "purchase",
  "transaction",
  "paid",
  "charge",
  "billed",
]

const CURRENCY_PATTERN =
  /(?:\$|€|£|₹|USD|EUR|GBP|INR)\s?\d{1,3}(?:[,.]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?\s?(?:USD|EUR|GBP|INR)/i

const BILLING_SENDER_HINTS = [
  "billing",
  "invoice",
  "receipt",
  "payments",
  "no-reply",
  "noreply",
  "accounts",
  "orders",
]

const KNOWN_BILLING_DOMAINS = [
  "stripe.com",
  "aws.amazon.com",
  "amazon.com",
  "openai.com",
  "anthropic.com",
  "vercel.com",
  "google.com",
  "figma.com",
  "notion.so",
  "github.com",
  "slack.com",
  "zoom.us",
  "digitalocean.com",
  "cloudflare.com",
  "namecheap.com",
  "godaddy.com",
  "paddle.com",
  "chargebee.com",
  "atlassian.com",
  "linear.app",
  "twilio.com",
  "heroku.com",
  "netlify.com",
  "mailchimp.com",
  "hubspot.com",
  "canva.com",
  "adobe.com",
  "dropbox.com",
  "1password.com",
  "sentry.io",
  "datadoghq.com",
  "supabase.com",
  "railway.app",
  "render.com",
  "planetscale.com",
]

export interface PrefilterResult {
  pass: boolean
  signals: string[]
}

export function prefilterEmail(email: EmailMessage): PrefilterResult {
  const signals: string[] = []
  const subjectLower = email.subject.toLowerCase()
  const bodyLower = email.body.toLowerCase()
  const fromLower = email.from.toLowerCase()

  // Signal 1: receipt keyword in subject
  if (RECEIPT_KEYWORDS.some((k) => subjectLower.includes(k))) {
    signals.push("subject_keyword")
  }

  // Signal 2: receipt keyword in body
  if (RECEIPT_KEYWORDS.some((k) => bodyLower.includes(k))) {
    signals.push("body_keyword")
  }

  // Signal 3: currency amount anywhere
  if (CURRENCY_PATTERN.test(email.subject) || CURRENCY_PATTERN.test(email.body)) {
    signals.push("currency_amount")
  }

  // Signal 4: billing-ish sender local part
  if (BILLING_SENDER_HINTS.some((h) => fromLower.split("@")[0]?.includes(h))) {
    signals.push("billing_sender")
  }

  // Signal 5: known billing domain
  const domain = fromLower.split("@")[1]?.replace(/[>\s]/g, "") ?? ""
  if (KNOWN_BILLING_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) {
    signals.push("known_domain")
  }

  // Signal 6: invoice-looking attachment
  if (
    email.attachments?.some((a) =>
      /invoice|receipt|statement/i.test(a) && /\.pdf$/i.test(a),
    )
  ) {
    signals.push("invoice_attachment")
  }

  // Require at least 2 signals, OR a currency amount + any keyword-ish signal.
  // Known-domain + keyword is the strongest cheap combination.
  const pass =
    signals.length >= 2 ||
    signals.includes("invoice_attachment")

  return { pass, signals }
}
