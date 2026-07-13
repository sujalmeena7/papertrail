"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PRO_PRICE } from "@/lib/billing/pricing"

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (...args: unknown[]) => void) => void
    }
  }
}

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js"

function loadCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SCRIPT_SRC}"]`
    )
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("Failed to load checkout")))
      return
    }
    const script = document.createElement("script")
    script.src = CHECKOUT_SCRIPT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load checkout"))
    document.body.appendChild(script)
  })
}

export function UpgradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      await loadCheckoutScript()

      const res = await fetch("/api/billing/create-subscription", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.subscriptionId) {
        throw new Error(data.error || "Failed to start checkout")
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!keyId) {
        throw new Error("Billing is not configured")
      }

      const razorpay = new window.Razorpay({
        key: keyId,
        subscription_id: data.subscriptionId,
        name: "PaperTrail",
        description: "PaperTrail Pro — monthly subscription",
        theme: { color: "#5469d4" },
        modal: {
          ondismiss: () => setIsLoading(false),
        },
        handler: () => {
          toast.success("Payment received — your account will upgrade shortly")
          onOpenChange(false)
          router.refresh()
        },
      })

      razorpay.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.")
        setIsLoading(false)
      })

      razorpay.open()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start checkout")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to PaperTrail Pro</DialogTitle>
          <DialogDescription>
            Unlock every money leak, one-click cancel links, renewal alerts, the full
            weekly digest, bank-linked stealth detection, and CSV export.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 py-4">
          <span className="text-2xl font-semibold">{PRO_PRICE.usdPerMonth}</span>
          <span className="text-xs text-muted-foreground">{PRO_PRICE.inrNote}</span>
        </div>
        <DialogFooter>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Opening checkout..." : "Continue to checkout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
