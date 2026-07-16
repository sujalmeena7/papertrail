"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { LockedOverlay } from "@/components/locked-overlay"
import type { Subscription } from "@/lib/db/schema"
import type { Plan } from "@/lib/billing/plan"
import {
  getPlaybook,
  type CancellationDifficulty,
} from "@/lib/subscriptions/cancellation-playbooks"
import { getCancelUrl } from "@/lib/subscriptions/vendors"
import { cancelSubscription } from "@/app/actions/subscriptions"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Phone,
  PiggyBank,
  ShieldQuestion,
} from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

const DIFFICULTY_META: Record<
  CancellationDifficulty,
  {
    label: string
    segments: number
    badgeClass: string
    barClass: string
    blurb: string
  }
> = {
  easy: {
    label: "Easy",
    segments: 1,
    badgeClass: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/25",
    barClass: "bg-emerald-500",
    blurb: "A couple of clicks — no runaround.",
  },
  medium: {
    label: "Medium",
    segments: 2,
    badgeClass: "bg-amber-500/15 text-amber-500 ring-amber-500/25",
    barClass: "bg-amber-500",
    blurb: "Self-serve, but the option is buried or they'll try to keep you.",
  },
  hard: {
    label: "Hard",
    segments: 3,
    badgeClass: "bg-destructive/15 text-destructive ring-destructive/25",
    barClass: "bg-destructive",
    blurb: "Expect friction — hidden flows, fees, or a phone call.",
  },
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-violet-600",
  "from-sky-500 to-blue-600",
]

function vendorGradient(name: string): string {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length]
}

function vendorInitials(name: string): string {
  return name.substring(0, 2).toUpperCase()
}

function monthlyEquivalent(sub: Subscription): number {
  if (sub.cadence === "annual") return sub.currentAmountCents / 12
  if (sub.cadence === "quarterly") return sub.currentAmountCents / 3
  return sub.currentAmountCents
}

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  })
}

export function CancellationPlaybookDialog({
  subscription,
  plan,
  open,
  onOpenChange,
  onCancelled,
}: {
  subscription: Subscription | null
  plan: Plan
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after the sub is successfully marked cancelled, so the table can drop it. */
  onCancelled?: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()

  if (!subscription) return null

  const isPro = plan === "pro"
  const playbook = getPlaybook(subscription.vendorNormalized)
  const cancelUrl = getCancelUrl(subscription.vendorNormalized)
  const diff = DIFFICULTY_META[playbook.difficulty]
  const monthlySaving = monthlyEquivalent(subscription)
  const annualSaving = monthlySaving * 12

  const handleConfirmCancelled = () => {
    startTransition(async () => {
      try {
        await cancelSubscription(subscription.id)
        onCancelled?.(subscription.id)
        onOpenChange(false)
        toast.success(`Nice — ${subscription.vendorNormalized} cancelled`, {
          description: `You just freed up ${formatAmount(
            monthlySaving,
            subscription.currency
          )}/mo (${formatAmount(annualSaving, subscription.currency)}/yr).`,
        })
      } catch {
        toast.error("Couldn't update the subscription. Please try again.")
      }
    })
  }

  // The actionable core (direct link + numbered steps + confirm button).
  // Pro users see it live; free users see it blurred behind an upgrade CTA.
  const actionableCore = (
    <div className="flex flex-col gap-5">
      {/* Direct cancel link */}
      {cancelUrl ? (
        <a
          href={cancelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full bg-gradient-to-r from-primary to-accent-foreground shadow-md shadow-primary/20 hover:opacity-90"
          )}
        >
          <ExternalLink className="size-4" />
          Open <span className="capitalize">{subscription.vendorNormalized}</span>{" "}
          cancellation page
        </a>
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <ShieldQuestion className="mt-0.5 size-4 shrink-0" />
          <span>
            We don't have a direct cancel link for this vendor yet — follow the
            steps below from their website.
          </span>
        </div>
      )}

      {/* Numbered steps */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Step-by-step
        </p>
        <motion.ol
          className="relative flex flex-col gap-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border/60"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {playbook.steps.map((step, i) => (
            <motion.li
              key={i}
              className="relative flex items-start gap-3"
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-4 ring-background">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed pt-0.5">{step}</span>
            </motion.li>
          ))}
        </motion.ol>
      </div>

      {/* Confirm cancelled */}
      <Button
        variant="outline"
        className="w-full border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-500"
        onClick={handleConfirmCancelled}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        I've cancelled it
      </Button>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[460px]">
        {/* Header band */}
        <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/[0.07] via-transparent to-accent/[0.07] px-6 pb-5 pt-6">
          <DialogHeader className="space-y-0">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
                  vendorGradient(subscription.vendorNormalized)
                )}
              >
                <span className="text-sm font-bold text-white">
                  {vendorInitials(subscription.vendorNormalized)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg capitalize leading-tight">
                  Cancel {subscription.vendorNormalized}
                </DialogTitle>
                <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />~{playbook.estimatedMinutes} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-0.5">
                      {[0, 1, 2].map((s) => (
                        <span
                          key={s}
                          className={cn(
                            "h-1.5 w-4 rounded-full",
                            s < diff.segments ? diff.barClass : "bg-border"
                          )}
                        />
                      ))}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                        diff.badgeClass
                      )}
                    >
                      {diff.label}
                    </span>
                  </span>
                  {playbook.requiresContact && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Phone className="size-3.5" />
                      Contact required
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5 max-h-[65vh]">
          {/* Savings hook */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
              <PiggyBank className="size-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">
                Cancelling frees up{" "}
                <span className="text-emerald-600 dark:text-emerald-500">
                  {formatAmount(annualSaving, subscription.currency)}/yr
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatAmount(monthlySaving, subscription.currency)} every month back in your pocket
              </p>
            </div>
          </div>

          {/* Difficulty blurb — always visible (the teaser) */}
          <p className="text-sm text-muted-foreground">{diff.blurb}</p>

          {/* Retention-trap warning — always visible (the hook) */}
          {playbook.retentionWarning && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                <AlertTriangle className="size-4 text-amber-500" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-500">
                  Retention trap
                </span>
                <span className="text-sm leading-relaxed">
                  {playbook.retentionWarning}
                </span>
              </div>
            </div>
          )}

          {/* Actionable core — Pro live, free blurred */}
          {isPro ? (
            actionableCore
          ) : (
            <LockedOverlay
              title="Unlock the full cancellation guide"
              description="Get the direct cancel link and step-by-step instructions for every subscription."
            >
              {actionableCore}
            </LockedOverlay>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
