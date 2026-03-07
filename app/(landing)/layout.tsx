import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0E17] text-white overflow-x-hidden">
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
