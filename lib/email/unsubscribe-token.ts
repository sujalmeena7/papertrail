import { createHmac, timingSafeEqual } from "crypto"

const SECRET = process.env.BETTER_AUTH_SECRET!
if (!SECRET) throw new Error("BETTER_AUTH_SECRET must be set")

export function createUnsubscribeToken(userId: string): string {
  const sig = createHmac("sha256", SECRET).update(userId).digest("hex")
  return Buffer.from(`${userId}:${sig}`).toString("base64url")
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const payload = Buffer.from(token, "base64url").toString("utf8")
    const separatorIdx = payload.indexOf(":")
    if (separatorIdx === -1) return null

    const userId = payload.slice(0, separatorIdx)
    const sig = payload.slice(separatorIdx + 1)
    if (!userId || !sig) return null

    const expected = createHmac("sha256", SECRET).update(userId).digest("hex")
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    return userId
  } catch {
    return null
  }
}
