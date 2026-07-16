"use client"

import { deleteAccount } from "@/app/actions/account"
import { signOut } from "@/lib/auth-client"
import type { Plan } from "@/lib/billing/plan"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  CreditCard,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

// Must match DELETE_CONFIRMATION in app/actions/account.ts (a "use server" file
// can't export a plain constant, so it's duplicated here).
const DELETE_CONFIRMATION = "delete my account"

const ERASED_ITEMS = [
  "All captured receipts and invoices",
  "Every tracked subscription and renewal alert",
  "Connected Gmail and bank accounts",
  "Capture devices, tokens and notification settings",
  "Your profile, login and billing records",
]

export function DeleteAccountCard({ plan }: { plan: Plan }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isPending, startTransition] = useTransition()

  const canDelete =
    confirmText.trim().toLowerCase() === DELETE_CONFIRMATION && !isPending

  const handleDelete = () => {
    if (!canDelete) return
    startTransition(async () => {
      try {
        await deleteAccount(confirmText)
        toast.success("Your account has been permanently deleted")
        await signOut()
        router.push("/")
        router.refresh()
      } catch {
        toast.error("Couldn't delete your account. Please try again.")
      }
    })
  }

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/[0.02] shadow-[0_0_0_1px_theme(colors.destructive/10%),0_1px_2px_theme(colors.destructive/10%)]">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-destructive/80 to-destructive text-destructive-foreground shadow-sm">
              <ShieldAlert className="size-4" aria-hidden="true" />
            </span>
            <CardTitle className="text-base">Danger zone</CardTitle>
          </div>
          <CardDescription className="leading-relaxed">
            Permanently delete your account and all of its data. This cannot be
            undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <Button
            variant="destructive"
            className="shrink-0"
            onClick={() => {
              setConfirmText("")
              setOpen(true)
            }}
          >
            <Trash2 className="size-4" />
            Delete account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={!isPending}
          className="gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          {/* Warning header band */}
          <div className="relative flex flex-col items-center gap-3 border-b border-destructive/15 bg-gradient-to-b from-destructive/[0.07] to-transparent px-6 pt-7 pb-6 text-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive/80 to-destructive text-destructive-foreground shadow-lg shadow-destructive/20 ring-1 ring-inset ring-white/10">
              <AlertTriangle className="size-6" aria-hidden="true" />
            </span>
            <DialogHeader className="items-center gap-1.5">
              <DialogTitle className="text-lg">Delete your account?</DialogTitle>
              <p className="text-sm text-muted-foreground">
                This action is{" "}
                <span className="font-medium text-destructive">permanent</span>{" "}
                and cannot be reversed.
              </p>
            </DialogHeader>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            {/* What gets erased */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                What will be permanently erased
              </p>
              <ul className="flex flex-col gap-2">
                {ERASED_ITEMS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-foreground/90"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Active Pro warning */}
            {plan === "pro" && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5 text-sm">
                <CreditCard className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
                <p className="leading-relaxed text-amber-800 dark:text-amber-200/90">
                  Your <span className="font-semibold">Pro subscription</span>{" "}
                  will be cancelled and access ends immediately. No further
                  charges will be made.
                </p>
              </div>
            )}

            {/* Type to confirm */}
            <div className="flex flex-col gap-2 pt-0.5">
              <label
                htmlFor="delete-confirm"
                className="text-sm text-muted-foreground"
              >
                Type{" "}
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground select-all">
                  {DELETE_CONFIRMATION}
                </span>{" "}
                to confirm
              </label>
              <Input
                id="delete-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDelete()
                }}
                placeholder={DELETE_CONFIRMATION}
                autoComplete="off"
                spellCheck={false}
                disabled={isPending}
                className={cn(
                  "font-mono",
                  confirmText &&
                    !canDelete &&
                    "border-destructive/40 focus-visible:border-destructive/50 focus-visible:ring-destructive/20",
                )}
              />
            </div>
          </div>

          <DialogFooter className="border-destructive/10">
            <DialogClose
              render={<Button variant="outline" disabled={isPending} />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Permanently delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
