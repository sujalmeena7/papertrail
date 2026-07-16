'use client'

import { motion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const
const CONTACT = 'meenasujal60@gmail.com'

type FooterLink = { label: string; href: string; external?: boolean }

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Sources', href: '/#sources' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
      { label: 'Contact', href: `mailto:${CONTACT}`, external: true },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-foreground text-background">
      {/* soft glow accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-primary/20 blur-[140px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 pt-16 md:px-8 md:pt-24">
        {/* Final CTA */}
        <div className="flex flex-col items-start gap-8 border-b border-background/15 pb-16 md:flex-row md:items-end md:justify-between md:pb-20">
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: EASE }}
            className="max-w-2xl text-3xl leading-tight font-bold tracking-tight text-balance md:text-6xl"
          >
            Stop chasing receipts.
            <br />
            <span className="text-primary">Start closing your books.</span>
          </motion.h2>
          <a
            href="/#pricing"
            className="group flex shrink-0 items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-bold tracking-wide text-primary-foreground uppercase transition-all hover:bg-background hover:text-foreground"
          >
            Install Papertrail
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </a>
        </div>

        {/* Brand + link columns */}
        <div className="grid gap-12 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
          <div className="max-w-sm">
            <p className="flex items-center gap-2 text-sm font-bold tracking-tight uppercase">
              <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-background">
                <span className="h-1.5 w-1.5 rounded-[2px] bg-primary" aria-hidden="true" />
              </span>
              Papertrail&reg;
            </p>
            <p className="mt-4 text-sm leading-relaxed text-background/60">
              Every receipt. Found. Filed. Forgotten. Built for freelancers, agencies, and the
              accountants who love them.
            </p>
            <a
              href={`mailto:${CONTACT}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-background/80 transition-colors hover:text-primary"
            >
              <span className="h-px w-6 bg-current" aria-hidden="true" />
              {CONTACT}
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="font-mono text-[10px] tracking-widest text-background/50 uppercase">
                {col.title}
              </h3>
              <ul className="mt-5 flex flex-col gap-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="group inline-flex items-center gap-2 text-sm text-background/80 transition-colors hover:text-primary"
                    >
                      <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-4" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-background/15 py-6 font-mono text-[10px] tracking-widest text-background/50 uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; 2026 Papertrail Inc.</span>
          <span className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-primary" aria-hidden="true" />
            Bank-grade encryption &middot; Made for tax season
          </span>
        </div>

        {/* Giant outline wordmark */}
        <div aria-hidden="true" className="pointer-events-none select-none">
          <motion.p
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 1, ease: EASE }}
            className="translate-y-[0.18em] text-center text-[15.5vw] leading-none font-bold tracking-[-0.04em] whitespace-nowrap uppercase"
            style={{ WebkitTextStroke: '1px var(--border)', color: 'transparent' }}
          >
            Papertrail
          </motion.p>
        </div>
      </div>
    </footer>
  )
}
