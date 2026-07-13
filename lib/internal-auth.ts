import { createHmac, timingSafeEqual } from "crypto"

export function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return false

  const token = authHeader.slice(7)
  const expected = Buffer.from(secret)
  const actual = Buffer.from(token)
  if (expected.length !== actual.length) return false

  return timingSafeEqual(expected, actual)
}

// Razorpay signs webhook payloads with HMAC-SHA256 of the RAW request body
// (before JSON parsing) using RAZORPAY_WEBHOOK_SECRET, sent in the
// x-razorpay-signature header. Verify against that raw string — re-serializing
// a parsed body would produce a different signature.
export function verifyRazorpayWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex")
  const expected = Buffer.from(expectedHex)
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length) return false

  return timingSafeEqual(expected, actual)
}
