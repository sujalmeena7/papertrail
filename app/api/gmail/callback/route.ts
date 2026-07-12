import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { gmailConnections } from "@/lib/db/schema"
import { encrypt } from "@/lib/encryption"
import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")

  if (error) {
    return redirect(`/settings?error=${encodeURIComponent(error)}`)
  }
  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 })
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get("oauth_state")?.value

  if (!savedState || savedState !== state) {
    return new Response("Invalid state (CSRF)", { status: 400 })
  }

  // Single-use CSRF token — clear it now that it's been validated so it
  // can't be replayed and doesn't linger for its full TTL.
  cookieStore.delete("oauth_state")

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return redirect("/sign-in")
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return new Response("Missing OAuth credentials", { status: 500 })
  }

  const redirectUri = `${url.origin}/api/gmail/callback`

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text()
    console.error("Token exchange failed:", errorText)
    return redirect(`/settings?error=TokenExchangeFailed`)
  }

  const tokens = await tokenRes.json()

  // Get user's email from Google
  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  )

  if (!profileRes.ok) {
    return redirect(`/settings?error=ProfileFetchFailed`)
  }

  const profile = await profileRes.json()
  const email = profile.email

  const existing = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, session.user.id))
    .limit(1)

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
  const encryptedAccessToken = encrypt(tokens.access_token)

  let encryptedRefreshToken = null
  if (tokens.refresh_token) {
    encryptedRefreshToken = encrypt(tokens.refresh_token)
  }

  if (existing.length > 0) {
    await db
      .update(gmailConnections)
      .set({
        email,
        encryptedAccessToken,
        encryptedRefreshToken:
          encryptedRefreshToken ?? existing[0].encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        status: "connected",
        updatedAt: new Date(),
      })
      .where(eq(gmailConnections.id, existing[0].id))
  } else {
    await db.insert(gmailConnections).values({
      id: randomUUID(),
      userId: session.user.id,
      email,
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenExpiresAt: expiresAt,
      status: "connected",
    })
  }

  return redirect("/settings?success=gmail_connected")
}
