'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ListOrdered, Calendar, CalendarDays, BarChart3,
  BookOpen, Upload, Settings, ChevronLeft,
  Menu, Moon, Sun, Briefcase, ClipboardCheck, Scale, Target, Brain,
  type LucideIcon
} from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { useTheme } from './ThemeContext'

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'TRADING',
    items: [
      { href: '/trades',    icon: ListOrdered,  label: 'Trade Log' },
      { href: '/calendar',  icon: Calendar,     label: 'Calendar' },
      { href: '/economic-calendar', icon: CalendarDays, label: 'Econ Calendar' },
      { href: '/analytics', icon: BarChart3,    label: 'Analytics' },
      { href: '/insights',  icon: Brain,        label: 'Insights' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { href: '/journal',   icon: BookOpen,       label: 'Journal' },
      { href: '/progress', icon: Target, label: 'Progress' },
      { href: "/import",    icon: Upload,         label: "Import" },
    ],
  },
  {
    label: 'MANAGE',
    items: [
      { href: '/accounts',    icon: Briefcase, label: 'Accounts' },
      { href: '/prop-firms',  icon: Scale,     label: 'Prop Firms' },
    ],
  },
]

function NavItem({
  href, icon: Icon, label, active, collapsed,
}: {
  href: string; icon: LucideIcon; label: string; active: boolean; collapsed: boolean
}) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative ${
          collapsed ? 'justify-center' : ''
        } ${
          active
            ? 'text-[var(--green)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
        }`}
        style={active ? {
          background: 'color-mix(in srgb, var(--green) 12%, transparent)',
          borderLeft: collapsed ? 'none' : '2px solid var(--green)',
          paddingLeft: collapsed ? '12px' : '10px',
        } : {}}
      >
        <Icon size={20} className="flex-shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
        {collapsed && (
          <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-150 z-50"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', backdropFilter: 'blur(20px)' }}>
            {label}
          </span>
        )}
      </div>
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggle, setHovered } = useSidebar()
  const { theme, toggle: toggleTheme } = useTheme()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' || pathname === '/' : pathname.startsWith(href)

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`sidebar-transition fixed top-0 left-0 h-screen z-40 hidden lg:flex flex-col ${
        collapsed ? 'w-[64px]' : 'w-[220px]'
      }`}
      style={{
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-5 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}
        style={{ borderBottom: '1px solid var(--border)' }}>
        {!collapsed && (
          <div className="flex items-center min-w-0">
            <img src={theme === 'light' ? '/logo-light.png' : '/logo.png'} alt="StayFunded" className="h-9 w-auto" />
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE80)' }}>
            <span className="text-white font-bold text-xs">SF</span>
          </div>
        )}
        {!collapsed && (
          <button onClick={toggle}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label} className={si > 0 ? 'mt-1' : ''}>
            {!collapsed && (
              <div className="px-3 pt-4 pb-1.5">
                <span className="text-[9px] font-bold tracking-[0.15em] uppercase select-none"
                  style={{ color: 'var(--text-muted)' }}>
                  {section.label}
                </span>
              </div>
            )}
            {collapsed && si > 0 && (
              <div className="mx-3 my-2" style={{ borderTop: '1px solid var(--border)' }} />
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, icon, label }) => (
                <NavItem key={href} href={href} icon={icon} label={label} active={isActive(href)} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 px-2 pb-3 pt-2 space-y-0.5"
        style={{ borderTop: '1px solid var(--border)' }}>
        {collapsed && (
          <button onClick={toggle}
            className="w-full flex justify-center p-2.5 rounded-xl transition-colors group relative"
            style={{ color: 'var(--text-muted)' }}>
            <Menu size={20} />
          </button>
        )}

        <button onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors group relative ${collapsed ? 'justify-center' : ''}`}
          style={{ color: 'var(--text-muted)' }}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {!collapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>

        <Link href="/settings">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative ${collapsed ? 'justify-center' : ''}`}
            style={isActive('/settings') ? {
              background: 'color-mix(in srgb, var(--green) 12%, transparent)',
              color: 'var(--green)',
            } : { color: 'var(--text-muted)' }}>
            <Settings size={20} className="flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </div>
        </Link>
      </div>
    </aside>
  )
}
