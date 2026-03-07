import { Hero } from '@/components/landing/Hero'
import { Problem } from '@/components/landing/Problem'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Comparison } from '@/components/landing/Comparison'
import { Dashboard } from '@/components/landing/Dashboard'
import { PropFirms } from '@/components/landing/PropFirms'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'
import { CTA } from '@/components/landing/CTA'

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <Problem />
      <Features />
      <HowItWorks />
      <Comparison />
      <Dashboard />
      <PropFirms />
      <Testimonials />
      <Pricing />
      <CTA />
    </main>
  )
}
