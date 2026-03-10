import { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'About StayFunded — Our Story & Mission',
  description: 'StayFunded was built by prop traders, for prop traders. Learn about our mission to help 10,000 futures traders achieve consistent profitability.',
}

const values = [
  {
    icon: '🎯',
    title: 'Built by Traders',
    desc: 'Every feature exists because we needed it ourselves. No ivory tower product decisions — just real tools for real trading problems.',
  },
  {
    icon: '🔒',
    title: 'Your Data, Your Control',
    desc: 'We never sell your trading data. Your strategies, patterns, and P&L are yours alone. Privacy isn\'t a feature — it\'s a foundation.',
  },
  {
    icon: '📊',
    title: 'Ruthless Honesty',
    desc: 'StayFunded doesn\'t sugarcoat your performance. If your risk management is failing, you\'ll know exactly why and where.',
  },
  {
    icon: '⚡',
    title: 'Speed Over Perfection',
    desc: 'We ship fast, listen to trader feedback, and iterate. New features every week based on what the community actually needs.',
  },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#050810] min-h-screen">
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] to-[#050810]" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#4ADE80] text-sm font-semibold uppercase tracking-widest mb-4">About StayFunded</p>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              Built by traders who kept<br />
              <span className="text-[#4ADE80]">blowing their accounts.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              After failing multiple prop firm evaluations — not from bad trades, but from not tracking the right data — we built the journal we wished existed.
            </p>
          </div>
        </section>

        {/* Founder */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-[#4ADE80] text-xs font-bold uppercase tracking-widest mb-3">The Founder</p>
                <h2 className="text-3xl font-bold text-white mb-6">Christian Rojas</h2>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Futures trader and software developer based in Miami, FL. After years of prop firm trading across Apex, Tradeify, and TopStep accounts, Christian realized the biggest edge wasn&apos;t a better strategy — it was better tracking.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Every blown account came down to the same things: ignoring drawdown proximity, inconsistent rule-following, and not recognizing bad session patterns. Spreadsheets couldn&apos;t cut it. Generic journals didn&apos;t understand futures session hours or prop firm rules.
                </p>
                <p className="text-gray-400 leading-relaxed mb-6">
                  So he built StayFunded — a trading journal that thinks in sessions (6 PM–5 PM EST), tracks drawdown floors in real time, and holds you accountable to your own rules.
                </p>
                <div className="flex items-center gap-4">
                  <a href="https://x.com/StayFundedApp" target="_blank" rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-[#1DA1F2] transition-colors flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    @StayFundedApp
                  </a>
                  <a href="mailto:christian@stayfunded.app"
                    className="text-sm text-gray-500 hover:text-[#4ADE80] transition-colors">
                    christian@stayfunded.app
                  </a>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-[#4ADE80]/20 to-[#0B0F1A] border border-[#1E293B] flex items-center justify-center">
                  <span className="text-7xl">🎯</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#4ADE80] text-xs font-bold uppercase tracking-widest mb-3">Our Mission</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Help 10,000 prop traders achieve<br />consistent profitability.
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Not by selling signals or courses. By giving traders the data clarity to make their own edge work — every session, every day, every evaluation.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-[#4ADE80] text-xs font-bold uppercase tracking-widest mb-3 text-center">What We Believe</p>
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {values.map(v => (
                <div key={v.title} className="p-6 rounded-2xl border border-[#1E293B] bg-[#0B0F1A]">
                  <span className="text-3xl mb-4 block">{v.icon}</span>
                  <h3 className="text-lg font-bold text-white mb-2">{v.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { num: '20+', label: 'Prop Firms Supported' },
                { num: '6', label: 'Core Features' },
                { num: '3', label: 'CSV Import Formats' },
                { num: '24/7', label: 'Data Access' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-black text-[#4ADE80]">{s.num}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to stay funded?</h2>
            <p className="text-gray-400 mb-8">Join traders who track what matters. Free forever — no credit card required.</p>
            <Link href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#4ADE80] text-black font-bold text-sm hover:bg-[#22C55E] transition-colors">
              Get Started Free →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
