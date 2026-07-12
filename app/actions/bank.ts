"use server"

import { requireUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { bankConnections, bankTransactions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { plaidClient } from "@/lib/plaid/client"
import { revalidatePath } from "next/cache"
import { reconcileBankTransactions } from "@/lib/bank/reconcile"
import { Transaction } from "plaid"
import { decrypt } from "@/lib/encryption"

export async function getBankConnections() {
  const userId = await requireUserId()
  return await db.query.bankConnections.findMany({
    where: eq(bankConnections.userId, userId),
  })
}

export async function disconnectBank(connectionId: string) {
  const userId = await requireUserId()
  const connection = await db.query.bankConnections.findFirst({
    where: and(
      eq(bankConnections.id, connectionId),
      eq(bankConnections.userId, userId)
    )
  })

  if (!connection) {
    throw new Error("Connection not found")
  }

  // Remove from Plaid
  try {
    const accessToken = decrypt(connection.encryptedAccessToken)
    if (accessToken) {
      await plaidClient.itemRemove({
        access_token: accessToken
      })
    }
  } catch (error) {
    console.error("Failed to remove item from Plaid:", error)
    // We still delete it locally
  }

  // Delete from local DB (cascades to transactions)
  await db.delete(bankConnections).where(eq(bankConnections.id, connectionId))
  revalidatePath("/settings")
  revalidatePath("/subscriptions")
}

export async function syncBankTransactions(connectionId: string) {
  const userId = await requireUserId()
  const connection = await db.query.bankConnections.findFirst({
    where: and(
      eq(bankConnections.id, connectionId),
      eq(bankConnections.userId, userId)
    )
  })

  if (!connection) {
    throw new Error("Connection not found")
  }

  const accessToken = decrypt(connection.encryptedAccessToken)
  if (!accessToken) {
    throw new Error("Invalid bank access token")
  }

  // Fetch last 90 days of transactions
  const endDate = new Date().toISOString().split('T')[0]
  const startDateObj = new Date()
  startDateObj.setDate(startDateObj.getDate() - 90)
  const startDate = startDateObj.toISOString().split('T')[0]

  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    })

    const transactions = response.data.transactions

    // Filter only positive amounts (charges)
    const charges = transactions.filter(t => t.amount > 0)
    
    // We will reconcile inside the engine
    await reconcileBankTransactions(userId, connectionId, charges)

    // Update last sync time
    await db.update(bankConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(bankConnections.id, connectionId))

    revalidatePath("/subscriptions")
    return { success: true, count: charges.length }
  } catch (error) {
    console.error("Failed to sync transactions:", error)
    throw new Error("Failed to sync transactions")
  }
}

export async function getUnmatchedTransactions() {
  const userId = await requireUserId()
  return await db.query.bankTransactions.findMany({
    where: and(
      eq(bankTransactions.userId, userId),
      eq(bankTransactions.isStealthSubscription, true)
    ),
  })
}
