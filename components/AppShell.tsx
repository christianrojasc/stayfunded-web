'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MainContent from '@/components/MainContent'
import { SidebarProvider } from '@/components/SidebarContext'
import { AccountFilterProvider } from '@/components/AccountFilterContext'
import { useAuth } from '@/components/AuthContext'
import { Loader2, TrendingUp } from 'lucide-react'

// Renders the full app shell (Sidebar + MainContent) for authenticated routes.
// On /login, renders children without any shell.
// Shows a loading spinner while auth state is being determined.

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const { loading } = useAuth()
  const isLoginPage = pathname === '/login'

  // Landing page and login — no app shell, render children directly
  const isLandingPage = pathname === '/'
  if (isLandingPage || isLoginPage) {
    return <>{children}</>
  }

  // Show full-screen loader while checking auth state (only for app pages)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center shadow-lg shadow-green-500/30 animate-pulse">
          <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
      </div>
    )
  }

  // Authenticated app
  return (
    <SidebarProvider>
      <AccountFilterProvider>
        <Sidebar />
        <MainContent>{children}</MainContent>
      </AccountFilterProvider>
    </SidebarProvider>
  )
}
