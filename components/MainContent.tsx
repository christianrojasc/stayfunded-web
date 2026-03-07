'use client'
import { useSidebar } from './SidebarContext'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { width } = useSidebar()
  return (
    <main
      className="min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        background: '#050810',
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(13,27,62,0.3) 0%, transparent 60%)',
        zIndex: 0,
      }} />
      <div
        className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8 transition-all duration-300"
        style={{ paddingLeft: undefined }}
      >
        <div className="hidden lg:block" style={{ position: 'fixed', top: 0, left: 0, width: 0 }} />
        {children}
      </div>
      <style jsx>{`
        @media (min-width: 1024px) {
          main {
            padding-left: ${width}px;
          }
        }
      `}</style>
    </main>
  )
}
