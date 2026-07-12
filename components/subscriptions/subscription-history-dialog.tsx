"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getSubscriptionReceipts } from "@/app/actions/subscriptions"
import type { Subscription } from "@/lib/db/schema"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
  })
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function SubscriptionHistoryDialog({
  subscription,
  open,
  onOpenChange,
}: {
  subscription: Subscription | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [receipts, setReceipts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && subscription) {
      setIsLoading(true)
      getSubscriptionReceipts(subscription.vendorNormalized, subscription.currency)
        .then((data) => setReceipts(data))
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [open, subscription])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {subscription?.vendorNormalized} History
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : receipts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No receipts found.
            </p>
          ) : (
            <div className="h-[300px] overflow-y-auto pr-4">
              <div className="flex flex-col gap-4">
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {formatDate(receipt.receiptDate)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {receipt.source}
                      </span>
                    </div>
                    <span className="font-mono text-sm">
                      {formatAmount(receipt.amountCents, receipt.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
