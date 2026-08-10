import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { gmailConnections } from "@/lib/db/schema"
import { decrypt } from "@/lib/encryption"

const REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke"

/**
 * Ask Google to drop the OAuth grant behind a user's connected Gmail
 * account(s).
 *
 * Deleting our stored tokens is what actually stops us reading someone's mail,
 * but on its own it leaves Papertrail sitting in the user's Google Account
 * permissions page forever, looking like it still has access. Google's user
 * data policy expects the app to revoke, and it's the behaviour a user
 * disconnecting Gmail is asking for.
 *
 * Revoking the refresh token invalidates the whole grant, including every
 * access token issued under it, so that's the preferred token; we fall back to
 * the access token for rows saved without one. Note that Google scopes a grant
 * per (user, OAuth client) — a user who also signs in with Google may be asked
 * to consent again on their next Google sign-in. That's a single extra click,
 * and it's the honest outcome of "disconnect".
 *
 * Best effort by design: this never throws. A Google outage or an
 * already-revoked token must not block the local disconnect, which is the part
 * that matters for the user's privacy.
 */
export async function revokeGmailAccess(userId: string): Promise<void> {
  let connections: { encryptedAccessToken: string | null; encryptedRefreshToken: string | null }[]

  try {
    connections = await db
      .select({
        encryptedAccessToken: gmailConnections.encryptedAccessToken,
        encryptedRefreshToken: gmailConnections.encryptedRefreshToken,
      })
      .from(gmailConnections)
      .where(eq(gmailConnections.userId, userId))
  } catch (error) {
    console.error("revokeGmailAccess: failed to load connections", error)
    return
  }

  const tokens = connections
    .map(
      (c) =>
        decrypt(c.encryptedRefreshToken ?? "") ??
        decrypt(c.encryptedAccessToken ?? ""),
    )
    .filter((t): t is string => Boolean(t))

  await Promise.all(
    tokens.map(async (token) => {
      try {
        const res = await fetch(REVOKE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token }),
        })

        // 400 is what Google returns for a token that's already invalid or
        // revoked — the grant is gone either way, so it isn't worth logging.
        if (!res.ok && res.status !== 400) {
          console.error(
            `revokeGmailAccess: Google returned ${res.status} ${res.statusText}`,
          )
        }
      } catch (error) {
        console.error("revokeGmailAccess: revoke request failed", error)
      }
    }),
  )
}
