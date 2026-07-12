'use client'

import { motion } from 'framer-motion'

const stats = [
  { value: '6.2 hrs', label: 'Saved per month, per business, on receipt chasing' },
  { value: '$1,400', label: 'Average deductions recovered per tax year' },
  { value: '43', label: 'Portals and inboxes monitored automatically' },
  { value: '\u221299%', label: 'Time spent hunting PDFs after installing Papertrail' },
]

export function Stats() {
  return (
    <section aria-label="Papertrail by the numbers" className="border-b border-border">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-2 md:gap-16 md:px-8 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-mono text-[10px] tracking-widest text-primary uppercase md:text-xs">
            The problem, quantified
          </p>
          <h2 className="mt-4 text-3xl leading-tight font-bold tracking-tight text-balance md:text-5xl">
            {'In a world of scattered billing, '}
            <span className="text-primary">Papertrail</span>
            {' returns lost hours to people who shouldn\u2019t be digging through inboxes.'}
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Freelancers and agencies lose an entire working day every month collecting receipts
            for their books. Papertrail automates the chore end to end &mdash; so month-end close
            becomes a non-event.
          </p>
          <a
            href="#pricing"
            className="group mt-8 inline-flex items-center gap-2 border-b-2 border-primary pb-1 text-sm font-semibold tracking-wide uppercase transition-colors hover:text-primary"
          >
            <span className="h-1.5 w-1.5 bg-primary" aria-hidden="true" />
            Start recovering time
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </a>
        </motion.div>

        <dl className="flex flex-col justify-center gap-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="border-b border-border pb-6"
            >
              <dt className="order-2 mt-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase md:text-xs">
                {stat.label}
              </dt>
              <dd className="order-1 text-4xl font-bold tracking-tight md:text-5xl">
                {stat.value}
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  )
}
