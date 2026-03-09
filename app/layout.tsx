import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeContext'
import { AuthProvider } from '@/components/AuthContext'
import HelpChat from '@/components/HelpChat'

export const metadata: Metadata = {
  title: 'StayFunded — Trading Journal',
  description: 'Professional futures trading journal for prop traders',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
