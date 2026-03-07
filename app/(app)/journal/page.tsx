'use client'
import { useState, useMemo } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import { useTrades } from '@/components/TradeContext'
import { Trade } from '@/lib/types'
import { getSessionDateForTrade } from '@/lib/session'
import { formatPnl } from '@/lib/calculations'
import { format, parse } from 'date-fns'
import AccountSelector from '@/components/AccountSelector'
import {
  AreaChart, Area, ResponsiveContainer,
} from 'recharts'

type FilterTab = 'all' | 'verified' | 'manual'

interface DayGroup {
  sessionDate: string
  label: string
  trades: Trade[]
  pnl: number
  wins: number
  losses: number
  winRate: number
  profitFactor: number
  fees: number
  equityCurve: { v: number }[]
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
      try {
        const d = parse(sd, 'yyyy-MM-dd', new Date())
        label = format(d, 'EEE, MMM d')
      } catch {
        label = sd
      }

      return { sessionDate: sd, label, trades: dayTrades, pnl, wins, losses, winRate, profitFactor, fees, equityCurve }
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

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="text-base font-semibold text-white">{value}</div>
    </div>
  )
}

export default function JournalPage() {
  const { trades } = useTrades()
  const [filter, setFilter] = useState<FilterTab>('all')

  const groups = useMemo(() => buildDayGroups(trades), [trades])

  const pills: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All Journals' },
    { key: 'verified', label: 'Verified' },
    { key: 'manual', label: 'Manual' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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
          {groups.map(g => {
            const pos = g.pnl >= 0
            return (
              <div
                key={g.sessionDate}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 flex items-center gap-6 flex-wrap"
              >
                {/* Left: date + mini chart */}
                <div className="flex flex-col items-start gap-2 min-w-[180px]">
                  <span className="text-lg font-bold text-white">{g.label}</span>
                  <MiniChart data={g.equityCurve} positive={pos} />
                </div>

                {/* Center: P&L + stats */}
                <div className="flex-1 min-w-[280px]">
                  <div className={`text-2xl font-bold mb-3 ${pos ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                    {formatPnl(g.pnl)}
                  </div>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-2">
                    <StatCell label="Trades" value={g.trades.length} />
                    <StatCell label="Wins" value={g.wins} />
                    <StatCell label="Losses" value={g.losses} />
                    <StatCell label="Win Rate" value={`${g.winRate.toFixed(0)}%`} />
                    <StatCell label="Profit Factor" value={g.profitFactor === Infinity ? '∞' : g.profitFactor.toFixed(2)} />
                    <StatCell label="Commission" value={`$${g.fees.toFixed(2)}`} />
                  </div>
                </div>

                {/* Right: Journal button */}
                <div className="flex-shrink-0">
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
    </div>
  )
}
