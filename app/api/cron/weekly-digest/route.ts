import { NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/internal-auth"
import { sendWeeklyDigests } from "@/lib/notifications/weekly-digest"

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await sendWeeklyDigests()
  return NextResponse.json(result)
}
