'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    step: 'Step 01',
    kicker: 'Connect',
    title: 'One click. Every source linked.',
    body: 'Install the platform, connect Gmail and your SaaS portals. Read-only access, encrypted end to end. No forwarding rules, no IMAP passwords.',
    colorStyle: 'from-ochre/30 to-transparent',
    iconColor: 'text-ochre',
  },
  {
    step: 'Step 02',
    kicker: 'Detect',
    title: 'AI finds what you would miss.',
    body: 'Papertrail scans silently in the background, recognizing invoices in 26 languages and every layout — attachments, links, and portal-only PDFs.',
    colorStyle: 'from-slate-accent/30 to-transparent',
    iconColor: 'text-slate-accent',
  },
  {
    step: 'Step 03',
    kicker: 'Deliver',
    title: 'One folder. Accountant-ready.',
    body: 'Renamed, categorized, and exported monthly to Drive, Dropbox, or straight to your bookkeeper — with a CSV summary they will actually thank you for.',
    colorStyle: 'from-primary/20 to-transparent',
    iconColor: 'text-primary',
  },
]

export function Steps() {
  return (
    <section id="how-it-works" aria-label="How Papertrail works" className="relative overflow-hidden border-b border-border bg-background py-24 md:py-32">
      {/* Subtle background ambient glows */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-ochre/10 blur-[120px]" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-16 md:text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">How it works</h2>
          <p className="mt-4 text-muted-foreground md:mx-auto md:max-w-2xl md:text-lg">
            Set it up once, and never think about hunting for a receipt again.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((s, i) => (
            <motion.article
              key={s.step}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.4)] md:min-h-96 md:p-10"
            >
              {/* Glowing top inset gradient */}
              <div className={`absolute inset-x-0 -top-px h-32 bg-gradient-to-b ${s.colorStyle} opacity-50 transition-opacity duration-500 group-hover:opacity-100`} />
              
              <div className="relative z-10 flex items-start justify-between">
                <span className={`inline-flex items-center justify-center rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md ${s.iconColor}`}>
                  {s.step}
                </span>
                <p className="font-mono text-[10px] font-medium tracking-widest text-muted-foreground uppercase opacity-80 md:text-xs">
                  {s.kicker}
                </p>
              </div>
              
              <div className="relative z-10 mt-12">
                <h3 className="text-2xl leading-tight font-bold tracking-tight text-foreground text-balance md:text-3xl">
                  {s.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {s.body}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
