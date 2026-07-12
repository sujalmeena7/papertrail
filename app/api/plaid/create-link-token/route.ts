import { requireUserId } from "@/lib/session"
import { plaidClient } from "@/lib/plaid/client"
import { NextResponse } from "next/server"
import { CountryCode, Products } from "plaid"

export async function POST() {
  try {
    const userId = await requireUserId()

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
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    )
  }
}
