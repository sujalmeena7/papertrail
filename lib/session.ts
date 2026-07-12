import { cache } from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

// Memoize the session lookup for the duration of a single server request.
// The homepage + its server actions ask for the session several times per
// render; without this, each call is a separate round trip to the remote DB.
// React's cache() collapses them into one lookup per request.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export async function requireUserId() {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}
