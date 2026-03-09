import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — StayFunded',
}

export default function PrivacyPolicy() {
  const updated = 'March 9, 2026'

  return (
    <div className="min-h-screen" style={{ background: '#050810', color: '#E2E8F0' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-[#4ADE80] hover:underline mb-8 inline-block">← Back to StayFunded</Link>

        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#64748B] mb-10">Last updated: {updated}</p>

        <div className="space-y-8 text-sm leading-relaxed text-[#94A3B8]">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
            <p>StayFunded (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the StayFunded web application at stayfunded.app. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3"><strong className="text-white">Account Information:</strong> When you create an account, we collect your email address and display name. Passwords are hashed and managed by Supabase Auth — we never store plaintext passwords.</p>
            <p className="mb-3"><strong className="text-white">Trading Data:</strong> Trade records, account configurations, journal entries, checklists, and notes you enter into the application. This data is stored in our Supabase database and associated with your user account.</p>
            <p className="mb-3"><strong className="text-white">Payment Information:</strong> If you subscribe to StayFunded Pro, payment processing is handled entirely by Stripe. We do not store your credit card numbers, bank account details, or other financial payment information on our servers. We store only your Stripe customer ID for subscription management.</p>
            <p><strong className="text-white">Usage Data:</strong> We may collect basic analytics such as page views and feature usage to improve the product. We do not use third-party tracking scripts or sell data to advertisers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide, maintain, and improve the StayFunded service</li>
              <li>To process your subscription and manage billing through Stripe</li>
              <li>To respond to support requests submitted through the application</li>
              <li>To send important service-related communications (e.g., security alerts, billing confirmations)</li>
              <li>To enforce our Terms of Service and protect against fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Data Storage & Security</h2>
            <p className="mb-3">Your data is stored on Supabase (hosted on AWS) with Row Level Security (RLS) policies ensuring that users can only access their own data. All data is encrypted in transit (TLS) and at rest.</p>
            <p>Guest users (not signed in) have their data stored locally in the browser via localStorage. This data never leaves your device unless you create an account and explicitly sync it.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-white">Supabase</strong> — Authentication and database hosting</li>
              <li><strong className="text-white">Stripe</strong> — Payment processing for Pro subscriptions</li>
              <li><strong className="text-white">Vercel</strong> — Application hosting and deployment</li>
            </ul>
            <p className="mt-3">Each of these services has their own privacy policies. We encourage you to review them.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Sharing</h2>
            <p>We do not sell, rent, or share your personal information or trading data with third parties for marketing purposes. We may disclose information only if required by law or to protect our legal rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Access</strong> your personal data stored in StayFunded</li>
              <li><strong className="text-white">Export</strong> your trading data at any time</li>
              <li><strong className="text-white">Delete</strong> your account and all associated data by contacting support@stayfunded.app</li>
              <li><strong className="text-white">Correct</strong> inaccurate information in your profile settings</li>
            </ul>
            <p className="mt-3">For EU/EEA users: You have additional rights under GDPR, including the right to data portability and the right to lodge a complaint with a supervisory authority.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Data Retention</h2>
            <p>We retain your data for as long as your account is active. If you delete your account, we will remove all associated personal data and trading records within 30 days. Anonymized, aggregated data may be retained for analytics purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Cookies</h2>
            <p>We use essential cookies for authentication (Supabase auth tokens). We do not use advertising cookies or third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>StayFunded is not intended for users under the age of 18. We do not knowingly collect information from children.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the application or sending an email.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or your data, contact us at <a href="mailto:support@stayfunded.app" className="text-[#4ADE80] hover:underline">support@stayfunded.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
