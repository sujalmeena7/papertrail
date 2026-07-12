import { db } from "@/lib/db"
import { scans, gmailConnections } from "@/lib/db/schema"
import { decrypt, encrypt } from "@/lib/encryption"
import { createGmailSource } from "@/lib/pipeline/sources/gmail"
import { fixtureSource } from "@/lib/pipeline/sources/fixture"
import { runScan } from "@/lib/pipeline/scan"
import { eq, and, inArray } from "drizzle-orm"

export async function runScanForUser(userId: string) {
  // Atomically claim the oldest pending scan for this user: the UPDATE's
  // WHERE re-checks status="pending" against the latest committed row, so if
  // two workers race on the same scan, only the first one's update matches
  // and the second gets back no row (Postgres locks the row and re-evaluates
  // the predicate after the first transaction commits).
  const [pending] = await db
    .update(scans)
    .set({ status: "running" })
    .where(
      and(
        eq(scans.status, "pending"),
        inArray(
          scans.id,
          db
            .select({ id: scans.id })
            .from(scans)
            .where(and(eq(scans.userId, userId), eq(scans.status, "pending")))
            .orderBy(scans.startedAt)
            .limit(1),
        ),
      ),
    )
    .returning()

  if (!pending) {
    return { status: "no-pending-scan" }
  }

  const scanId = pending.id

  try {
    if (pending.source === "gmail") {
      const [connection] = await db
        .select()
        .from(gmailConnections)
        .where(eq(gmailConnections.userId, userId))
        .limit(1)

      if (!connection) throw new Error("Gmail not connected")

      let accessToken = decrypt(connection.encryptedAccessToken ?? "") as string
      if (
        connection.tokenExpiresAt &&
        connection.tokenExpiresAt.getTime() < Date.now() + 5 * 60000
      ) {
        const refreshToken = decrypt(connection.encryptedRefreshToken ?? "")
        if (refreshToken) {
          const clientId = process.env.GOOGLE_CLIENT_ID
          const clientSecret = process.env.GOOGLE_CLIENT_SECRET
          if (clientId && clientSecret) {
            const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
              }),
            })
            if (tokenRes.ok) {
              const tokens = await tokenRes.json()
              accessToken = tokens.access_token
              await db
                .update(gmailConnections)
                .set({
                  encryptedAccessToken: encrypt(tokens.access_token),
                  tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
                  updatedAt: new Date(),
                })
                .where(eq(gmailConnections.id, connection.id))
            }
          }
        }
      }

      const source = createGmailSource(accessToken)
      const after = connection.lastScanAt ? new Date(connection.lastScanAt) : undefined
      await runScan(userId, source, { after, max: 50 })

      await db
        .update(gmailConnections)
        .set({ lastScanAt: new Date(), updatedAt: new Date() })
        .where(eq(gmailConnections.id, connection.id))
    } else {
      await runScan(userId, fixtureSource)
    }
  } catch (error) {
    await db
      .update(scans)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId))

    return { status: "failed", scanId }
  }

  return { status: "completed", scanId }
}
