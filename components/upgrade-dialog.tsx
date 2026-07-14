"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Loader2, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PRO_PRICE, PLANS } from "@/lib/billing/pricing"

const PRO_FEATURES = PLANS.find((plan) => plan.tier === "pro")?.features ?? []

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
      <DialogContent className="gap-5 overflow-visible sm:max-w-md">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 opacity-50 blur-xl"
        />
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <Sparkles className="size-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <DialogTitle className="text-lg">Upgrade to PaperTrail Pro</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Unlock every PaperTrail Pro feature
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2.5">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center gap-1 rounded-xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent py-5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{PRO_PRICE.usd}</span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
          <span className="text-xs text-muted-foreground">{PRO_PRICE.inrNote}</span>
        </div>

        <DialogFooter className="-mx-0 -mb-0 flex-col gap-2 border-t-0 bg-transparent p-0 sm:flex-col">
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isLoading ? "Opening checkout..." : "Continue to checkout"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Cancel anytime · Secure checkout via Razorpay
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
