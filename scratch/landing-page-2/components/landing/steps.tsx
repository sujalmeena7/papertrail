'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    step: 'Step 01',
    kicker: 'Connect',
    title: 'One click. Every source linked.',
    body: 'Install the extension, connect Gmail and your SaaS portals. Read-only access, encrypted end to end. No forwarding rules, no IMAP passwords.',
    className: 'bg-ochre text-ochre-foreground',
  },
  {
    step: 'Step 02',
    kicker: 'Detect',
    title: 'AI finds what you would miss.',
    body: 'Papertrail scans silently in the background, recognizing invoices in 26 languages and every layout — attachments, links, and portal-only PDFs.',
    className: 'bg-slate-accent text-slate-accent-foreground',
  },
  {
    step: 'Step 03',
    kicker: 'Deliver',
    title: 'One folder. Accountant-ready.',
    body: 'Renamed, categorized, and exported monthly to Drive, Dropbox, or straight to your bookkeeper — with a CSV summary they will actually thank you for.',
    className: 'bg-primary text-primary-foreground',
  },
]

export function Steps() {
  return (
    <section id="how-it-works" aria-label="How Papertrail works" className="border-b border-border">
      <div className="grid md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.article
            key={s.step}
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex min-h-72 flex-col justify-between p-8 md:min-h-96 md:p-10 ${s.className}`}
          >
            <div className="flex items-start justify-between">
              <p className="font-mono text-[10px] tracking-widest uppercase opacity-80 md:text-xs">
                {s.kicker}
              </p>
              <p
                className="font-mono text-[10px] tracking-widest uppercase opacity-80 [writing-mode:vertical-rl] md:text-xs"
                aria-hidden="true"
              >
                {s.step}
              </p>
            </div>
            <div>
              <h3 className="max-w-xs text-2xl leading-tight font-bold tracking-tight text-balance md:text-3xl">
                {s.title}
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-relaxed opacity-90 md:text-base">
                {s.body}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
