import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { runScanForUser } from "@/lib/pipeline/run-scan"

export async function POST() {
  const sessionData = await auth.api.getSession({ headers: await headers() })

  const userId = sessionData?.user?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(await runScanForUser(userId))
}
