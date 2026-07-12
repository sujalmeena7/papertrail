import type { EmailMessage, EmailSource } from "@/lib/pipeline/types"

/**
 * Gmail email source — DORMANT until Google OAuth credentials are provided.
 *
 * Activation requirements (see Settings → Gmail in the dashboard):
 *   GOOGLE_CLIENT_ID     — from a Google Cloud OAuth 2.0 client
 *   GOOGLE_CLIENT_SECRET — same client
 * The OAuth client must have the `gmail.readonly` scope approved and the
 * app's callback URL (`/api/gmail/callback`) registered as a redirect URI.
 *
 * Uses the Gmail REST API directly (no googleapis SDK — smaller footprint):
 *   - GET /gmail/v1/users/me/messages?q=<query>  — list candidate messages
 *   - GET /gmail/v1/users/me/messages/{id}?format=full — fetch bodies
 */

export function isGmailConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  )
}

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"

/** Gmail search query targeting likely receipt emails, bounded by date. */
function buildQuery(after?: Date): string {
  const terms = [
    "(receipt OR invoice OR payment OR billing OR subscription OR charged)",
  ]
  if (after) {
    const y = after.getFullYear()
    const m = String(after.getMonth() + 1).padStart(2, "0")
    const d = String(after.getDate()).padStart(2, "0")
    terms.push(`after:${y}/${m}/${d}`)
  }
  return terms.join(" ")
}

interface GmailHeader {
  name: string
  value: string
}

interface GmailMessagePart {
  mimeType: string
  filename?: string
  body?: { data?: string; size: number }
  parts?: GmailMessagePart[]
}

interface GmailMessage {
  id: string
  internalDate: string
  payload: {
    headers: GmailHeader[]
    mimeType: string
    body?: { data?: string }
    parts?: GmailMessagePart[]
  }
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
}

function extractBody(payload: GmailMessage["payload"]): string {
  // Prefer text/plain; fall back to stripped text/html.
  const findPart = (
    parts: GmailMessagePart[] | undefined,
    mime: string,
  ): GmailMessagePart | undefined => {
    if (!parts) return undefined
    for (const p of parts) {
      if (p.mimeType === mime && p.body?.data) return p
      const nested = findPart(p.parts, mime)
      if (nested) return nested
    }
    return undefined
  }

  if (payload.body?.data) return decodeBase64Url(payload.body.data)

  const plain = findPart(payload.parts, "text/plain")
  if (plain?.body?.data) return decodeBase64Url(plain.body.data)

  const html = findPart(payload.parts, "text/html")
  if (html?.body?.data) {
    return decodeBase64Url(html.body.data)
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  return ""
}

function collectAttachmentNames(payload: GmailMessage["payload"]): string[] {
  const names: string[] = []
  const walk = (parts?: GmailMessagePart[]) => {
    if (!parts) return
    for (const p of parts) {
      if (p.filename) names.push(p.filename)
      walk(p.parts)
    }
  }
  walk(payload.parts)
  return names
}

function getHeader(headers: GmailHeader[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""
}

/**
 * Creates a Gmail EmailSource bound to a user's access token.
 * Token refresh is handled by the caller (see /api/gmail routes).
 */
export function createGmailSource(accessToken: string): EmailSource {
  return {
    name: "gmail",
    async fetchEmails(options): Promise<EmailMessage[]> {
      const max = Math.min(options?.max ?? 200, 500)
      const query = buildQuery(options?.after)
      const emails: EmailMessage[] = []
      let pageToken: string | undefined

      while (emails.length < max) {
        const listUrl = new URL(`${GMAIL_API}/messages`)
        listUrl.searchParams.set("q", query)
        listUrl.searchParams.set("maxResults", String(Math.min(100, max - emails.length)))
        if (pageToken) listUrl.searchParams.set("pageToken", pageToken)

        const listRes = await fetch(listUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!listRes.ok) {
          throw new Error(`Gmail list failed: ${listRes.status} ${await listRes.text()}`)
        }
        const list = (await listRes.json()) as {
          messages?: { id: string }[]
          nextPageToken?: string
        }
        if (!list.messages?.length) break

        const chunkSize = 10
        for (let i = 0; i < list.messages.length; i += chunkSize) {
          const chunk = list.messages.slice(i, i + chunkSize)
          const chunkResults = await Promise.allSettled(
            chunk.map(async ({ id }) => {
              const msgRes = await fetch(`${GMAIL_API}/messages/${id}?format=full`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              })
              if (!msgRes.ok) throw new Error(`Fetch failed: ${msgRes.status}`)
              return msgRes.json() as Promise<GmailMessage>
            })
          )

          for (const result of chunkResults) {
            if (result.status === "fulfilled") {
              const msg = result.value
              const headers = msg.payload.headers
              emails.push({
                id: msg.id,
                from: getHeader(headers, "From"),
                subject: getHeader(headers, "Subject"),
                date: new Date(Number(msg.internalDate)).toISOString().slice(0, 10),
                body: extractBody(msg.payload).slice(0, 20000),
                attachments: collectAttachmentNames(msg.payload),
              })
            }
          }
          if (emails.length >= max) break
        }

        pageToken = list.nextPageToken
        if (!pageToken) break
      }

      return emails
    },
  }
}
