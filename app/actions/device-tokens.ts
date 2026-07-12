"use server"

import { randomBytes, randomUUID, createHash } from "crypto"
import { db } from "@/lib/db"
import { deviceTokens } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId as getUserId } from "@/lib/session"

export async function getDeviceTokens() {
  const userId = await getUserId()
  return db
    .select({
      id: deviceTokens.id,
      label: deviceTokens.label,
      tokenPrefix: deviceTokens.tokenPrefix,
      lastUsedAt: deviceTokens.lastUsedAt,
      createdAt: deviceTokens.createdAt,
    })
    .from(deviceTokens)
    .where(eq(deviceTokens.userId, userId))
    .orderBy(desc(deviceTokens.createdAt))
}

export async function createDeviceToken(label: string) {
  const userId = await getUserId()
  const token = `pt_${randomBytes(24).toString("hex")}`
  const tokenHash = createHash("sha256").update(token).digest("hex")
  const tokenPrefix = token.slice(0, 12)
  await db.insert(deviceTokens).values({
    id: randomUUID(),
    userId,
    tokenHash,
    tokenPrefix,
    label: label.trim() || "Chrome extension",
  })
  revalidatePath("/settings")
  return token
}

export async function revokeDeviceToken(id: string) {
  const userId = await getUserId()
  await db
    .delete(deviceTokens)
    .where(and(eq(deviceTokens.id, id), eq(deviceTokens.userId, userId)))
  revalidatePath("/settings")
}
