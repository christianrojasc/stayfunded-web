'use client'
import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line, AreaChart, Area, ReferenceLine, ReferenceDot
} from 'recharts'
import { useTrades } from '@/components/TradeContext'
import { Trade } from '@/lib/types'
import { useAccountFilter } from '@/components/AccountFilterContext'
import AccountSelector from '@/components/AccountSelector'
import {
  calcAnalytics, calcDailyStats, formatCurrency, formatPnl,
  calcHourlyStats, calcDayOfWeekStats, calcTradeQuality,
  calcInstrumentBreakdown, calcPnlDistribution, calcDrawdownSeries,
  calcSessionPerformance
} from '@/lib/calculations'
import RadarChartComp from '@/components/charts/RadarChart'
import {
  Clock, Calendar, Trophy, TrendingDown, TrendingUp, BarChart3, Target, Brain,
  ArrowUpRight, ArrowDownRight, Timer, Repeat, Zap, Award,
  ChevronDown, ChevronUp
} from 'lucide-react'
import ProGate from '@/components/ProGate'

const GLASS = 'glass-card'
const TT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, color: 'var(--text-primary)', padding: '8px 12px' }
const TT_LABEL: React.CSSProperties = { color: 'var(--text-primary)', fontWeight: 600 }
const TT_ITEM: React.CSSProperties = { color: 'var(--text-secondary)' }

let _statRowIdx = 0;
function StatRow({ label, value, sub, green, red }: { label: string; value: string; sub?: string; green?: boolean; red?: boolean }) {
  const idx = _statRowIdx++;
  return (
    <div className={"flex items-center justify-between py-2.5 px-3 rounded-lg " + (idx % 2 === 0 ? "bg-[var(--bg-card)]" : "")}>
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-bold ${green ? 'text-[#4ADE80]' : red ? 'text-[#FF453A]' : 'text-[var(--text-primary)]'}`}>
          {value}
        </span>
        {sub && <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 rounded-lg bg-[var(--border)]">
        <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className={`${GLASS} p-4 flex flex-col gap-1`}>
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <span className={`text-lg font-bold ${color || 'text-[var(--text-primary)]'}`}>{value}</span>
    </div>
  )
}

function formatMinutes(m: number): string {
  if (m < 1) return '< 1m'
  if (m < 60) return `${Math.round(m)}m`
  const h = Math.floor(m / 60)
  const mins = Math.round(m % 60)
  return mins > 0 ? `${h}h ${mins}m` : `${h}h`
}

export default function AnalyticsPage() {
  const { trades } = useTrades()
  const { selectedId, accounts } = useAccountFilter()
  const filteredTrades = useMemo(
    () => selectedId ? trades.filter(t => t.accountId === selectedId) : trades,
    [trades, selectedId]
  )
  const analytics = useMemo(() => calcAnalytics(filteredTrades), [filteredTrades])
  const daily = useMemo(() => calcDailyStats(filteredTrades), [filteredTrades])

  // New analytics
  const hourlyStats = useMemo(() => calcHourlyStats(filteredTrades), [filteredTrades])
  const dayOfWeekStats = useMemo(() => calcDayOfWeekStats(filteredTrades), [filteredTrades])
  const tradeQuality = useMemo(() => calcTradeQuality(filteredTrades), [filteredTrades])
  const instrumentStats = useMemo(() => calcInstrumentBreakdown(filteredTrades), [filteredTrades])
  const pnlDist = useMemo(() => calcPnlDistribution(filteredTrades), [filteredTrades])
  const drawdownData = useMemo(() => calcDrawdownSeries(filteredTrades), [filteredTrades])
  const sessionPerf = useMemo(() => calcSessionPerformance(filteredTrades), [filteredTrades])

  // Side analysis: Long vs Short
  const sideStats = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed')
    const calc = (side: string) => {
      const arr = closed.filter(t => t.side === side)
      const w = arr.filter(t => t.netPnl > 0)
      const l = arr.filter(t => t.netPnl < 0)
      return {
        count: arr.length,
        pnl: arr.reduce((s, t) => s + t.netPnl, 0),
        winRate: arr.length > 0 ? (w.length / arr.length) * 100 : 0,
        avgWin: w.length > 0 ? w.reduce((s, t) => s + t.netPnl, 0) / w.length : 0,
        avgLoss: l.length > 0 ? Math.abs(l.reduce((s, t) => s + t.netPnl, 0) / l.length) : 0,
        wins: w.length,
        losses: l.length,
        pf: l.length > 0 && l.reduce((s, t) => s + t.netPnl, 0) !== 0
          ? w.reduce((s, t) => s + t.netPnl, 0) / Math.abs(l.reduce((s, t) => s + t.netPnl, 0))
          : w.length > 0 ? Infinity : 0,
      }
    }
    return { long: calc('Long'), short: calc('Short') }
  }, [filteredTrades])

  // ── Expectancy ──
  const expectancy = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed')
    if (closed.length === 0) return null
    const w = closed.filter(t => t.netPnl > 0)
    const l = closed.filter(t => t.netPnl < 0)
    const winPct = w.length / closed.length
    const lossPct = l.length / closed.length
    const avgW = w.length > 0 ? w.reduce((s, t) => s + t.netPnl, 0) / w.length : 0
    const avgL = l.length > 0 ? Math.abs(l.reduce((s, t) => s + t.netPnl, 0) / l.length) : 0
    const exp = (winPct * avgW) - (lossPct * avgL)
    // Kelly Criterion: (W/L ratio × Win% - Loss%) / (W/L ratio)
    const wlRatio = avgL > 0 ? avgW / avgL : 0
    const kelly = wlRatio > 0 ? ((wlRatio * winPct) - lossPct) / wlRatio : 0
    return { expectancy: exp, kelly: Math.max(0, Math.min(kelly, 1)) * 100, perTrade: exp }
  }, [filteredTrades])

  // ── Equity Curve ──
  const equityCurve = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed')
    if (closed.length === 0) return []
    const sorted = [...closed].sort((a, b) => a.date.localeCompare(b.date) || (a.entryTime || '').localeCompare(b.entryTime || ''))
    let cumPnl = 0
    const sessionMap = new Map<string, number>()
    sorted.forEach(t => {
      cumPnl += t.netPnl
      sessionMap.set(t.sessionDate || t.date, cumPnl)
    })
    return [...sessionMap.entries()].map(([date, pnl]) => ({ date, pnl }))
  }, [filteredTrades])

  // ── After-Win / After-Loss ──
  const sequenceStats = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed')
    if (closed.length < 5) return null
    let afterWinWins = 0, afterWinTotal = 0, afterLossWins = 0, afterLossTotal = 0
    let afterWinPnl = 0, afterLossPnl = 0
    for (let i = 1; i < closed.length; i++) {
      if (closed[i - 1].netPnl > 0) {
        afterWinTotal++
        afterWinPnl += closed[i].netPnl
        if (closed[i].netPnl > 0) afterWinWins++
      } else {
        afterLossTotal++
        afterLossPnl += closed[i].netPnl
        if (closed[i].netPnl > 0) afterLossWins++
      }
    }
    // After 2 consecutive losses
    let after2LWins = 0, after2LTotal = 0, after2LPnl = 0
    for (let i = 2; i < closed.length; i++) {
      if (closed[i - 1].netPnl < 0 && closed[i - 2].netPnl < 0) {
        after2LTotal++
        after2LPnl += closed[i].netPnl
        if (closed[i].netPnl > 0) after2LWins++
      }
    }
    return {
      afterWin: { winRate: afterWinTotal > 0 ? (afterWinWins / afterWinTotal) * 100 : 0, count: afterWinTotal, avgPnl: afterWinTotal > 0 ? afterWinPnl / afterWinTotal : 0 },
      afterLoss: { winRate: afterLossTotal > 0 ? (afterLossWins / afterLossTotal) * 100 : 0, count: afterLossTotal, avgPnl: afterLossTotal > 0 ? afterLossPnl / afterLossTotal : 0 },
      after2Loss: { winRate: after2LTotal > 0 ? (after2LWins / after2LTotal) * 100 : 0, count: after2LTotal, avgPnl: after2LTotal > 0 ? after2LPnl / after2LTotal : 0 },
    }
  }, [filteredTrades])

  // ── First Trade of Day ──
  const firstTradeStats = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed')
    const bySession = new Map<string, Trade[]>()
    closed.forEach(t => {
      const key = t.sessionDate || t.date
      if (!bySession.has(key)) bySession.set(key, [])
      bySession.get(key)!.push(t)
    })
    let wins = 0, total = 0, pnl = 0
    bySession.forEach(trades => {
      const sorted = trades.sort((a, b) => (a.entryTime || '').localeCompare(b.entryTime || ''))
      if (sorted.length > 0) {
        total++
        pnl += sorted[0].netPnl
        if (sorted[0].netPnl > 0) wins++
      }
    })
    return { winRate: total > 0 ? (wins / total) * 100 : 0, count: total, avgPnl: total > 0 ? pnl / total : 0 }
  }, [filteredTrades])

  // ── Trade Frequency vs Performance ──
  const frequencyStats = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed')
    const bySession = new Map<string, Trade[]>()
    closed.forEach(t => {
      const key = t.sessionDate || t.date
      if (!bySession.has(key)) bySession.set(key, [])
      bySession.get(key)!.push(t)
    })
    const buckets: { label: string; days: number; pnl: number; avgPnl: number; winRate: number }[] = []
    const ranges = [[1, 2, '1-2 trades'], [3, 4, '3-4 trades'], [5, 99, '5+ trades']] as const
    ranges.forEach(([min, max, label]) => {
      let days = 0, pnl = 0, wins = 0, total = 0
      bySession.forEach(trades => {
        if (trades.length >= min && trades.length <= max) {
          days++
          const dayPnl = trades.reduce((s, t) => s + t.netPnl, 0)
          pnl += dayPnl
          total += trades.length
          wins += trades.filter(t => t.netPnl > 0).length
        }
      })
      if (days > 0) buckets.push({ label: label as string, days, pnl, avgPnl: pnl / days, winRate: total > 0 ? (wins / total) * 100 : 0 })
    })
    return buckets
  }, [filteredTrades])

  // ── Contract Size Impact ──
  const contractStats = useMemo(() => {
    const closed = filteredTrades.filter(t => t.status === 'closed')
    const sizes = new Map<number, { count: number; pnl: number; wins: number }>()
    closed.forEach(t => {
      const s = sizes.get(t.contracts) || { count: 0, pnl: 0, wins: 0 }
      s.count++
      s.pnl += t.netPnl
      if (t.netPnl > 0) s.wins++
      sizes.set(t.contracts, s)
    })
    return [...sizes.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([contracts, s]) => ({
        contracts,
        count: s.count,
        pnl: s.pnl,
        avgPnl: s.pnl / s.count,
        winRate: (s.wins / s.count) * 100,
      }))
  }, [filteredTrades])

  // Derived: active hours only, best hours, best day
  const activeHours = useMemo(() => hourlyStats.filter(h => h.count > 0), [hourlyStats])
  const bestHours = useMemo(() =>
    [...activeHours].sort((a, b) => b.avgPnl - a.avgPnl).slice(0, 3),
    [activeHours]
  )
  const bestHourByPnl = useMemo(() => activeHours.length ? activeHours.reduce((a, b) => a.pnl > b.pnl ? a : b) : null, [activeHours])
  const worstHourByPnl = useMemo(() => activeHours.length ? activeHours.reduce((a, b) => a.pnl < b.pnl ? a : b) : null, [activeHours])
  const bestDay = useMemo(() => {
    const active = dayOfWeekStats.filter(d => d.count > 0)
    return active.length ? active.reduce((a, b) => a.avgPnl > b.avgPnl ? a : b) : null
  }, [dayOfWeekStats])

  // Max drawdown point for chart
  const maxDDPoint = useMemo(() => drawdownData.find(d => d.isMax), [drawdownData])

  // Radar data
  const radarData = [
    { metric: 'Win Rate', value: Math.min(analytics.winRate / 70 * 100, 100), fullMark: 100 },
    { metric: 'Profit Factor', value: Math.min(analytics.profitFactor / 3 * 100, 100), fullMark: 100 },
    { metric: 'Consistency', value: analytics.consistency, fullMark: 100 },
    { metric: 'Risk:Reward', value: Math.min(analytics.avgRR / 2 * 100, 100), fullMark: 100 },
    { metric: 'Drawdown Ctrl', value: Math.max(0, 100 - analytics.maxDrawdownPct * 5), fullMark: 100 },
    { metric: 'Recovery', value: Math.min(analytics.recoveryFactor / 5 * 100, 100), fullMark: 100 },
  ]

  // Setup breakdown
  const setupMap = new Map<string, { count: number; pnl: number; wins: number }>()
  filteredTrades.forEach(t => {
    if (t.status !== 'closed' || !t.setup) return
    const s = setupMap.get(t.setup) || { count: 0, pnl: 0, wins: 0 }
    setupMap.set(t.setup, {
      count: s.count + 1,
      pnl: s.pnl + t.netPnl,
      wins: s.wins + (t.netPnl > 0 ? 1 : 0),
    })
  })
  const setupData = Array.from(setupMap.entries())
    .map(([setup, d]) => ({ setup, ...d, wr: (d.wins / d.count) * 100 }))
    .sort((a, b) => b.pnl - a.pnl)

  const scoreColor = analytics.score >= 70 ? '#4ADE80' : analytics.score >= 50 ? '#F59E0B' : '#FF453A'
  const scoreOffset = 251 - (analytics.score / 100) * 251

  // Session table sort
  const [sessionSort, setSessionSort] = useState<'date' | 'pnl' | 'trades' | 'winRate'>('date')
  const [sessionSortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const sortedSessions = useMemo(() => {
    const s = [...sessionPerf]
    s.sort((a, b) => {
      const mul = sessionSortDir === 'asc' ? 1 : -1
      if (sessionSort === 'date') return mul * a.date.localeCompare(b.date)
      if (sessionSort === 'pnl') return mul * (a.netPnl - b.netPnl)
      if (sessionSort === 'trades') return mul * (a.trades - b.trades)
      return mul * (a.winRate - b.winRate)
    })
    return s
  }, [sessionPerf, sessionSort, sessionSortDir])

  const toggleSort = (col: typeof sessionSort) => {
    if (sessionSort === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSessionSort(col); setSortDir('desc') }
  }

  return (
    <ProGate feature="analytics" mode="block">
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Deep dive into your trading performance</p>
      </div>

      {/* ═══ Score + Radar ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`${GLASS} p-6 flex flex-col items-center justify-center gap-4`}>
          <h2 className="text-sm font-bold text-[var(--text-primary)] self-start">Trader Score</h2>
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle cx="45" cy="45" r="40" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray="251" strokeDashoffset={scoreOffset}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-[var(--text-primary)]">{analytics.score}</span>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">/ 100</span>
            </div>
          </div>
          <div className={`text-sm font-bold px-4 py-1.5 rounded-full ${
            analytics.score >= 70 ? 'bg-[#4ADE80]/10 text-[#4ADE80]' :
            analytics.score >= 50 ? 'bg-amber-500/10 text-amber-400' :
            'bg-[#FF453A]/10 text-[#FF453A]'
          }`}>
            {analytics.score >= 80 ? 'Elite Trader' :
             analytics.score >= 70 ? 'Strong Trader' :
             analytics.score >= 50 ? 'Developing' :
             analytics.score >= 30 ? 'Needs Work' : 'Getting Started'}
          </div>
          <div className="w-full space-y-1 mt-2">
            {[
              { label: 'Win Rate', pct: Math.min(analytics.winRate / 70 * 100, 100) },
              { label: 'Profit Factor', pct: Math.min(analytics.profitFactor / 3 * 100, 100) },
              { label: 'Consistency', pct: analytics.consistency },
              { label: 'Risk:Reward', pct: Math.min(analytics.avgRR / 2 * 100, 100) },
              { label: 'Drawdown Ctrl', pct: Math.max(0, 100 - analytics.maxDrawdownPct * 5) },
            ].map(({ label, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-[var(--text-secondary)]">{label}</span>
                  <span className="text-[var(--text-secondary)] font-semibold">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4ADE80, #22c55e)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`lg:col-span-2 ${GLASS} p-5`}>
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-1">Performance Radar</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-4">6 key performance dimensions, scored 0-100</p>
          <div className="h-72 min-h-[300px]">
            <RadarChartComp data={radarData} />
          </div>
        </div>
      </div>

      {/* ═══ Stats breakdown ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`${GLASS} p-4 sm:p-5`}>
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">Trade Stats</h2>
          <div>
            <StatRow label="Total Trades" value={`${analytics.totalTrades}`} />
            <StatRow label="Win / Loss" value={`${analytics.winCount} / ${analytics.lossCount}`} />
            <StatRow label="Win Rate" value={`${analytics.winRate.toFixed(1)}%`} green={analytics.winRate >= 55} red={analytics.winRate < 45} />
            <StatRow label="Profit Factor" value={analytics.profitFactor >= 999 ? '\u221E' : analytics.profitFactor.toFixed(2)} green={analytics.profitFactor >= 1.5} red={analytics.profitFactor < 1} />
            <StatRow label="Avg Win" value={formatCurrency(analytics.avgWin)} green />
            <StatRow label="Avg Loss" value={formatCurrency(analytics.avgLoss)} red />
            <StatRow label="Avg R:R" value={analytics.avgRR.toFixed(2)} green={analytics.avgRR >= 1} red={analytics.avgRR < 0.8} />
            <StatRow label="Total Fees" value={formatCurrency(analytics.totalFees)} />
            <StatRow label="Net P&L" value={formatCurrency(analytics.netPnl)} green={analytics.netPnl >= 0} red={analytics.netPnl < 0} />
          </div>
        </div>

        <div className={`${GLASS} p-4 sm:p-5`}>
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">Risk & Drawdown</h2>
          <div>
            <StatRow label="Max Drawdown ($)" value={formatCurrency(analytics.maxDrawdown)} red />
            <StatRow label="Max Drawdown (%)" value={`${analytics.maxDrawdownPct.toFixed(2)}%`} red />
            <StatRow label="Recovery Factor" value={analytics.recoveryFactor >= 999 ? '\u221E' : analytics.recoveryFactor.toFixed(2)} green={analytics.recoveryFactor >= 2} />
            <StatRow label="Sharpe Ratio" value={analytics.sharpeRatio.toFixed(2)} green={analytics.sharpeRatio >= 1} />
            <StatRow label="Best Day" value={formatPnl(analytics.bestDay)} green />
            <StatRow label="Worst Day" value={formatPnl(analytics.worstDay)} red />
            <StatRow label="Consistency" value={`${analytics.consistency.toFixed(1)}%`} green={analytics.consistency >= 60} />
            <StatRow label="Avg Trades/Day" value={analytics.avgTradesPerDay.toFixed(1)} />
          </div>
        </div>

        <div className={`${GLASS} p-4 sm:p-5`}>
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">Streaks & Patterns</h2>
          <div>
            <StatRow
              label="Current Streak"
              value={analytics.currentStreak === 0 ? '\u2014' : analytics.currentStreak > 0 ? `${analytics.currentStreak} wins` : `${Math.abs(analytics.currentStreak)} losses`}
              green={analytics.currentStreak > 0}
              red={analytics.currentStreak < 0}
            />
            <StatRow label="Best Win Streak" value={`${analytics.longestWinStreak} trades`} green />
            <StatRow label="Worst Loss Streak" value={`${analytics.longestLossStreak} trades`} red />
            <StatRow label="Gross Profit" value={formatCurrency(analytics.grossProfit)} green />
            <StatRow label="Gross Loss" value={formatCurrency(analytics.grossLoss)} red />
          </div>
        </div>
      </div>

      {/* ═══ EXPECTANCY & KELLY ═══ */}
      {expectancy && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`${GLASS} p-5 text-center`}>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-2">Expectancy per Trade</p>
            <p className={`text-3xl font-bold font-mono ${expectancy.perTrade >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
              {expectancy.perTrade >= 0 ? '+' : ''}{formatCurrency(expectancy.perTrade)}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Expected $ per trade taken</p>
          </div>
          <div className={`${GLASS} p-5 text-center`}>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-2">Kelly Criterion</p>
            <p className={`text-3xl font-bold ${expectancy.kelly > 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
              {expectancy.kelly.toFixed(1)}%
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Optimal risk per trade</p>
          </div>
          <div className={`${GLASS} p-5 text-center`}>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-2">First Trade Win Rate</p>
            <p className={`text-3xl font-bold ${firstTradeStats.winRate >= 50 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
              {firstTradeStats.winRate.toFixed(0)}%
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{firstTradeStats.count} sessions · Avg {firstTradeStats.avgPnl >= 0 ? '+' : ''}{formatCurrency(firstTradeStats.avgPnl)}</p>
          </div>
        </div>
      )}

      {/* ═══ EQUITY CURVE ═══ */}
      {equityCurve.length > 1 && (
        <div className={`${GLASS} p-5`}>
          <SectionHeader title="Equity Curve" subtitle="Cumulative P&L over time" icon={TrendingUp} />
          <div className="min-h-[280px]">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={equityCurve} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#4ADE80" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="equityRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF453A" stopOpacity={0} />
                    <stop offset="100%" stopColor="#FF453A" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={55} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v: any) => [`${formatCurrency(v)}`, 'Equity']} labelFormatter={l => `Date: ${l}`} />
                <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="pnl" stroke="#4ADE80" strokeWidth={2} fill="url(#equityGreen)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ TIME INTELLIGENCE ═══ */}
      <div className={`${GLASS} p-4 sm:p-5`}>
        <SectionHeader title="Time Intelligence" subtitle="When do you trade best?" icon={Clock} />

        {/* Best hours stat cards */}
        {bestHours.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {bestHours.map((h, i) => (
              <div key={h.hour} className={`${GLASS} p-4 flex items-center gap-3`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-[#4ADE80]/15 text-[#4ADE80]' : 'bg-[var(--border)] text-[var(--text-secondary)]'
                }`}>
                  #{i + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{h.label}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatPnl(h.avgPnl)} avg / {h.count} trades</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Trades by hour */}
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-3">Trades by Hour of Day</p>
            <div className="min-h-[280px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={activeHours} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v: any) => [v, 'Trades']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {activeHours.map((d, i) => (
                      <Cell key={i} fill={
                        bestHourByPnl && d.hour === bestHourByPnl.hour ? '#4ADE80' :
                        worstHourByPnl && d.hour === worstHourByPnl.hour ? '#FF453A' :
                        'rgba(255,255,255,0.2)'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* P&L by hour */}
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-3">P&L by Hour of Day</p>
            <div className="min-h-[280px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={activeHours} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={50}
                    tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                  <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v: any) => [formatCurrency(v), 'Net P&L']} />
                  <ReferenceLine y={0} stroke="var(--border)" />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {activeHours.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#4ADE80' : '#FF453A'} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Day of week */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--text-secondary)]">Trades by Day of Week</p>
              {bestDay && (
                <span className="text-xs text-[#4ADE80] font-semibold">Best: {bestDay.name}</span>
              )}
            </div>
            <div className="min-h-[280px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dayOfWeekStats} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v: any) => [v, 'Trades']} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {dayOfWeekStats.map((d, i) => (
                      <Cell key={i} fill={bestDay && d.day === bestDay.day ? '#4ADE80' : 'rgba(255,255,255,0.2)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-3">P&L by Day of Week</p>
            <div className="min-h-[280px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dayOfWeekStats} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={50}
                    tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                  <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v: any) => [formatCurrency(v), 'Net P&L']} />
                  <ReferenceLine y={0} stroke="var(--border)" />
                  <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                    {dayOfWeekStats.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#4ADE80' : '#FF453A'} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TRADE QUALITY ═══ */}
      <div className={`${GLASS} p-4 sm:p-5`}>
        <SectionHeader title="Trade Quality" subtitle="Execution metrics and streaks" icon={Target} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <MiniStat label="Avg Win" value={formatPnl(tradeQuality.avgWinPnl)} color="text-[#4ADE80]" />
          <MiniStat label="Avg Loss" value={formatPnl(tradeQuality.avgLossPnl)} color="text-[#FF453A]" />
          <MiniStat label="Largest Win" value={formatPnl(tradeQuality.largestWin)} color="text-[#4ADE80]" />
          <MiniStat label="Largest Loss" value={formatPnl(tradeQuality.largestLoss)} color="text-[#FF453A]" />
          <MiniStat label="Trades / Session" value={tradeQuality.tradesPerSession.toFixed(1)} />
          <MiniStat label="Avg Hold (Wins)" value={formatMinutes(tradeQuality.avgHoldTimeWins)} color="text-[#4ADE80]" />
          <MiniStat label="Avg Hold (Losses)" value={formatMinutes(tradeQuality.avgHoldTimeLosses)} color="text-[#FF453A]" />
          <MiniStat label="Max Win Streak" value={`${tradeQuality.maxConsecWins}`} color="text-[#4ADE80]" />
          <MiniStat label="Max Loss Streak" value={`${tradeQuality.maxConsecLosses}`} color="text-[#FF453A]" />
        </div>
      </div>

      {/* ═══ INSTRUMENT BREAKDOWN (enhanced) + SETUP ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={`${GLASS} p-4 sm:p-5`}>
          <SectionHeader title="Instrument Breakdown" subtitle="Avg P&L per instrument, sorted by profitability" icon={BarChart3} />
          {instrumentStats.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] text-sm py-8">No data</div>
          ) : (
            <>
              <div className="min-h-[280px]">
                <ResponsiveContainer width="100%" height={Math.max(280, instrumentStats.length * 40)}>
                  <BarChart data={instrumentStats} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                    <YAxis type="category" dataKey="symbol" tick={{ fill: '#fff', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM}
                      formatter={(v: any, name: any) => [formatCurrency(v), 'Avg P&L']}
                      labelFormatter={(label) => {
                        const inst = instrumentStats.find(i => i.symbol === label)
                        return inst ? `${label} \u2022 ${inst.count} trades \u2022 ${inst.winRate.toFixed(0)}% WR` : label
                      }}
                    />
                    <ReferenceLine x={0} stroke="var(--border)" />
                    <Bar dataKey="avgPnl" radius={[0, 6, 6, 0]} barSize={18}>
                      {instrumentStats.map((d, i) => <Cell key={i} fill={d.avgPnl >= 0 ? '#4ADE80' : '#FF453A'} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1">
                {instrumentStats.map(s => (
                  <div key={s.symbol} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-[var(--bg-card)]">
                    <span className="text-[var(--text-primary)] font-semibold">{s.symbol}</span>
                    <div className="flex items-center gap-4 text-[var(--text-secondary)]">
                      <span>{s.count} trades</span>
                      <span>{s.winRate.toFixed(0)}% WR</span>
                      <span className={s.avgPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}>{formatPnl(s.avgPnl)} avg</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={`${GLASS} p-4 sm:p-5`}>
          <SectionHeader title="P&L by Setup" subtitle="Performance by trading strategy" icon={Zap} />
          {setupData.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] text-sm py-8">No setup data &mdash; add setups to your trades</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {setupData.map(s => (
                <div key={s.setup} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--border)] hover:bg-[var(--border)] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{s.setup}</span>
                      <span className={`text-sm font-bold font-mono ${s.pnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                        {formatPnl(s.pnl)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                      <span>{s.count} trades</span>
                      <span>{s.wr.toFixed(0)}% WR</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ P&L DISTRIBUTION ═══ */}
      {pnlDist.length > 0 && (
        <div className={`${GLASS} p-4 sm:p-5`}>
          <SectionHeader title="P&L Distribution" subtitle="Frequency of trade outcomes by dollar range" icon={BarChart3} />
          <div className="min-h-[280px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pnlDist} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={Math.max(12, Math.min(40, 600 / pnlDist.length))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v: any) => [v, 'Trades']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pnlDist.map((d, i) => <Cell key={i} fill={d.from >= 0 ? '#4ADE80' : '#FF453A'} fillOpacity={0.7} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ LONG vs SHORT ═══ */}
      {(sideStats.long.count > 0 || sideStats.short.count > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(['long', 'short'] as const).map(side => {
            const s = sideStats[side]
            const label = side === 'long' ? 'Long' : 'Short'
            const color = side === 'long' ? '#4ADE80' : '#FF453A'
            if (s.count === 0) return null
            return (
              <div key={side} className={`${GLASS} p-5`} style={{ borderTop: `3px solid ${color}` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {side === 'long' ? <TrendingUp size={18} style={{ color }} /> : <TrendingDown size={18} style={{ color }} />}
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{label} Trades</h3>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{s.count} trades</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Net P&L</p>
                    <p className={`text-xl font-bold font-mono ${s.pnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                      {s.pnl >= 0 ? '+' : ''}{formatCurrency(s.pnl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Win Rate</p>
                    <p className={`text-xl font-bold ${s.winRate >= 50 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                      {s.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">W / L</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{s.wins}W / {s.losses}L</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Profit Factor</p>
                    <p className={`text-sm font-semibold ${s.pf >= 1 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                      {s.pf === Infinity ? '∞' : s.pf.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Avg Win</p>
                    <p className="text-sm font-semibold text-[#4ADE80] font-mono">+{formatCurrency(s.avgWin)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Avg Loss</p>
                    <p className="text-sm font-semibold text-[#FF453A] font-mono">-{formatCurrency(s.avgLoss)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ PSYCHOLOGICAL PATTERNS ═══ */}
      {sequenceStats && (
        <div className={`${GLASS} p-5`}>
          <SectionHeader title="Psychological Patterns" subtitle="How your results change based on previous outcomes" icon={Brain} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(74, 222, 128, 0.06)', border: '1px solid rgba(74, 222, 128, 0.15)' }}>
              <p className="text-xs font-semibold text-[#4ADE80] mb-3">After a Win</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Win Rate</span><span className={`font-bold ${sequenceStats.afterWin.winRate >= 50 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>{sequenceStats.afterWin.winRate.toFixed(0)}%</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Avg P&L</span><span className={`font-bold ${sequenceStats.afterWin.avgPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>{formatCurrency(sequenceStats.afterWin.avgPnl)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Sample</span><span className="text-[var(--text-secondary)]">{sequenceStats.afterWin.count} trades</span></div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255, 69, 58, 0.06)', border: '1px solid rgba(255, 69, 58, 0.15)' }}>
              <p className="text-xs font-semibold text-[#FF453A] mb-3">After a Loss</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Win Rate</span><span className={`font-bold ${sequenceStats.afterLoss.winRate >= 50 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>{sequenceStats.afterLoss.winRate.toFixed(0)}%</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Avg P&L</span><span className={`font-bold ${sequenceStats.afterLoss.avgPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>{formatCurrency(sequenceStats.afterLoss.avgPnl)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Sample</span><span className="text-[var(--text-secondary)]">{sequenceStats.afterLoss.count} trades</span></div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <p className="text-xs font-semibold text-[#F59E0B] mb-3">After 2 Losses in a Row</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Win Rate</span><span className={`font-bold ${sequenceStats.after2Loss.winRate >= 50 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>{sequenceStats.after2Loss.winRate.toFixed(0)}%</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Avg P&L</span><span className={`font-bold ${sequenceStats.after2Loss.avgPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>{formatCurrency(sequenceStats.after2Loss.avgPnl)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Sample</span><span className="text-[var(--text-secondary)]">{sequenceStats.after2Loss.count} trades</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRADE FREQUENCY + CONTRACT SIZE ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trade Frequency */}
        {frequencyStats.length > 0 && (
          <div className={`${GLASS} p-5`}>
            <SectionHeader title="Trade Frequency vs Performance" subtitle="Are more trades better?" icon={Zap} />
            <div className="space-y-3 mt-3">
              {frequencyStats.map(f => (
                <div key={f.label} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{f.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{f.days} sessions · {f.winRate.toFixed(0)}% WR</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${f.avgPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                      {f.avgPnl >= 0 ? '+' : ''}{formatCurrency(f.avgPnl)}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">avg/day</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contract Size Impact */}
        {contractStats.length > 1 && (
          <div className={`${GLASS} p-5`}>
            <SectionHeader title="Position Size Impact" subtitle="Performance by contract count" icon={Target} />
            <div className="space-y-3 mt-3">
              {contractStats.map(c => (
                <div key={c.contracts} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{c.contracts} contract{c.contracts > 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{c.count} trades · {c.winRate.toFixed(0)}% WR</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${c.avgPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                      {c.avgPnl >= 0 ? '+' : ''}{formatCurrency(c.avgPnl)}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">avg/trade</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ DRAWDOWN CHART ═══ */}
      {drawdownData.length > 0 && (
        <div className={`${GLASS} p-4 sm:p-5`}>
          <SectionHeader title="Drawdown" subtitle="Running drawdown over time (daily)" icon={TrendingDown} />
          <div className="min-h-[280px]">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={drawdownData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={55}
                  tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM}
                  formatter={(v: any) => [formatCurrency(v), 'Drawdown']}
                  labelFormatter={l => `Date: ${l}`} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Line type="monotone" dataKey="drawdown" stroke="#FF453A" strokeWidth={2} dot={false} />
                {maxDDPoint && (
                  <ReferenceDot x={maxDDPoint.date} y={maxDDPoint.drawdown} r={5} fill="#FF453A" stroke="#fff" strokeWidth={2}>
                  </ReferenceDot>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {maxDDPoint && (
            <div className="mt-2 text-xs text-[var(--text-secondary)] text-center">
              Max drawdown: <span className="text-[#FF453A] font-semibold">{formatCurrency(maxDDPoint.drawdown)}</span> on {maxDDPoint.date}
            </div>
          )}
        </div>
      )}

      {/* ═══ SESSION PERFORMANCE ═══ */}
      {sortedSessions.length > 0 && (
        <div className={`${GLASS} p-4 sm:p-5`}>
          <SectionHeader title="Session Performance" subtitle="Daily trading session breakdown" icon={Calendar} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {([
                    ['date', 'Date'],
                    ['trades', 'Trades'],
                    ['pnl', 'Net P&L'],
                    ['winRate', 'Win Rate'],
                  ] as const).map(([key, label]) => (
                    <th key={key}
                      className="text-left text-xs text-[var(--text-secondary)] font-medium py-3 px-3 cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                      onClick={() => toggleSort(key)}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {sessionSort === key && (
                          sessionSortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="text-left text-xs text-[var(--text-secondary)] font-medium py-3 px-3">Gross P&L</th>
                  <th className="text-left text-xs text-[var(--text-secondary)] font-medium py-3 px-3">Max Loss</th>
                </tr>
              </thead>
              <tbody>
                {sortedSessions.slice(0, 50).map(s => (
                  <tr key={s.date} className="border-b border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors">
                    <td className="py-2.5 px-3 text-[var(--text-primary)] font-medium">{s.date}</td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">{s.trades}</td>
                    <td className={`py-2.5 px-3 font-bold ${s.netPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                      {formatPnl(s.netPnl)}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">{s.winRate.toFixed(0)}%</td>
                    <td className={`py-2.5 px-3 ${s.grossPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                      {formatPnl(s.grossPnl)}
                    </td>
                    <td className="py-2.5 px-3 text-[#FF453A]">{formatCurrency(s.maxLoss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </ProGate>
  )
}
