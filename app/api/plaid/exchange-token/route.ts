import { requireUserId } from "@/lib/session"
import { requirePro } from "@/lib/billing/plan"
import { plaidClient } from "@/lib/plaid/client"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { bankConnections } from "@/lib/db/schema"
import { randomUUID } from "crypto"
import { encrypt } from "@/lib/encryption"

export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    await requirePro(userId)
    const { public_token, institution_id, institution_name } = await request.json()

    if (!public_token) {
      return NextResponse.json({ error: "Missing public token" }, { status: 400 })
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Fetch accounts to get the masked account number and name
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })
    
    // Default to the first account for some basic metadata (Plaid link usually links all accounts for an item)
    const primaryAccount = accountsResponse.data.accounts[0]

    // Store in DB
    const id = randomUUID()
    await db.insert(bankConnections).values({
      id,
      userId,
      institutionName: institution_name || "Unknown Bank",
      institutionId: institution_id,
      encryptedAccessToken: encrypt(accessToken),
      accountMask: primaryAccount?.mask,
      accountName: primaryAccount?.name,
      accountType: primaryAccount?.subtype,
      status: "connected",
    })

    return NextResponse.json({ success: true, connectionId: id })
  } catch (error) {
    console.error("Failed to exchange Plaid token:", error)
    const status = error instanceof Error && error.message === "Upgrade required" ? 402 : 500
    return NextResponse.json(
      { error: status === 402 ? "Upgrade required" : "Failed to exchange token" },
      { status }
    )
  }
}
