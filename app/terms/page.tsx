import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — StayFunded',
}

export default function TermsOfService() {
  const updated = 'March 9, 2026'

  return (
    <div className="min-h-screen" style={{ background: '#050810', color: '#E2E8F0' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-[#4ADE80] hover:underline mb-8 inline-block">← Back to StayFunded</Link>

        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-[#64748B] mb-10">Last updated: {updated}</p>

        <div className="space-y-8 text-sm leading-relaxed text-[#94A3B8]">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using StayFunded (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service. StayFunded is operated by StayFunded (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>StayFunded is a web-based trading journal designed for futures prop firm traders. The Service allows users to import trades, track performance, monitor drawdown compliance, and analyze trading patterns. StayFunded is <strong className="text-white">not</strong> a financial advisor, broker, or trading platform. We do not execute trades or provide investment advice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Accounts</h2>
            <p className="mb-3">You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating an account.</p>
            <p>You may not share your account with others, create multiple accounts to circumvent plan limits, or use automated means to access the Service beyond normal usage.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Free and Pro Plans</h2>
            <p className="mb-3"><strong className="text-white">Free Plan:</strong> Includes core features — dashboard, journal, analytics, calendar, progress tracker, CSV import, and up to 3 prop firm accounts. Free forever, no credit card required.</p>
            <p className="mb-3"><strong className="text-white">Pro Plan:</strong> $14/month or $99/year. Includes unlimited accounts, AI Trade Insights, trade charts, and priority support. Billed through Stripe.</p>
            <p>We reserve the right to modify pricing with 30 days&apos; notice to existing subscribers. Current subscribers will be grandfathered at their existing rate for the remainder of their billing cycle.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Cancellation & Refunds</h2>
            <p className="mb-3">You may cancel your Pro subscription at any time from Settings → Subscription. Upon cancellation, you retain Pro access until the end of your current billing period.</p>
            <p>Refunds are handled on a case-by-case basis. Contact support@stayfunded.app within 7 days of a charge for refund consideration.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. User Data & Ownership</h2>
            <p className="mb-3">You retain full ownership of all trading data, notes, and content you enter into StayFunded. We do not claim any intellectual property rights over your data.</p>
            <p>You may export your data at any time. Upon account deletion, we will remove all your data within 30 days as described in our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Attempt to access other users&apos; accounts or data</li>
              <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service</li>
              <li>Use the Service to store or transmit malicious code</li>
              <li>Abuse API endpoints, overload servers, or interfere with the Service&apos;s operation</li>
              <li>Resell, redistribute, or sublicense access to the Service</li>
              <li>Use the Service for any illegal purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Disclaimer of Warranties</h2>
            <p className="mb-3">THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED.</p>
            <p className="mb-3">StayFunded is a journaling and analytics tool — <strong className="text-white">not financial advice</strong>. Trading futures involves substantial risk of loss. We make no guarantees about the accuracy of calculations, analytics, or AI-generated insights. Always verify critical data (drawdown levels, P&L, account compliance) with your prop firm directly.</p>
            <p>We do not guarantee uninterrupted or error-free service. We will make reasonable efforts to maintain availability but are not liable for downtime.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, STAYFUNDED SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR TRADING LOSSES, ARISING OUT OF YOUR USE OF THE SERVICE.</p>
            <p className="mt-3">Our total liability for any claim arising from the Service shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Indemnification</h2>
            <p>You agree to indemnify and hold harmless StayFunded from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Modifications to the Service</h2>
            <p>We reserve the right to modify, suspend, or discontinue the Service at any time. We will provide reasonable notice for significant changes. If we discontinue the Service entirely, we will provide data export options.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance. We will notify users of material changes via email or in-app notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Governing Law</h2>
            <p>These Terms are governed by the laws of the State of Florida, United States, without regard to conflict of law provisions.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">14. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:support@stayfunded.app" className="text-[#4ADE80] hover:underline">support@stayfunded.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
