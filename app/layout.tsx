import { Cursor } from '@/components/ui/inverted-cursor'
import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeContext'
import { AuthProvider } from '@/components/AuthContext'

export const metadata: Metadata = {
  title: 'StayFunded — Trading Journal',
  description: 'Professional futures trading journal for prop traders',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-[#1E2D3D] dark:text-[#c9d1d9]">
        <Cursor />
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
