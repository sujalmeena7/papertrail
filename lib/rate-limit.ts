// In-memory sliding-window rate limiter. Single-region only — swap for
// Upstash (or similar shared store) if the app moves to multi-region.
const hits = new Map<string, number[]>()

export function checkRateLimit(
  key: string,
  opts?: { limit?: number; windowMs?: number }
): { allowed: boolean; retryAfterSeconds?: number } {
  const limit = opts?.limit ?? 60
  const windowMs = opts?.windowMs ?? 60_000
  const now = Date.now()

  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= limit) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - timestamps[0])) / 1000)
    hits.set(key, timestamps)
    return { allowed: false, retryAfterSeconds }
  }

  timestamps.push(now)
  hits.set(key, timestamps)
  return { allowed: true }
}
