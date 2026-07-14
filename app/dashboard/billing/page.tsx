import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getBilling } from "@/app/actions/billing"
import { BillingManager } from "@/components/billing/billing-manager"

export default async function BillingPage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")

  const billing = await getBilling()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your plan and subscription.
        </p>
      </div>
      <BillingManager initial={billing} />
    </div>
  )
}
