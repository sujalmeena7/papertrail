import { auth } from "@/lib/auth"
import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"
import { randomBytes } from "crypto"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return redirect("/sign-in")
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return new Response("Missing GOOGLE_CLIENT_ID", { status: 500 })
  }

  const url = new URL(request.url)
  const redirectUri = `${url.origin}/api/gmail/callback`

  const state = randomBytes(32).toString("hex")
  const cookieStore = await cookies()
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  })

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email"
  )
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("prompt", "consent") // Force consent to get refresh token
  authUrl.searchParams.set("state", state)

  redirect(authUrl.toString())
}
