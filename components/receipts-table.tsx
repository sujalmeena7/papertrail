"use client"

import {
  deleteReceipt,
  deleteReceipts,
  getReceiptsPaginated,
} from "@/app/actions/receipts"
import { AddReceiptDialog } from "@/components/add-receipt-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Receipt } from "@/lib/db/schema"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Inbox,
  Loader2,
  Search,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import useSWR from "swr"

const PAGE_SIZE = 20
const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "software", label: "Software" },
  { value: "hosting", label: "Hosting" },
  { value: "advertising", label: "Advertising" },
  { value: "travel", label: "Travel" },
  { value: "office", label: "Office" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
]

const SOURCE_LABELS: Record<string, string> = {
  fixture: "Email",
  gmail: "Gmail",
  portal: "Portal",
  upload: "Manual",
}

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

const swrFetcher = ([page, query, category]: [number, string, string]) =>
  getReceiptsPaginated(page, query || undefined, category !== "all" ? category : undefined)

export function ReceiptsTable({
  initialReceipts,
}: {
  initialReceipts: Receipt[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const [isPending, startTransition] = useTransition()
  const tableRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(0)
      setSelected(new Set())
      setFocusedIdx(-1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Reset page when category changes
  useEffect(() => {
    setPage(0)
    setSelected(new Set())
  }, [category])

  const { data, isLoading, mutate } = useSWR(
    [page, debouncedQuery, category],
    swrFetcher,
    {
      keepPreviousData: true,
    },
  )

  const receipts = data?.receipts ?? initialReceipts
  const total = data?.total ?? initialReceipts.length
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE))

  const allSelected =
    receipts.length > 0 && receipts.every((r) => selected.has(r.id))
  const someSelected = selected.size > 0

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(receipts.map((r) => r.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleBulkDelete = () => {
    if (!someSelected) return
    startTransition(async () => {
      try {
        const ids = Array.from(selected)
        await deleteReceipts(ids)
        toast.success(`Deleted ${ids.length} receipt${ids.length === 1 ? "" : "s"}`)
        setSelected(new Set())
        setFocusedIdx(-1)
        mutate()
        router.refresh()
      } catch {
        toast.error("Failed to delete selected receipts")
      }
    })
  }

  const handleSingleDelete = (id: string, vendor: string) => {
    startTransition(async () => {
      try {
        await deleteReceipt(id)
        toast.success(`Deleted receipt from ${vendor}`)
        setSelected((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        mutate()
        router.refresh()
      } catch {
        toast.error("Failed to delete receipt")
      }
    })
  }

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (receipts.length === 0) return

      // Up/down arrows move focus between rows
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setFocusedIdx((prev) => Math.min(prev + 1, receipts.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setFocusedIdx((prev) => Math.max(prev - 1, -1))
      } else if (e.key === " " && focusedIdx >= 0) {
        e.preventDefault()
        toggleSelect(receipts[focusedIdx].id)
      } else if (e.key === "Delete" && someSelected) {
        e.preventDefault()
        handleBulkDelete()
      }
    },
    [receipts, focusedIdx, someSelected],
  )

  const firstPage = page === 0
  const lastPage = page >= totalPages - 1

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendor, invoice #, or subject…"
            className="pl-9"
            aria-label="Search receipts"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={category}
            onValueChange={(value) => setCategory(value ?? "all")}
          >
            <SelectTrigger className="w-44" aria-label="Filter by category">
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
          <AddReceiptDialog />
          <a
            href="/api/export/csv"
            download
            className={buttonVariants({ variant: "outline" })}
          >
            <Download className="size-4" aria-hidden="true" />
            CSV
          </a>
        </div>
      </div>

      {/* Bulk actions bar */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg border bg-accent/30 px-4 py-2 text-sm">
          <span className="font-medium tabular-nums">{selected.size} selected</span>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleBulkDelete}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-3.5" aria-hidden="true" />
            )}
            Delete selected
          </Button>
        </div>
      )}

      {/* Table / Empty state */}
      {total === 0 ? (
        <Card className="premium-card premium-glow flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted">
            {debouncedQuery || category !== "all" ? (
              <Search className="size-6 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
            )}
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              {debouncedQuery || category !== "all"
                ? "No receipts match your filters"
                : "No receipts yet"}
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {debouncedQuery || category !== "all"
                ? "Try a different search term or category filter."
                : "Run an inbox scan above to automatically find receipts, or add one manually with the Add receipt button."}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="premium-card premium-glow overflow-hidden py-0" ref={tableRef} onKeyDown={handleKeyDown}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Loading receipts…
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((r, idx) => (
                    <TableRow
                      key={r.id}
                      data-selected={selected.has(r.id) || undefined}
                      className={
                        (selected.has(r.id)
                          ? "bg-accent/40"
                          : "") +
                        (focusedIdx === idx
                          ? " outline-none ring-1 ring-inset ring-ring"
                          : "")
                      }
                      tabIndex={0}
                      onFocus={() => setFocusedIdx(idx)}
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest("button") || target.closest('[role="checkbox"]')) return
                        toggleSelect(r.id)
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selected.has(r.id)}
                          onCheckedChange={() => toggleSelect(r.id)}
                          aria-label={`Select ${r.vendor}`}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {formatDate(r.receiptDate)}
                      </TableCell>
                      <TableCell className="font-medium">{r.vendor}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {r.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.invoiceNumber ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {SOURCE_LABELS[r.source] ?? r.source}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatAmount(r.amountCents, r.currency)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSingleDelete(r.id, r.vendor)
                          }}
                          aria-label={`Delete receipt from ${r.vendor}`}
                        >
                          <Trash2
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground tabular-nums">
              {total} receipt{total === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={firstPage}
                onClick={() => {
                  setPage((p) => Math.max(0, p - 1))
                  setSelected(new Set())
                  setFocusedIdx(-1)
                }}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <span className="text-xs tabular-nums text-muted-foreground min-w-[4ch] text-center">
                {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={lastPage}
                onClick={() => {
                  setPage((p) => p + 1)
                  setSelected(new Set())
                  setFocusedIdx(-1)
                }}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
