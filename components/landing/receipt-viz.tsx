'use client'

import { motion } from 'framer-motion'

const columns = [
  { label: 'Gmail', found: 92, missed: 64 },
  { label: 'AWS', found: 74, missed: 52 },
  { label: 'Stripe', found: 66, missed: 58 },
  { label: 'OpenAI', found: 58, missed: 44 },
  { label: 'Vercel', found: 50, missed: 40 },
  { label: 'Notion', found: 42, missed: 48 },
  { label: 'Figma', found: 70, missed: 36 },
]

export function ReceiptViz() {
  return (
    <section aria-label="What Papertrail uncovers across your billing sources" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-primary uppercase md:text-xs">
              Papertrail &mdash; Report 01
            </p>
            <h2 className="mt-3 max-w-md text-2xl font-bold tracking-tight text-balance md:text-4xl">
              What you overlook. What we uncover.
            </h2>
          </div>
          <p className="hidden max-w-52 font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground uppercase md:block">
            Figures illustrate typical receipt recovery across connected sources
          </p>
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-6">
          {columns.map((col, i) => (
            <div key={col.label} className="flex flex-col items-center gap-3">
              {/* Missed (blurred, fading up) */}
              <div className="flex h-32 w-full items-end justify-center md:h-44">
                <motion.div
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.9, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    height: `${col.missed}%`,
                    transformOrigin: 'bottom',
                    background: 'linear-gradient(to top, var(--foreground), transparent)',
                  }}
                  className="w-6 opacity-30 blur-[6px] md:w-12"
                  aria-hidden="true"
                />
              </div>

              <span className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase md:text-[11px]">
                {col.label}
              </span>

              {/* Found (red, fading down) */}
              <div className="flex h-32 w-full items-start justify-center md:h-44">
                <motion.div
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.9, delay: 0.3 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    height: `${col.found}%`,
                    transformOrigin: 'top',
                    background: 'linear-gradient(to bottom, var(--primary), transparent)',
                  }}
                  className="w-6 blur-[3px] md:w-12"
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground uppercase md:text-xs">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 bg-foreground/40 blur-[1px]" aria-hidden="true" />
            What teams overlook
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 bg-primary" aria-hidden="true" />
            What Papertrail recovers
          </span>
        </div>
      </div>
    </section>
  )
}
