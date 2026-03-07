'use client'
import { useEffect, useState } from 'react'
import { getSettings } from '@/lib/storage'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarW, setSidebarW] = useState(240)

  useEffect(() => {
    const sync = () => {
      const s = getSettings()
      setSidebarW(s.sidebarCollapsed ? 68 : 240)
    }
    sync()
    // Listen for sidebar toggle via storage event
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sf_settings') sync()
    }
    window.addEventListener('storage', onStorage)
    // Also poll briefly on mount for SSR mismatch
    const t = setTimeout(sync, 100)
    return () => { window.removeEventListener('storage', onStorage); clearTimeout(t) }
  }, [])

  return (
    <div
      className="min-h-screen transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ paddingLeft: sidebarW }}
    >
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {children}
      </div>
    </div>
  )
}
