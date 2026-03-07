'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, X, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { useTrades } from '@/components/TradeContext'
import { Trade } from '@/lib/types'
import { getSessionDateForTrade } from '@/lib/session'
import { formatPnl, calcDailyGrade } from '@/lib/calculations'
import RuleBreakCostCalculator from '@/components/RuleBreakCostCalculator'
import { format, parse } from 'date-fns'
import AccountSelector from '@/components/AccountSelector'
import {
  AreaChart, Area, ResponsiveContainer, CartesianGrid,
} from 'recharts'

type FilterTab = 'all' | 'verified' | 'manual'
type ModalTab = 'statistics' | 'notes' | 'trades' | 'rules'

interface DayGroup {
  sessionDate: string
  label: string
  labelLong: string
  trades: Trade[]
  pnl: number
  wins: number
  losses: number
  winRate: number
  profitFactor: number
  fees: number
  equityCurve: { v: number }[]
}

interface RuleItem {
  id: string
  name: string
  type?: string
  condition?: string
}

function buildDayGroups(trades: Trade[]): DayGroup[] {
  const map: Record<string, Trade[]> = {}
  for (const t of trades) {
    const sd = t.sessionDate || getSessionDateForTrade(t.date)
    if (!map[sd]) map[sd] = []
    map[sd].push(t)
  }

  const groups: DayGroup[] = Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([sd, dayTrades]) => {
      const pnl = dayTrades.reduce((s, t) => s + (t.pnl ?? 0), 0)
      const wins = dayTrades.filter(t => (t.pnl ?? 0) > 0).length
      const losses = dayTrades.filter(t => (t.pnl ?? 0) < 0).length
      const winSum = dayTrades.reduce((s, t) => s + ((t.pnl ?? 0) > 0 ? t.pnl : 0), 0)
      const lossSum = Math.abs(dayTrades.reduce((s, t) => s + ((t.pnl ?? 0) < 0 ? t.pnl : 0), 0))
      const profitFactor = lossSum > 0 ? winSum / lossSum : winSum > 0 ? Infinity : 0
      const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0
      const fees = dayTrades.reduce((s, t) => s + (t.fees ?? 0), 0)

      let cum = 0
      const sorted = [...dayTrades].sort((a, b) => a.date.localeCompare(b.date))
      const equityCurve = sorted.map(t => { cum += t.pnl ?? 0; return { v: cum } })

      let label: string
      let labelLong: string
      try {
        const d = parse(sd, 'yyyy-MM-dd', new Date())
        label = format(d, 'EEE, MMM d')
        labelLong = format(d, 'EEE, MMMM d')
      } catch {
        label = sd
        labelLong = sd
      }

      return { sessionDate: sd, label, labelLong, trades: dayTrades, pnl, wins, losses, winRate, profitFactor, fees, equityCurve }
    })

  return groups
}

function MiniChart({ data, positive }: { data: { v: number }[]; positive: boolean }) {
  if (data.length < 2) return <div className="w-[160px] h-[70px]" />
  const color = positive ? '#4ADE80' : '#FF453A'
  const gradId = positive ? 'greenGrad' : 'redGrad'
  return (
    <div className="w-[160px] h-[70px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ModalChart({ data, positive }: { data: { v: number }[]; positive: boolean }) {
  if (data.length < 2) return <div className="w-full h-[220px] flex items-center justify-center text-[#64748B] text-sm">Not enough data</div>
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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
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

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="text-base font-semibold text-white">{value}</div>
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
            <div className="text-xs text-[#64748B] mb-1">{s.label}</div>
            <div className={`text-base font-bold ${s.colored ? (pos ? 'text-[#4ADE80]' : 'text-[#FF453A]') : 'text-white'}`}>
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
      className="w-full min-h-[160px] bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 text-white text-sm placeholder-[#64748B] resize-y focus:outline-none focus:border-white/[0.15]"
    />
  )
}

/* --- Trades Tab --- */
function TradesTab({ trades }: { trades: Trade[] }) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-[#64748B] uppercase">
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
                <td className="py-2 px-2 text-white">{timeStr}</td>
                <td className="py-2 px-2 text-white">{t.symbol || '—'}</td>
                <td className="py-2 px-2 text-white">{t.side || '—'}</td>
                <td className="py-2 px-2 text-right text-white">{t.contracts ?? '—'}</td>
                <td className="py-2 px-2 text-right text-white">{t.entryPrice != null ? `$${Number(t.entryPrice).toFixed(2)}` : '—'}</td>
                <td className="py-2 px-2 text-right text-white">{t.exitPrice != null ? `$${Number(t.exitPrice).toFixed(2)}` : '—'}</td>
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
      <div className="text-center py-8 text-[#64748B] text-sm">
        No rules configured. Add rules in Settings to track compliance.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Compliance</span>
          <span className="text-sm text-[#64748B]">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#4ADE80] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className="text-sm text-[#64748B]">Did you follow your rules today?</p>
      <div className="space-y-2">
        {rules.map(r => {
          const val = compliance[r.id]
          return (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors text-left"
            >
              {val === true && <CheckCircle2 size={20} className="text-[#4ADE80] flex-shrink-0" />}
              {val === false && <XCircle size={20} className="text-[#FF453A] flex-shrink-0" />}
              {val === undefined && <Circle size={20} className="text-[#64748B] flex-shrink-0" />}
              <span className="text-sm text-white">{r.name}</span>
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
      <div className="w-full max-w-2xl bg-[#0c1120] border border-white/[0.08] rounded-none sm:rounded-3xl overflow-hidden min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => currentIndex < groups.length - 1 && onNavigate(currentIndex + 1)}
                disabled={currentIndex >= groups.length - 1}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} className="text-white" />
              </button>
              <span className="text-lg font-bold text-white">{group.labelLong}</span>
              <button
                onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
                disabled={currentIndex <= 0}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} className="text-white" />
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
              <X size={18} className="text-[#64748B]" />
            </button>
          </div>

          {/* Subheader */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className={`text-3xl font-black ${pos ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
              {formatPnl(group.pnl)}
            </span>
            <span className="text-sm text-[#64748B]">· {group.trades.length} trades</span>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-full p-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-white text-black' : 'text-[#64748B] hover:text-white'
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
        <div className="px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#64748B] hover:text-white transition-colors">
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

export default function JournalPage() {
  const { trades } = useTrades()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  const groups = useMemo(() => buildDayGroups(trades), [trades])

  const pills: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All Journals' },
    { key: 'verified', label: 'Verified' },
    { key: 'manual', label: 'Manual' },
  ]

  const handleNavigate = useCallback((idx: number) => setModalIndex(idx), [])
  const handleClose = useCallback(() => setModalIndex(null), [])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {pills.map(p => (
            <button
              key={p.key}
              onClick={() => setFilter(p.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === p.key
                  ? 'bg-white text-black'
                  : 'text-[#64748B] border border-white/[0.1] hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded-full text-sm text-[#64748B] border border-white/[0.1] hover:text-white flex items-center gap-1.5">
            Other <ChevronDown size={14} />
          </button>
          <AccountSelector />
          <button className="px-3 py-1.5 rounded-full text-sm text-[#64748B] border border-white/[0.1] hover:text-white flex items-center gap-1.5">
            All Time <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Day cards */}
      {groups.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <BookOpen size={32} className="text-[#64748B]" />
          </div>
          <p className="font-bold text-white">No trading days found</p>
          <p className="text-sm text-[#64748B]">Import trades to see your journal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g, idx) => {
            const pos = g.pnl >= 0
            return (
              <div
                key={g.sessionDate}
                onClick={() => setModalIndex(idx)}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 sm:p-5 flex items-center gap-4 sm:gap-6 flex-wrap cursor-pointer hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
              >
                {/* Left: date + mini chart */}
                <div className="flex flex-col items-start gap-2 min-w-[180px]">
                  <span className="text-lg font-bold text-white">{g.label}</span>
                  <div className="hidden sm:block"><MiniChart data={g.equityCurve} positive={pos} /></div>
                </div>

                {/* Center: P&L + stats */}
                <div className="flex-1 min-w-0 sm:min-w-[280px]">
                  <div className={`text-2xl font-bold mb-3 ${pos ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                    {formatPnl(g.pnl)}
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-2">
                    <StatCell label="Trades" value={g.trades.length} />
                    <StatCell label="Wins" value={g.wins} />
                    <StatCell label="Losses" value={g.losses} />
                    <StatCell label="Win Rate" value={`${g.winRate.toFixed(0)}%`} />
                    <StatCell label="Profit Factor" value={g.profitFactor === Infinity ? '∞' : g.profitFactor.toFixed(2)} />
                    <StatCell label="Commission" value={`$${g.fees.toFixed(2)}`} />
                  </div>
                </div>

                {/* Right: Grade + Journal button */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  {(() => {
                    const gradeData = getDayGrade(g.sessionDate)
                    return (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: gradeData ? gradeData.color : '#64748B',
                          background: gradeData ? `${gradeData.color}15` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${gradeData ? `${gradeData.color}30` : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {gradeData ? gradeData.grade : '-'}
                      </span>
                    )
                  })()}
                  <button className="flex items-center gap-1.5 text-[#64748B] hover:text-white transition-colors text-sm">
                    <BookOpen size={16} />
                    Journal
                  </button>
                </div>
              </div>
            )
          })}
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
    </div>
  )
}
