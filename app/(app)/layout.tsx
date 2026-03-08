'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { SidebarProvider } from '@/components/SidebarContext'
import { AccountFilterProvider } from '@/components/AccountFilterContext'
import { TradeProvider } from '@/components/TradeContext'
import Sidebar from '@/components/Sidebar'
import MobileBottomNav from '@/components/MobileBottomNav'
import MainContent from '@/components/MainContent'
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, authError } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  if (authError) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }} className="flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm text-center max-w-md">{authError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#4ADE80]/20 hover:bg-[#4ADE80]/30 border border-[#4ADE80]/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (loading || !user) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }} className="flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center shadow-lg shadow-green-500/30 animate-pulse">
          <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AccountFilterProvider>
        <TradeProvider>
          <Sidebar />
          <MobileBottomNav />
          <MainContent>{children}</MainContent>
        </TradeProvider>
      </AccountFilterProvider>
    </SidebarProvider>
  )
}
