import { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'Contact StayFunded — Get in Touch',
  description: 'Questions about StayFunded? Reach us at support@stayfunded.app. Based in Miami, FL. We typically respond within 24 hours.',
}

const contactMethods = [
  {
    icon: '📧',
    title: 'Email Support',
    desc: 'For questions, bug reports, and general help.',
    action: 'support@stayfunded.app',
    href: 'mailto:support@stayfunded.app',
    note: 'We typically respond within 24 hours',
  },
  {
    icon: '💡',
    title: 'Feature Requests',
    desc: 'Have an idea that would improve StayFunded?',
    action: 'features@stayfunded.app',
    href: 'mailto:features@stayfunded.app?subject=Feature Request',
    note: 'We read every suggestion',
  },
  {
    icon: '🐛',
    title: 'Bug Reports',
    desc: 'Found something broken? Let us know.',
    action: 'bugs@stayfunded.app',
    href: 'mailto:bugs@stayfunded.app?subject=Bug Report',
    note: 'Include steps to reproduce if possible',
  },
  {
    icon: '🤝',
    title: 'Partnerships',
    desc: 'Prop firm partnerships and integrations.',
    action: 'hello@stayfunded.app',
    href: 'mailto:hello@stayfunded.app?subject=Partnership Inquiry',
    note: 'Prop firms, affiliates, and integrations',
  },
]

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#050810] min-h-screen">
        {/* Hero */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] to-[#050810]" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#4ADE80] text-sm font-semibold uppercase tracking-widest mb-4">Contact Us</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              We&apos;re here to help.
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Whether it&apos;s a question, feedback, or a bug — we want to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-6">
              {contactMethods.map(m => (
                <a key={m.title} href={m.href}
                  className="group p-6 rounded-2xl border border-[#1E293B] bg-[#0B0F1A] hover:border-[#4ADE80]/30 transition-all">
                  <span className="text-3xl block mb-4">{m.icon}</span>
                  <h3 className="text-lg font-bold text-white mb-1">{m.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{m.desc}</p>
                  <p className="text-sm font-semibold text-[#4ADE80] group-hover:underline">{m.action}</p>
                  <p className="text-xs text-gray-600 mt-2">{m.note}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Business Info */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">Location</p>
                <p className="text-white font-semibold">Miami, FL</p>
                <p className="text-sm text-gray-500">United States</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">Support Hours</p>
                <p className="text-white font-semibold">Mon – Fri</p>
                <p className="text-sm text-gray-500">9 AM – 6 PM EST</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">Response Time</p>
                <p className="text-white font-semibold">&lt; 24 Hours</p>
                <p className="text-sm text-gray-500">Usually faster</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">Find Us Online</p>
            <div className="flex justify-center gap-6">
              <a href="https://x.com/StayFundedApp" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span className="text-sm font-medium">Twitter / X</span>
              </a>
              <a href="mailto:support@stayfunded.app"
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <span className="text-sm font-medium">Email</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
