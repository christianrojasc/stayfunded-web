'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'
import { SidebarProvider } from '@/components/SidebarContext'
import { AccountFilterProvider } from '@/components/AccountFilterContext'
import { TradeProvider } from '@/components/TradeContext'
import Sidebar from '@/components/Sidebar'
import MainContent from '@/components/MainContent'
import { Loader2, TrendingUp } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Show spinner only while auth state is loading (not blocking unauthenticated users)
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

  return (
    <SidebarProvider>
      <AccountFilterProvider>
        <TradeProvider>
          <Sidebar />
          <MainContent>{children}</MainContent>
        </TradeProvider>
      </AccountFilterProvider>
    </SidebarProvider>
  )
}
