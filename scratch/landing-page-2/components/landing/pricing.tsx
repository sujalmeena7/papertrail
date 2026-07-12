'use client'

import { motion } from 'framer-motion'

const plans = [
  {
    name: 'Solo',
    price: '$15',
    period: '/mo',
    description: 'For freelancers who never want to forward a receipt again.',
    features: [
      '1 Gmail inbox',
      '15 SaaS portals',
      'Monthly Drive / Dropbox export',
      'CSV summary for your accountant',
    ],
    featured: false,
    cta: 'Start free trial',
  },
  {
    name: 'Studio',
    price: '$29',
    period: '/mo',
    description: 'For agencies and small teams with real bookkeeping to feed.',
    features: [
      '3 inboxes, unlimited portals',
      'Multi-entity organization',
      'QuickBooks & Xero sync',
      'Priority extraction queue',
      'Bookkeeper share links',
    ],
    featured: true,
    cta: 'Start free trial',
  },
  {
    name: 'Firm',
    price: '$79',
    period: '/mo',
    description: 'For accountants managing receipts across many clients.',
    features: [
      'Unlimited client workspaces',
      'White-label client portal',
      'Bulk export & audit trail',
      'Dedicated support',
    ],
    featured: false,
    cta: 'Talk to us',
  },
]

export function Pricing() {
  return (
    <section id="pricing" aria-label="Pricing" className="border-b border-border">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <div className="mb-12 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-primary uppercase md:text-xs">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-5xl">
              Cheaper than one hour
              <br />
              of your bookkeeper.
            </h2>
          </div>
          <p className="max-w-xs font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground uppercase md:text-xs">
            14-day free trial &middot; No card required &middot; Cancel anytime
          </p>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-col p-8 md:p-10 ${
                plan.featured ? 'bg-foreground text-background' : 'bg-background'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs tracking-widest uppercase">{plan.name}</h3>
                {plan.featured && (
                  <span className="bg-primary px-2 py-1 font-mono text-[9px] tracking-widest text-primary-foreground uppercase">
                    Most popular
                  </span>
                )}
              </div>
              <p className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
                {plan.price}
                <span
                  className={`text-base font-normal ${
                    plan.featured ? 'text-background/60' : 'text-muted-foreground'
                  }`}
                >
                  {plan.period}
                </span>
              </p>
              <p
                className={`mt-4 text-sm leading-relaxed ${
                  plan.featured ? 'text-background/70' : 'text-muted-foreground'
                }`}
              >
                {plan.description}
              </p>
              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className={`mt-10 flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold tracking-widest uppercase transition-colors ${
                  plan.featured
                    ? 'bg-primary text-primary-foreground hover:bg-background hover:text-foreground'
                    : 'border border-foreground hover:bg-foreground hover:text-background'
                }`}
              >
                {plan.cta}
                <span aria-hidden="true">&rarr;</span>
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
