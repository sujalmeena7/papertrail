"use client"

import { addManualReceipt } from "@/app/actions/receipts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

const CATEGORIES = [
  { value: "software", label: "Software" },
  { value: "hosting", label: "Hosting" },
  { value: "advertising", label: "Advertising" },
  { value: "travel", label: "Travel" },
  { value: "office", label: "Office" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
]

export function AddReceiptDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [vendor, setVendor] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [category, setCategory] = useState("software")

  const reset = () => {
    setVendor("")
    setAmount("")
    setDate("")
    setInvoiceNumber("")
    setCategory("software")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amountCents = Math.round(Number.parseFloat(amount) * 100)
    if (!vendor.trim() || !Number.isFinite(amountCents) || amountCents <= 0) {
      toast.error("Enter a vendor and a valid amount")
      return
    }
    if (!date) {
      toast.error("Pick a receipt date")
      return
    }
    startTransition(async () => {
      try {
        await addManualReceipt({
          vendor,
          amountCents,
          currency: "USD",
          receiptDate: date,
          invoiceNumber: invoiceNumber || undefined,
          category,
        })
        toast.success("Receipt added")
        reset()
        setOpen(false)
        router.refresh()
      } catch {
        toast.error("Failed to add receipt")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="size-4" aria-hidden="true" />
        Add
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add receipt manually</DialogTitle>
          <DialogDescription>
            File a receipt that didn&apos;t arrive by email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Input
              id="vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Adobe"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="29.99"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoice">Invoice # (optional)</Label>
              <Input
                id="invoice"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-1234"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value ?? "software")}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Add receipt"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
