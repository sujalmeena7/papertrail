import { NextResponse } from "next/server"
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token"
import { db } from "@/lib/db"
import { notificationPreferences } from "@/lib/db/schema"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return new NextResponse(invalidHtml, {
      headers: { "content-type": "text/html" },
      status: 400,
    })
  }

  const userId = verifyUnsubscribeToken(token)
  if (!userId) {
    return new NextResponse(invalidHtml, {
      headers: { "content-type": "text/html" },
      status: 400,
    })
  }

  await db
    .insert(notificationPreferences)
    .values({
      userId,
      renewalAlertsEnabled: false,
    })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: {
        renewalAlertsEnabled: false,
        updatedAt: new Date(),
      },
    })

  return new NextResponse(confirmedHtml, {
    headers: { "content-type": "text/html" },
  })
}

const invalidHtml = `<!DOCTYPE html>
<html>
<head><title>Invalid Link</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f6f9fc">
<div style="background:#fff;padding:32px;border-radius:8px;max-width:400px;text-align:center">
<h1 style="color:#1a1a2e;font-size:20px">Invalid or expired link</h1>
<p style="color:#525f7f">This unsubscribe link is not valid. If you need help, contact support.</p>
</div>
</body>
</html>`

const confirmedHtml = `<!DOCTYPE html>
<html>
<head><title>Unsubscribed</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f6f9fc">
<div style="background:#fff;padding:32px;border-radius:8px;max-width:400px;text-align:center">
<h1 style="color:#1a1a2e;font-size:20px">You've been unsubscribed</h1>
<p style="color:#525f7f">You will no longer receive PaperTrail renewal alert emails. You can re-enable them anytime from your dashboard settings.</p>
</div>
</body>
</html>`
