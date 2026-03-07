'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getSettings } from '@/lib/storage'
import * as dl from '@/lib/data-layer'

interface SidebarCtx {
  collapsed: boolean
  toggle: () => void
  setHovered: (v: boolean) => void
  width: number
}

const Ctx = createContext<SidebarCtx>({ collapsed: false, toggle: () => {}, setHovered: () => {}, width: 220 })

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [pinned, setPinned] = useState(false) // false = collapsed by default
  const [hovered, setHovered] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const local = getSettings()
    setPinned(!local.sidebarCollapsed)
    setMounted(true)
    dl.getSettings().then(s => {
      setPinned(!s.sidebarCollapsed)
    }).catch(() => {})
  }, [])

  const toggle = useCallback(() => {
    setPinned(prev => {
      const next = !prev
      dl.saveSettings({ sidebarCollapsed: !next })
      return next
    })
  }, [])

  const handleHover = useCallback((v: boolean) => {
    setHovered(v)
  }, [])

  if (!mounted) return <>{children}</>

  const collapsed = !pinned && !hovered
  return (
    <Ctx.Provider value={{ collapsed, toggle, setHovered: handleHover, width: collapsed ? 64 : 220 }}>
      {children}
    </Ctx.Provider>
  )
}

export const useSidebar = () => useContext(Ctx)
