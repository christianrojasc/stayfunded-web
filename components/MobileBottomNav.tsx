'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Briefcase, BookOpen, Target } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/trades', icon: TrendingUp, label: 'Trades' },
  { href: '/accounts', icon: Briefcase, label: 'Accounts' },
  { href: '/journal', icon: BookOpen, label: 'Journal' },
  { href: '/progress', icon: Target, label: 'Progress' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/'
      : pathname.startsWith(href)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-[var(--border)]"
      style={{ background: 'rgba(5,8,16,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors"
            >
              <Icon
                size={22}
                className={active ? 'text-[#4ADE80]' : 'text-[var(--text-secondary)]'}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium ${
                  active ? 'text-[#4ADE80]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
