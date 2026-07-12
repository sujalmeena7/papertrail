'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type Receipt = {
  id: number
  vendor: string
  amount: string
  source: string
  category: string
}

const receiptPool: Omit<Receipt, 'id'>[] = [
  { vendor: 'Amazon Web Services', amount: '$482.16', source: 'Portal', category: 'Infrastructure' },
  { vendor: 'OpenAI', amount: '$120.00', source: 'Portal', category: 'AI Tools' },
  { vendor: 'Stripe', amount: '$64.90', source: 'Gmail', category: 'Payments' },
  { vendor: 'Vercel', amount: '$20.00', source: 'Portal', category: 'Hosting' },
  { vendor: 'Figma', amount: '$45.00', source: 'Gmail', category: 'Design' },
  { vendor: 'Notion Labs', amount: '$96.00', source: 'Gmail', category: 'Productivity' },
  { vendor: 'Google Cloud', amount: '$213.44', source: 'Portal', category: 'Infrastructure' },
  { vendor: 'Linear', amount: '$32.00', source: 'Gmail', category: 'Productivity' },
  { vendor: 'Cloudflare', amount: '$25.00', source: 'Portal', category: 'Infrastructure' },
  { vendor: 'Adobe', amount: '$59.99', source: 'Gmail', category: 'Design' },
]

export function DetectionFeed() {
  const [receipts, setReceipts] = useState<Receipt[]>([])

  useEffect(() => {
    let counter = 0
    // Seed initial rows
    setReceipts(
      receiptPool.slice(0, 4).map((r, i) => ({ ...r, id: i })),
    )
    counter = 4

    const interval = setInterval(() => {
      setReceipts((prev) => {
        const next = { ...receiptPool[counter % receiptPool.length], id: counter }
        counter++
        return [next, ...prev].slice(0, 5)
      })
    }, 2200)

    return () => clearInterval(interval)
  }, [])

  return (
    <section aria-label="Live receipt detection demo" className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-2 md:items-center md:gap-16 md:px-8 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-mono text-[10px] tracking-widest text-primary uppercase md:text-xs">
            Live &mdash; while you work
          </p>
          <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-balance md:text-5xl">
            It runs while you don&apos;t even think about it.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            No dashboards to babysit. No emails to forward. Papertrail watches your inbox and
            portals in the background, stamps every invoice with vendor, amount, and category
            &mdash; and files it before you knew it existed.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {['Detects 26 languages and every invoice layout', 'Read-only OAuth — we can never send or delete', 'Duplicate detection across all sources'].map(
              (item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden="true" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </motion.div>

        {/* Live feed panel */}
        <div className="border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Papertrail &mdash; Detection feed
            </span>
            <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-primary uppercase">
              <motion.span
                className="h-2 w-2 rounded-full bg-primary"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                aria-hidden="true"
              />
              Scanning
            </span>
          </div>
          <div className="flex min-h-96 flex-col gap-px overflow-hidden bg-border p-px">
            <AnimatePresence initial={false}>
              {receipts.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: -24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-between gap-4 bg-background px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.vendor}</p>
                    <p className="mt-0.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                      {r.source} &middot; {r.category}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold tracking-tight">{r.amount}</span>
                    <span className="bg-primary px-2 py-1 font-mono text-[9px] tracking-widest text-primary-foreground uppercase">
                      Filed
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
