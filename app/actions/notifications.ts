"use server"

import { db } from "@/lib/db"
import { notificationPreferences } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"

export async function getNotificationPreferences() {
  const userId = await requireUserId()

  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1)

  if (!row) {
    return {
      renewalAlertsEnabled: true,
      renewalAlertDaysBefore: 3,
    }
  }

  return {
    id: row.id,
    renewalAlertsEnabled: row.renewalAlertsEnabled,
    renewalAlertDaysBefore: row.renewalAlertDaysBefore,
  }
}

export async function updateNotificationPreferences(prefs: {
  renewalAlertsEnabled: boolean
  renewalAlertDaysBefore: number
}) {
  const userId = await requireUserId()

  await db
    .insert(notificationPreferences)
    .values({
      userId,
      renewalAlertsEnabled: prefs.renewalAlertsEnabled,
      renewalAlertDaysBefore: prefs.renewalAlertDaysBefore,
    })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: {
        renewalAlertsEnabled: prefs.renewalAlertsEnabled,
        renewalAlertDaysBefore: prefs.renewalAlertDaysBefore,
        updatedAt: new Date(),
      },
    })

  revalidatePath("/dashboard/settings")
}
