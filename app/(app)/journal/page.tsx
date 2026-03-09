'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { BookOpen, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, CheckCircle2, XCircle, Circle, Plus, Pencil, Calendar, Filter, Settings } from 'lucide-react'
import { useTrades } from '@/components/TradeContext'
import { Trade } from '@/lib/types'
import { getSessionDateForTrade } from '@/lib/session'
import { formatPnl, calcDailyGrade } from '@/lib/calculations'
import RuleBreakCostCalculator from '@/components/RuleBreakCostCalculator'
import { format, parse } from 'date-fns'
import AccountSelector from '@/components/AccountSelector'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, ResponsiveContainer, CartesianGrid,
} from 'recharts'

type FilterTab = 'all' | 'verified' | 'manual'
type ModalTab = 'statistics' | 'notes' | 'trades' | 'rules'

interface DayGroup {
  sessionDate: string
  label: string
  labelLong: string
  dayOfWeek: string
  monthDateYear: string
  trades: Trade[]
  pnl: number
  wins: number
  losses: number
  winRate: number
  profitFactor: number
  fees: number
  grossPnl: number
  volume: number
  equityCurve: { v: number }[]
}

interface RuleItem {
  id: string
  name: string
  type?: string
  condition?: string
}

function buildDayGroups(trades: Trade[], year: number, month: number): DayGroup[] {
  // Build trade map by session date
  const map: Record<string, Trade[]> = {}
  for (const t of trades) {
    const sd = t.sessionDate || getSessionDateForTrade(t.date)
    if (!map[sd]) map[sd] = []
    map[sd].push(t)
  }

  // Include manual journal days
  if (typeof window !== 'undefined') {
    const manualDays: string[] = JSON.parse(localStorage.getItem('sf_journal_manual_days') || '[]')
    for (const day of manualDays) {
      if (!map[day]) map[day] = []
    }
  }

  // Generate every day of the given month
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  const groups: DayGroup[] = []
  for (let day = daysInMonth; day >= 1; day--) {
    const sd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    // Don't show future days
    if (sd > todayStr) continue

    const dayTrades = map[sd] || []
    const pnl = dayTrades.reduce((s, t) => s + (t.pnl ?? 0), 0)
    const wins = dayTrades.filter(t => (t.pnl ?? 0) > 0).length
    const losses = dayTrades.filter(t => (t.pnl ?? 0) < 0).length
    const winSum = dayTrades.reduce((s, t) => s + ((t.pnl ?? 0) > 0 ? t.pnl : 0), 0)
    const lossSum = Math.abs(dayTrades.reduce((s, t) => s + ((t.pnl ?? 0) < 0 ? t.pnl : 0), 0))
    const grossPnl = winSum + lossSum
    const profitFactor = lossSum > 0 ? winSum / lossSum : winSum > 0 ? Infinity : 0
    const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0
    const fees = dayTrades.reduce((s, t) => s + (t.fees ?? 0), 0)
    const volume = dayTrades.reduce((s, t) => s + (t.contracts ?? 0), 0)

    let cum = 0
    const sorted = [...dayTrades].sort((a, b) => a.date.localeCompare(b.date))
    const equityCurve = sorted.map(t => { cum += t.pnl ?? 0; return { v: cum } })

    let label = sd, labelLong = sd, dayOfWeek = '', monthDateYear = ''
    try {
      const d = parse(sd, 'yyyy-MM-dd', new Date())
      label = format(d, 'EEE, MMM d')
      labelLong = format(d, 'EEE, MMMM d')
      dayOfWeek = format(d, 'EEE')
      monthDateYear = format(d, 'MMM d, yyyy')
    } catch { /* keep defaults */ }

    groups.push({ sessionDate: sd, label, labelLong, dayOfWeek, monthDateYear, trades: dayTrades, pnl, wins, losses, winRate, profitFactor, fees, grossPnl, volume, equityCurve })
  }

  return groups
}

function hasJournalEntry(sessionDate: string): boolean {
  if (typeof window === 'undefined') return false
  const notes = localStorage.getItem(`sf_journal_notes_${sessionDate}`)
  const rules = localStorage.getItem(`sf_journal_rules_${sessionDate}`)
  return (!!notes && notes.length > 0) || !!rules
}

/* --- SVG Sparkline --- */
function Sparkline({ data, positive }: { data: { v: number }[]; positive: boolean }) {
  if (data.length < 2) {
    // Flat line for no data
    return (
      <svg width="100" height="32" viewBox="0 0 100 32" fill="none">
        <line x1="0" y1="16" x2="100" y2="16" stroke="var(--text-muted)" strokeWidth="4" strokeOpacity="0.3" strokeLinecap="round" />
      </svg>
    )
  }

  const color = positive ? '#4ADE80' : '#FF453A'
  const vals = data.map(d => d.v)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const w = 100
  const h = 32
  const pad = 2

  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w
    const y = pad + (1 - (v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const pathD = `M${points.join(' L')}`
  const fillD = `${pathD} L${w},${h} L0,${h} Z`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <defs>
        <linearGradient id={`spark-${positive ? 'g' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#spark-${positive ? 'g' : 'r'})`} />
      <path d={pathD} stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function ModalChart({ data, positive }: { data: { v: number }[]; positive: boolean }) {
  if (data.length < 2) return <div className="w-full h-[220px] flex items-center justify-center text-[var(--text-secondary)] text-sm">Not enough data</div>
  const color = positive ? '#4ADE80' : '#FF453A'
  const gradId = positive ? 'modalGreenGrad' : 'modalRedGrad'
  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* --- Statistics Tab --- */
function StatsTab({ group }: { group: DayGroup }) {
  const pos = group.pnl >= 0
  return (
    <div className="space-y-4">
      <ModalChart data={group.equityCurve} positive={pos} />
      <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-white/[0.06]">
        {[
          { label: 'Trades', value: group.trades.length },
          { label: 'Wins', value: group.wins },
          { label: 'Losses', value: group.losses },
          { label: 'Win Rate', value: `${group.winRate.toFixed(0)}%` },
          { label: 'P&L', value: formatPnl(group.pnl), colored: true },
          { label: 'Profit Factor', value: group.profitFactor === Infinity ? '∞' : group.profitFactor.toFixed(2) },
        ].map(s => (
          <div key={s.label} className="px-4 py-3 text-center">
            <div className="text-xs text-[var(--text-secondary)] mb-1">{s.label}</div>
            <div className={`text-base font-bold ${s.colored ? (pos ? 'text-[#4ADE80]' : 'text-[#FF453A]') : 'text-[var(--text-primary)]'}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* --- Notes Tab --- */
function NotesTab({ sessionDate }: { sessionDate: string }) {
  const key = `sf_journal_notes_${sessionDate}`
  const [text, setText] = useState('')

  useEffect(() => {
    setText(localStorage.getItem(key) || '')
  }, [key])

  useEffect(() => {
    localStorage.setItem(key, text)
  }, [key, text])

  return (
    <textarea
      value={text}
      onChange={e => setText(e.target.value)}
      placeholder="Write your daily notes here... What went well? What could you improve?"
      className="w-full min-h-[160px] bg-[var(--border)] border border-[var(--border)] rounded-2xl p-4 text-[var(--text-primary)] text-sm placeholder-[#64748B] resize-y focus:outline-none focus:border-[var(--border-strong)]"
    />
  )
}

/* --- Inline Notes (for expand) --- */
function InlineNotes({ sessionDate }: { sessionDate: string }) {
  const key = `sf_journal_notes_${sessionDate}`
  const [text, setText] = useState('')

  useEffect(() => {
    setText(localStorage.getItem(key) || '')
  }, [key])

  useEffect(() => {
    localStorage.setItem(key, text)
  }, [key, text])

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Notes</h4>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write notes for this day..."
        className="w-full min-h-[100px] bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] resize-y focus:outline-none focus:border-[var(--border-strong)]"
      />
    </div>
  )
}

/* --- Trades Tab --- */
function TradesTab({ trades }: { trades: Trade[] }) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-[var(--text-secondary)] uppercase">
            <th className="text-left py-2 px-2 font-medium">Time</th>
            <th className="text-left py-2 px-2 font-medium">Symbol</th>
            <th className="text-left py-2 px-2 font-medium">Side</th>
            <th className="text-right py-2 px-2 font-medium">Qty</th>
            <th className="text-right py-2 px-2 font-medium">Entry</th>
            <th className="text-right py-2 px-2 font-medium">Exit</th>
            <th className="text-right py-2 px-2 font-medium">P&L</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => {
            const pnl = t.pnl ?? 0
            let timeStr = ''
            try { timeStr = format(new Date(t.date), 'HH:mm:ss') } catch { timeStr = t.date }
            return (
              <tr key={i} className={i % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                <td className="py-2 px-2 text-[var(--text-primary)]">{timeStr}</td>
                <td className="py-2 px-2 text-[var(--text-primary)]">{t.symbol || '—'}</td>
                <td className="py-2 px-2 text-[var(--text-primary)]">{t.side || '—'}</td>
                <td className="py-2 px-2 text-right text-[var(--text-primary)]">{t.contracts ?? '—'}</td>
                <td className="py-2 px-2 text-right text-[var(--text-primary)]">{t.entryPrice != null ? `$${Number(t.entryPrice).toFixed(2)}` : '—'}</td>
                <td className="py-2 px-2 text-right text-[var(--text-primary)]">{t.exitPrice != null ? `$${Number(t.exitPrice).toFixed(2)}` : '—'}</td>
                <td className={`py-2 px-2 text-right font-medium ${pnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                  {formatPnl(pnl)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* --- Rules Tab --- */
function RulesTab({ sessionDate, trades, allTrades }: { sessionDate: string; trades: Trade[]; allTrades: Trade[] }) {
  const storageKey = `sf_journal_rules_${sessionDate}`
  const [rules, setRules] = useState<RuleItem[]>([])
  const [compliance, setCompliance] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sf_rules')
      if (raw) setRules(JSON.parse(raw))
    } catch { /* empty */ }
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setCompliance(JSON.parse(raw))
    } catch { /* empty */ }
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(compliance))
  }, [storageKey, compliance])

  const toggle = (id: string) => {
    setCompliance(prev => {
      const cur = prev[id]
      if (cur === undefined) return { ...prev, [id]: true }
      if (cur === true) return { ...prev, [id]: false }
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const yesCount = Object.values(compliance).filter(Boolean).length
  const pct = rules.length > 0 ? Math.round((yesCount / rules.length) * 100) : 0

  if (rules.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
        No rules configured. Add rules in Settings to track compliance.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Compliance</span>
          <span className="text-sm text-[var(--text-secondary)]">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#4ADE80] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">Did you follow your rules today?</p>
      <div className="space-y-2">
        {rules.map(r => {
          const val = compliance[r.id]
          return (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--border)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors text-left"
            >
              {val === true && <CheckCircle2 size={20} className="text-[#4ADE80] flex-shrink-0" />}
              {val === false && <XCircle size={20} className="text-[#FF453A] flex-shrink-0" />}
              {val === undefined && <Circle size={20} className="text-[var(--text-secondary)] flex-shrink-0" />}
              <span className="text-sm text-[var(--text-primary)]">{r.name}</span>
            </button>
          )
        })}
      </div>
      <RuleBreakCostCalculator
        trades={trades}
        allTrades={allTrades}
        rules={rules}
        compliance={compliance}
        sessionDate={sessionDate}
      />
    </div>
  )
}

/* --- Inline Rules (for expand) --- */
function InlineRules({ sessionDate, trades, allTrades }: { sessionDate: string; trades: Trade[]; allTrades: Trade[] }) {
  const storageKey = `sf_journal_rules_${sessionDate}`
  const [rules, setRules] = useState<RuleItem[]>([])
  const [compliance, setCompliance] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sf_rules')
      if (raw) setRules(JSON.parse(raw))
    } catch { /* empty */ }
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setCompliance(JSON.parse(raw))
    } catch { /* empty */ }
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(compliance))
  }, [storageKey, compliance])

  const toggle = (id: string) => {
    setCompliance(prev => {
      const cur = prev[id]
      if (cur === undefined) return { ...prev, [id]: true }
      if (cur === true) return { ...prev, [id]: false }
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  if (rules.length === 0) return null

  const yesCount = Object.values(compliance).filter(Boolean).length
  const pct = rules.length > 0 ? Math.round((yesCount / rules.length) * 100) : 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h4 className="text-xs font-semibold uppercase text-[var(--text-muted)] tracking-wider">Rules Compliance</h4>
        <span className="text-xs text-[var(--text-secondary)]">{pct}%</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {rules.map(r => {
          const val = compliance[r.id]
          return (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors text-left text-xs"
            >
              {val === true && <CheckCircle2 size={14} className="text-[#4ADE80] flex-shrink-0" />}
              {val === false && <XCircle size={14} className="text-[#FF453A] flex-shrink-0" />}
              {val === undefined && <Circle size={14} className="text-[var(--text-secondary)] flex-shrink-0" />}
              <span className="text-[var(--text-primary)]">{r.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* --- Detail Modal --- */
function DayModal({
  groups,
  currentIndex,
  onClose,
  onNavigate,
}: {
  groups: DayGroup[]
  currentIndex: number
  onClose: () => void
  onNavigate: (idx: number) => void
}) {
  const [tab, setTab] = useState<ModalTab>('statistics')
  const group = groups[currentIndex]
  const allGroupTrades = useMemo(() => groups.flatMap(g => g.trades), [groups])
  const pos = group.pnl >= 0

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex < groups.length - 1) onNavigate(currentIndex + 1)
      if (e.key === 'ArrowRight' && currentIndex > 0) onNavigate(currentIndex - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentIndex, groups.length, onClose, onNavigate])

  const tabs: { key: ModalTab; label: string }[] = [
    { key: 'statistics', label: 'Statistics' },
    { key: 'notes', label: 'Notes' },
    { key: 'trades', label: 'Trades' },
    { key: 'rules', label: 'Rules' },
  ]

  const handleSave = () => {
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-2xl bg-[#0c1120] border border-[var(--border)] rounded-none sm:rounded-3xl overflow-hidden min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => currentIndex < groups.length - 1 && onNavigate(currentIndex + 1)}
                disabled={currentIndex >= groups.length - 1}
                className="p-1.5 rounded-lg hover:bg-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} className="text-[var(--text-primary)]" />
              </button>
              <span className="text-lg font-bold text-[var(--text-primary)]">{group.labelLong}</span>
              <button
                onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
                disabled={currentIndex <= 0}
                className="p-1.5 rounded-lg hover:bg-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} className="text-[var(--text-primary)]" />
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors">
              <X size={18} className="text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Subheader */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className={`text-3xl font-bold ${pos ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
              {formatPnl(group.pnl)}
            </span>
            <span className="text-sm text-[var(--text-secondary)]">· {group.trades.length} trades</span>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-[var(--border)] rounded-full p-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'statistics' && <StatsTab group={group} />}
          {tab === 'notes' && <NotesTab sessionDate={group.sessionDate} />}
          {tab === 'trades' && <TradesTab trades={group.trades} />}
          {tab === 'rules' && <RulesTab sessionDate={group.sessionDate} trades={group.trades} allTrades={allGroupTrades} />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black font-bold text-sm rounded-2xl px-6 py-2.5 hover:opacity-90 transition-opacity"
          >
            <BookOpen size={16} />
            Save Journal
          </button>
        </div>
      </div>
    </div>
  )
}

function getDayGrade(sessionDate: string): { grade: string; color: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`sf_journal_rules_${sessionDate}`)
    if (!raw) return null
    const compliance = JSON.parse(raw) as Record<string, boolean>
    const rulesRaw = localStorage.getItem('sf_rules')
    if (!rulesRaw) return null
    const rules = JSON.parse(rulesRaw) as { id: string }[]
    if (rules.length === 0) return null
    const followed = rules.filter(r => compliance[r.id] === true).length
    const pct = (followed / rules.length) * 100
    return calcDailyGrade(pct)
  } catch {
    return null
  }
}

/* --- Stat Pill for Day Row --- */
function RowStat({ label, value, colored, positive }: { label: string; value: string | number; colored?: boolean; positive?: boolean }) {
  return (
    <div className="flex flex-col items-center px-2 lg:px-3 min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium whitespace-nowrap">{label}</span>
      <span className={`text-sm font-semibold whitespace-nowrap ${colored ? (positive ? 'text-[#4ADE80]' : 'text-[#FF453A]') : 'text-[var(--text-primary)]'}`}>
        {value}
      </span>
    </div>
  )
}

/* --- Day Row --- */
function DayRow({ group, index, groups, onOpenModal, expanded, onToggleExpand }: {
  group: DayGroup
  index: number
  groups: DayGroup[]
  onOpenModal: (idx: number) => void
  expanded: boolean
  onToggleExpand: () => void
}) {
  const pos = group.pnl >= 0
  const isEmpty = group.trades.length === 0
  const hasJournal = typeof window !== 'undefined' && hasJournalEntry(group.sessionDate)
  const allGroupTrades = useMemo(() => groups.flatMap(g => g.trades), [groups])

  // Weekend detection
  const isWeekend = useMemo(() => {
    try {
      const d = parse(group.sessionDate, 'yyyy-MM-dd', new Date())
      const dow = d.getDay()
      return dow === 0 || dow === 6
    } catch { return false }
  }, [group.sessionDate])

  // Empty day (no trades, no journal) — compact row, clickable to open modal
  if (isEmpty && !hasJournal) {
    return (
      <div
        className={`rounded-xl border border-[var(--border)] overflow-hidden transition-all cursor-pointer ${isWeekend ? 'opacity-40' : 'opacity-60'} hover:opacity-100 hover:border-[var(--border-strong)]`}
        style={{ background: 'var(--bg-secondary)' }}
        onClick={() => onOpenModal(index)}
      >
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Calendar size={16} className="text-[var(--text-muted)] flex-shrink-0" />
          <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
            {group.dayOfWeek} <span className="opacity-50">|</span> {group.monthDateYear}
          </span>
          <span className="flex-1" />
          {isWeekend ? (
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Weekend</span>
          ) : (
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">No trades</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
            className="px-3 py-1 rounded-lg hover:bg-[var(--border)] transition-colors text-xs font-medium text-[var(--text-muted)]"
          >
            Journal
          </button>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="border-t border-[var(--border)] px-4 py-4">
                <InlineNotes sessionDate={group.sessionDate} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden transition-all hover:border-[var(--border-strong)]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      {/* Main row */}
      <div className="flex items-center gap-3 sm:gap-4 px-4 py-3 flex-wrap lg:flex-nowrap">
        {/* Left: Date + Sparkline + P&L — clickable */}
        <div className="flex items-center gap-3 min-w-[280px] sm:min-w-[320px] flex-shrink-0 cursor-pointer" onClick={() => onOpenModal(index)}>
          <Calendar size={18} className="text-[var(--text-muted)] flex-shrink-0" />
          <div className="flex flex-col mr-2 min-w-[130px]">
            <span className="text-sm font-bold text-[var(--text-primary)] whitespace-nowrap">
              {group.dayOfWeek} <span className="text-[var(--text-muted)] font-normal">|</span> {group.monthDateYear}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              {hasJournal ? 'Journaled' : 'Net P&L'}
            </span>
          </div>
          <div className="flex-shrink-0 hidden sm:block">
            <Sparkline data={group.equityCurve} positive={pos} />
          </div>
          <span className={`text-lg font-bold flex-shrink-0 ${pos ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
            {formatPnl(group.pnl)}
          </span>
        </div>

        {/* Center: Stats row */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 hide-scrollbar">
          <RowStat label="Total Trades" value={group.trades.length} />
          <div className="w-px h-6 bg-[var(--border)] flex-shrink-0" />
          <RowStat label="Winrate" value={`${group.winRate.toFixed(0)}%`} />
          <div className="w-px h-6 bg-[var(--border)] flex-shrink-0" />
          <RowStat label="Gross P&L" value={formatPnl(group.grossPnl)} colored positive={group.grossPnl >= 0} />
          <div className="w-px h-6 bg-[var(--border)] flex-shrink-0" />
          <RowStat label="Volume" value={group.volume} />
          <div className="w-px h-6 bg-[var(--border)] flex-shrink-0" />
          <RowStat label="Winners" value={group.wins} />
          <div className="w-px h-6 bg-[var(--border)] flex-shrink-0" />
          <RowStat label="Losers" value={group.losses} />
          <div className="w-px h-6 bg-[var(--border)] flex-shrink-0" />
          <RowStat label="Commissions" value={`$${Math.abs(group.fees).toFixed(2)}`} />
          <div className="w-px h-6 bg-[var(--border)] flex-shrink-0" />
          <RowStat label="Profit Factor" value={group.profitFactor === Infinity ? '∞' : group.profitFactor.toFixed(2)} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(() => {
            const gradeData = getDayGrade(group.sessionDate)
            if (!gradeData) return null
            return (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full mr-1"
                style={{
                  color: gradeData.color,
                  background: `${gradeData.color}15`,
                  border: `1px solid ${gradeData.color}30`,
                }}
              >
                {gradeData.grade}
              </span>
            )
          })()}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenModal(index) }}
            className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors"
            title="Edit in detail view"
          >
            <Pencil size={15} className="text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[var(--border)] transition-colors text-xs font-medium text-[var(--text-secondary)]"
          >
            {expanded ? 'Collapse' : 'Expand'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)] px-4 py-4 space-y-4">
              {/* Trades table */}
              {group.trades.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Trades</h4>
                  <TradesTab trades={group.trades} />
                </div>
              )}

              {/* Notes */}
              <InlineNotes sessionDate={group.sessionDate} />

              {/* Rules */}
              <InlineRules sessionDate={group.sessionDate} trades={group.trades} allTrades={allGroupTrades} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type JournalFilter = 'all' | 'traded' | 'journaled'

export default function JournalPage() {
  const { trades } = useTrades()
  const [modalIndex, setModalIndex] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<JournalFilter>('all')

  // Month navigation
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)

  const prevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 1) { setViewYear(y => y - 1); return 12 }
      return m - 1
    })
  }, [])
  const nextMonth = useCallback(() => {
    const nowY = now.getFullYear(), nowM = now.getMonth() + 1
    if (viewYear > nowY || (viewYear === nowY && viewMonth >= nowM)) return
    setViewMonth(m => {
      if (m === 12) { setViewYear(y => y + 1); return 1 }
      return m + 1
    })
  }, [viewYear, viewMonth, now])

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth - 1)
    return format(d, 'MMMM yyyy')
  }, [viewYear, viewMonth])

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1

  const allGroups = useMemo(() => buildDayGroups(trades, viewYear, viewMonth), [trades, viewYear, viewMonth])

  const groups = useMemo(() => {
    if (filter === 'all') return allGroups
    if (filter === 'traded') return allGroups.filter(g => g.trades.length > 0)
    if (filter === 'journaled') return allGroups.filter(g => hasJournalEntry(g.sessionDate) || g.trades.length > 0)
    return allGroups
  }, [allGroups, filter])

  const handleNavigate = useCallback((idx: number) => setModalIndex(idx), [])
  const handleClose = useCallback(() => setModalIndex(null), [])

  const toggleRow = useCallback((sessionDate: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(sessionDate)) next.delete(sessionDate)
      else next.add(sessionDate)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedRows(new Set(groups.map(g => g.sessionDate)))
  }, [groups])

  const collapseAll = useCallback(() => {
    setExpandedRows(new Set())
  }, [])

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Journal</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                const today = new Date()
                const yyyy = today.getFullYear()
                const mm = String(today.getMonth() + 1).padStart(2, '0')
                const dd = String(today.getDate()).padStart(2, '0')
                const todayStr = `${yyyy}-${mm}-${dd}`
                const existingIdx = groups.findIndex(g => g.sessionDate === todayStr)
                if (existingIdx >= 0) {
                  setModalIndex(existingIdx)
                } else {
                  const key = `sf_journal_notes_${todayStr}`
                  if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, '')
                  }
                  const manualDays: string[] = JSON.parse(localStorage.getItem('sf_journal_manual_days') || '[]')
                  if (!manualDays.includes(todayStr)) {
                    manualDays.push(todayStr)
                    localStorage.setItem('sf_journal_manual_days', JSON.stringify(manualDays))
                  }
                  window.location.reload()
                }
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--green)] hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> New Entry
            </button>
            {/* Month navigation */}
            <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors">
                <ChevronLeft size={16} className="text-[var(--text-secondary)]" />
              </button>
              <span className="text-sm font-semibold text-[var(--text-primary)] px-2 min-w-[130px] text-center">{monthLabel}</span>
              <button onClick={nextMonth} disabled={isCurrentMonth} className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors disabled:opacity-30">
                <ChevronRight size={16} className="text-[var(--text-secondary)]" />
              </button>
            </div>
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-0.5">
              {([['all', 'All Days'], ['traded', 'Traded'], ['journaled', 'Journaled']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === key
                      ? 'bg-[var(--green)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <AccountSelector />
          </div>
        </div>

        {/* Second row: Expand/Collapse + settings */}
        {groups.length > 0 && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
            >
              Expand All
            </button>
            <span className="text-[var(--text-muted)]">|</span>
            <button
              onClick={collapseAll}
              className="px-3 py-1 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
            >
              Collapse All
            </button>
            <button className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors ml-1">
              <Settings size={15} className="text-[var(--text-muted)]" />
            </button>
          </div>
        )}
      </div>

      {/* Day rows */}
      {groups.length === 0 ? (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--border)] flex items-center justify-center">
            <BookOpen size={32} className="text-[var(--text-secondary)]" />
          </div>
          <p className="font-bold text-[var(--text-primary)]">No trading days found</p>
          <p className="text-sm text-[var(--text-secondary)]">Import trades to see your journal</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g, idx) => (
            <DayRow
              key={g.sessionDate}
              group={g}
              index={idx}
              groups={groups}
              onOpenModal={setModalIndex}
              expanded={expandedRows.has(g.sessionDate)}
              onToggleExpand={() => toggleRow(g.sessionDate)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalIndex !== null && (
        <DayModal
          groups={groups}
          currentIndex={modalIndex}
          onClose={handleClose}
          onNavigate={handleNavigate}
        />
      )}

      {/* Hide scrollbar utility */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
