import { Hero } from '@/components/landing/Hero'
import { Problem } from '@/components/landing/Problem'
import { Pricing } from '@/components/landing/Pricing'
import { CTA } from '@/components/landing/CTA'

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <Problem />
      <Pricing />
      <CTA />
    </main>
  )
}
