import { NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/internal-auth"
import { sendRenewalAlerts } from "@/lib/notifications/renewal-alerts"

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await sendRenewalAlerts()
  return NextResponse.json(result)
}
