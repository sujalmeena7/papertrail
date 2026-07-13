import { requireUserId } from "@/lib/session"
import { requirePro } from "@/lib/billing/plan"
import { plaidClient } from "@/lib/plaid/client"
import { NextResponse } from "next/server"
import { CountryCode, Products } from "plaid"

export async function POST() {
  try {
    const userId = await requireUserId()
    await requirePro(userId)

    // Create a link_token for the given user
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: "Papertrail",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Failed to create Plaid link token:", error)
    const status = error instanceof Error && error.message === "Upgrade required" ? 402 : 500
    return NextResponse.json(
      { error: status === 402 ? "Upgrade required" : "Failed to create link token" },
      { status }
    )
  }
}
