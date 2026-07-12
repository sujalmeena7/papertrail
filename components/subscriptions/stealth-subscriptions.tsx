"use client"

import { AlertTriangle, Eye, EyeOff } from "lucide-react"

export function StealthSubscriptions({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-2xl border border-dashed border-border/60">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Eye className="size-7 text-primary" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-base">No stealth subscriptions found</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            We didn't detect any recurring bank charges without a matching email receipt. Link a bank account in Settings to enable this.
          </p>
        </div>
      </div>
    )
  }

  // Group by merchant
  const grouped = transactions.reduce((acc, tx) => {
    if (!acc[tx.merchantName]) acc[tx.merchantName] = []
    acc[tx.merchantName].push(tx)
    return acc
  }, {} as Record<string, any[]>)

  const totalStealth = Object.values(grouped).reduce(
    (sum, txs: any[]) => sum + txs[0].amountCents,
    0
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 px-6 py-5"
        style={{
          background: "radial-gradient(ellipse at top left, oklch(0.77 0.18 85 / 0.08), transparent 60%), oklch(0.17 0.01 260 / 0.5)"
        }}
      >
        <div className="flex items-center gap-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15">
            <EyeOff className="size-7 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">
              {Object.keys(grouped).length} Stealth{" "}
              <span className="text-amber-500">
                Subscription{Object.keys(grouped).length !== 1 ? "s" : ""}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Recurring bank charges with no email receipt —{" "}
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                totalStealth / 100
              )}/mo potentially wasted.
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {Object.keys(grouped).length} Merchant{Object.keys(grouped).length !== 1 ? "s" : ""} Detected
      </p>

      {/* Cards */}
      {Object.entries(grouped).map(([merchant, txs]) => {
        const latest = (txs as any[])[0]
        const amount = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: latest.currency,
        }).format(latest.amountCents / 100)

        return (
          <div
            key={merchant}
            className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-card/60 backdrop-blur-sm px-5 py-4"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertTriangle className="size-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold capitalize text-sm">{merchant}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(txs as any[]).length} charge{(txs as any[]).length !== 1 ? "s" : ""} found · No email receipt matched
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold tabular-nums text-amber-500">{amount}</p>
              <p className="text-xs text-muted-foreground">per charge</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
