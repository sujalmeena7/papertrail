import { timingSafeEqual } from "crypto"

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
