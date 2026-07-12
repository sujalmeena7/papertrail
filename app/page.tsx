import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { SourcesMarquee } from '@/components/landing/sources-marquee'
import { ReceiptViz } from '@/components/landing/receipt-viz'
import { Steps } from '@/components/landing/steps'
import { DetectionFeed } from '@/components/landing/detection-feed'
import { Stats } from '@/components/landing/stats'
import { Pricing } from '@/components/landing/pricing'
import { Footer } from '@/components/landing/footer'

export default function Page() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <SourcesMarquee />
        <ReceiptViz />
        <Steps />
        <DetectionFeed />
        <Stats />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
