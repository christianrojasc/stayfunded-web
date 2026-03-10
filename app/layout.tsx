import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeContext'
import { AuthProvider } from '@/components/AuthContext'
import HelpChat from '@/components/HelpChat'

export const metadata: Metadata = {
  title: {
    default: 'Best Trading Journal for Futures & Prop Firms | StayFunded',
    template: '%s | StayFunded',
  },
  description: 'Trading journal built for prop firm traders. Track drawdowns, import Tradovate CSV, analyze session patterns, and pass evaluations. Free forever plan. 20+ prop firms supported.',
  keywords: ['trading journal', 'prop firm', 'futures trading', 'drawdown tracker', 'Tradovate', 'Apex', 'Tradeify', 'TopStep', 'prop trading journal', 'trading analytics'],
  openGraph: {
    title: 'Best Trading Journal for Futures & Prop Firms | StayFunded',
    description: 'Track drawdowns, import trades, analyze session patterns, and stay funded. The journal built by prop traders, for prop traders. Free forever.',
    url: 'https://stayfunded.app',
    siteName: 'StayFunded',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@StayFundedApp',
    creator: '@StayFundedApp',
  },
  metadataBase: new URL('https://stayfunded.app'),
}

// Structured Data — Organization + Founder (E-E-A-T)
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'StayFunded',
      url: 'https://stayfunded.app',
      logo: 'https://stayfunded.app/logo.png',
      description: 'Professional futures trading journal built for prop firm traders.',
      foundingDate: '2025',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Miami',
        addressRegion: 'FL',
        addressCountry: 'US',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@stayfunded.app',
        contactType: 'customer support',
        availableLanguage: 'English',
      },
      sameAs: [
        'https://x.com/StayFundedApp',
      ],
      founder: {
        '@type': 'Person',
        name: 'Christian Rojas',
        jobTitle: 'Founder & Developer',
        description: 'Futures trader and software developer who built StayFunded after years of prop firm trading across Apex, Tradeify, and TopStep.',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Miami',
          addressRegion: 'FL',
          addressCountry: 'US',
        },
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'StayFunded',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      url: 'https://stayfunded.app',
      offers: [
        {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free plan — Dashboard, Journal, Analytics, Calendar, CSV Import, up to 3 accounts',
        },
        {
          '@type': 'Offer',
          price: '14',
          priceCurrency: 'USD',
          description: 'Pro plan — Unlimited accounts, AI Insights, Trade Charts',
        },
      ],
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <HelpChat />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
