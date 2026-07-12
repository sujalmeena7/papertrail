'use client'

import { motion } from 'framer-motion'

export function Footer() {
  return (
    <footer className="overflow-hidden bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-5 pt-16 md:px-8 md:pt-24">
        {/* Final CTA */}
        <div className="flex flex-col items-start gap-8 border-b border-background/15 pb-16 md:flex-row md:items-end md:justify-between md:pb-20">
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl text-3xl leading-tight font-bold tracking-tight text-balance md:text-6xl"
          >
            Stop chasing receipts.
            <br />
            <span className="text-primary">Start closing your books.</span>
          </motion.h2>
          <a
            href="#pricing"
            className="group flex shrink-0 items-center gap-3 bg-primary px-8 py-4 text-sm font-bold tracking-wide text-primary-foreground uppercase transition-colors hover:bg-background hover:text-foreground"
          >
            Install Papertrail
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </a>
        </div>

        {/* Link columns */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-4 md:py-16">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold tracking-tight uppercase">
              <span className="flex h-5 w-5 items-center justify-center bg-background">
                <span className="h-1.5 w-1.5 bg-primary" aria-hidden="true" />
              </span>
              Papertrail&reg;
            </p>
            <p className="mt-4 max-w-56 text-xs leading-relaxed text-background/60">
              Every receipt. Found. Filed. Forgotten. Built for freelancers, agencies, and the
              accountants who love them.
            </p>
          </div>
          {[
            { title: 'Product', links: ['How it works', 'Sources', 'Pricing', 'Changelog'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'DPA'] },
          ].map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="font-mono text-[10px] tracking-widest text-background/50 uppercase">
                {col.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-background/80 transition-colors hover:text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-background/15 py-6 font-mono text-[10px] tracking-widest text-background/50 uppercase">
          <span>&copy; 2026 Papertrail Inc.</span>
          <span>Made for tax season</span>
        </div>

        {/* Giant outline wordmark */}
        <div aria-hidden="true" className="pointer-events-none select-none">
          <motion.p
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
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
