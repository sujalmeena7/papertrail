import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSubscriptions, getSubscriptionAlerts, getSavingsSummary } from "@/app/actions/subscriptions"
import { getReceiptsPaginated } from "@/app/actions/receipts"
import { SubscriptionsTable } from "@/components/subscriptions/subscriptions-table"
import { AlertsList } from "@/components/subscriptions/alerts-list"
import { SavingsCalculator } from "@/components/subscriptions/savings-calculator"
import { SpendTrendChart } from "@/components/subscriptions/spend-trend-chart"
import { ReceiptsTable } from "@/components/receipts-table"
import { db } from "@/lib/db"
import { subscriptionUsage, bankTransactions } from "@/lib/db/schema"
import { StealthSubscriptions } from "@/components/subscriptions/stealth-subscriptions"
import { UsageTracker } from "@/components/subscriptions/usage-tracker"
import { getUserPlan } from "@/lib/billing/plan"
import { eq, and, sql } from "drizzle-orm"
import {
  Zap,
  BellRing,
  TrendingDown,
  Activity,
  Eye,
  Receipt,
  AlertTriangle,
  DollarSign,
} from "lucide-react"

function monthlyEquivalent(sub: any): number {
  if (sub.cadence === "annual") return sub.currentAmountCents / 12
  if (sub.cadence === "quarterly") return sub.currentAmountCents / 3
  return sub.currentAmountCents
}

export default async function SubscriptionsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/sign-in")

  const plan = await getUserPlan(session.user.id)

  // Stealth-subscription detection is Pro-only. Free users only ever get a
  // count (an upgrade hook) — the actual merchant/transaction detail is never
  // fetched, so it can't leak into the client bundle via props.
  const stealthWhere = and(
    eq(bankTransactions.userId, session.user.id),
    eq(bankTransactions.isStealthSubscription, true)
  )
  const stealthQuery =
    plan === "pro"
      ? db.query.bankTransactions
          .findMany({ where: stealthWhere })
          .then((transactions) => ({ locked: false as const, transactions, count: transactions.length }))
      : db
          .select({ count: sql<number>`count(*)` })
          .from(bankTransactions)
          .where(stealthWhere)
          .then(([row]) => ({
            locked: true as const,
            transactions: [] as (typeof bankTransactions.$inferSelect)[],
            count: Number(row?.count ?? 0),
          }))

  const [subscriptions, alerts, paginated, usages, savings, stealth] = await Promise.all([
    getSubscriptions(),
    getSubscriptionAlerts(),
    getReceiptsPaginated(0),
    db.query.subscriptionUsage.findMany({ where: eq(subscriptionUsage.userId, session.user.id) }),
    getSavingsSummary(),
    stealthQuery,
  ])

  const activeCount = subscriptions.filter((s) => s.status === "active").length
  const alertsCount = alerts.length
  const totalMonthly = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + monthlyEquivalent(s), 0)
  const formattedMonthly = (totalMonthly / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Manage your recurring charges, track spend, and eliminate waste.
        </p>
      </div>

      {/* Spend trend */}
      {activeCount > 0 && <SpendTrendChart subscriptions={subscriptions} />}

      {/* Tabs */}
      <Tabs
        defaultValue="active"
        className="flex flex-col gap-6 w-full"
      >
        {/* Horizontal Nav */}
        <div className="w-full overflow-x-auto pb-2 -mb-2 scrollbar-none">
          <TabsList className="inline-flex h-auto items-center justify-start gap-1 rounded-full border border-border/40 bg-card/30 backdrop-blur-md p-1 shadow-sm">
            <TabsTrigger
              value="active"
              className="group rounded-full px-4 py-2 font-medium text-sm text-muted-foreground data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.2)] transition-all gap-2 hover:text-foreground"
            >
              <Zap className="size-4 opacity-70 group-data-[state=active]:opacity-100" />
              Active
              {activeCount > 0 && (
                <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] font-bold text-primary">
                  {activeCount}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="alerts"
              className="group rounded-full px-4 py-2 font-medium text-sm text-muted-foreground data-[state=active]:bg-destructive/15 data-[state=active]:text-destructive data-[state=active]:shadow-[inset_0_0_0_1px_oklch(0.6_0.2_25/0.2)] transition-all gap-2 hover:text-foreground"
            >
              <BellRing className="size-4 opacity-70 group-data-[state=active]:opacity-100" />
              Alerts
              {alertsCount > 0 && (
                <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive/20 px-1 text-[10px] font-bold text-destructive">
                  {alertsCount}
                </span>
              )}
            </TabsTrigger>

            <div className="mx-2 h-4 w-px bg-border/50" />

            <TabsTrigger
              value="savings"
              className="group rounded-full px-4 py-2 font-medium text-sm text-muted-foreground data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-500 data-[state=active]:shadow-[inset_0_0_0_1px_oklch(0.72_0.17_160/0.2)] transition-all gap-2 hover:text-foreground"
            >
              <TrendingDown className="size-4 opacity-70 group-data-[state=active]:opacity-100" />
              Savings
            </TabsTrigger>

            <TabsTrigger
              value="usage"
              className="group rounded-full px-4 py-2 font-medium text-sm text-muted-foreground data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-500 data-[state=active]:shadow-[inset_0_0_0_1px_oklch(0.67_0.17_240/0.2)] transition-all gap-2 hover:text-foreground"
            >
              <Activity className="size-4 opacity-70 group-data-[state=active]:opacity-100" />
              Usage
            </TabsTrigger>

            <TabsTrigger
              value="bank"
              className="group rounded-full px-4 py-2 font-medium text-sm text-muted-foreground data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-500 data-[state=active]:shadow-[inset_0_0_0_1px_oklch(0.77_0.18_85/0.2)] transition-all gap-2 hover:text-foreground"
            >
              <Eye className="size-4 opacity-70 group-data-[state=active]:opacity-100" />
              Stealth
              {stealth.count > 0 && (
                <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500/20 px-1 text-[10px] font-bold text-amber-500">
                  {stealth.count}
                </span>
              )}
            </TabsTrigger>

            <div className="mx-2 h-4 w-px bg-border/50" />

            <TabsTrigger
              value="all"
              className="group rounded-full px-4 py-2 font-medium text-sm text-muted-foreground data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.2)] transition-all gap-2 hover:text-foreground"
            >
              <Receipt className="size-4 opacity-70 group-data-[state=active]:opacity-100" />
              Receipts
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content area */}
        <div className="w-full">
          <TabsContent value="active" className="mt-0">
            <SubscriptionsTable initialSubscriptions={subscriptions} plan={plan} />
          </TabsContent>
          <TabsContent value="alerts" className="mt-0">
            <AlertsList initialAlerts={alerts} />
          </TabsContent>
          <TabsContent value="savings" className="mt-0">
            <SavingsCalculator
              plan={savings.plan}
              totalSavings={savings.totalSavings}
              lockedSavings={savings.lockedSavings}
              candidates={savings.candidates}
              lockedCount={savings.lockedCount}
            />
          </TabsContent>
          <TabsContent value="usage" className="mt-0">
            <UsageTracker
              subscriptions={subscriptions.filter((s) => s.status === "active")}
              usages={usages}
            />
          </TabsContent>
          <TabsContent value="bank" className="mt-0">
            <StealthSubscriptions
              transactions={stealth.transactions}
              locked={stealth.locked}
              lockedCount={stealth.count}
            />
          </TabsContent>
          <TabsContent value="all" className="mt-0">
            <ReceiptsTable initialReceipts={paginated.receipts} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
