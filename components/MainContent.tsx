'use client'
import { useSidebar } from './SidebarContext'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { width } = useSidebar()
  return (
    <main
      className="min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        paddingLeft: width,
        background: '#050810',
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(13,27,62,0.3) 0%, transparent 60%)',
        zIndex: 0,
      }} />
      <div className="relative z-10 max-w-[1600px] mx-auto px-8 py-8">
        {children}
      </div>
    </main>
  )
}
