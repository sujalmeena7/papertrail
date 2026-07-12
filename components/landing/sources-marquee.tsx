const sources = [
  'Gmail',
  'AWS',
  'OpenAI',
  'Stripe',
  'Vercel',
  'Google Cloud',
  'Notion',
  'Figma',
  'Slack',
  'Anthropic',
  'GitHub',
  'Linear',
  'DigitalOcean',
  'Cloudflare',
  'Adobe',
  'Zoom',
]

export function SourcesMarquee() {
  return (
    <section id="sources" aria-label="Supported billing sources" className="overflow-hidden border-b border-border bg-foreground py-5">
      <div className="animate-marquee flex w-max items-center" aria-hidden="true">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center">
            {sources.map((source) => (
              <span key={`${dup}-${source}`} className="flex items-center">
                <span className="px-6 font-mono text-xs tracking-[0.2em] whitespace-nowrap text-background/80 uppercase md:text-sm">
                  {source}
                </span>
                <span className="h-1.5 w-1.5 bg-primary" />
              </span>
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">
        Papertrail pulls invoices from {sources.join(', ')}, and 40+ more sources.
      </span>
    </section>
  )
}
