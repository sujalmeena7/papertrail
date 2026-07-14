import { getDeviceTokens } from "@/app/actions/device-tokens"
import { DeviceTokensCard } from "@/components/device-tokens-card"
import { GmailCard } from "@/components/gmail-card"
import { NotificationPreferencesCard } from "@/components/notification-preferences-card"
import { db } from "@/lib/db"
import { gmailConnections } from "@/lib/db/schema"
import { isGmailConfigured } from "@/lib/pipeline/sources/gmail"
import { getSession } from "@/lib/session"
import { getUserPlan } from "@/lib/billing/plan"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { getBankConnections } from "@/app/actions/bank"
import { BankConnectionCard } from "@/components/bank-connection-card"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")

  const [connection] = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.userId, session.user.id))
    .limit(1)

  const tokens = await getDeviceTokens()
  const bankConns = await getBankConnections()
  const plan = await getUserPlan(session.user.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Connections and capture devices.
        </p>
      </div>
      <GmailCard configured={isGmailConfigured()} connection={connection ?? null} />
      <BankConnectionCard connections={bankConns} plan={plan} />
      <NotificationPreferencesCard />
      <DeviceTokensCard tokens={tokens} />
    </div>
  )
}
