'use client'
import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line, ReferenceLine, ReferenceDot
} from 'recharts'
import { useTrades } from '@/components/TradeContext'
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
  Clock, Calendar, Trophy, TrendingDown, BarChart3, Target,
  ArrowUpRight, ArrowDownRight, Timer, Repeat, Zap, Award,
  ChevronDown, ChevronUp
} from 'lucide-react'

const GLASS = 'bg-white/[0.04] backdrop-blur-[20px] border border-white/[0.06] rounded-2xl'
const TT_STYLE: React.CSSProperties = { backgroundColor: '#0c1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, color: '#fff', padding: '8px 12px' }

let _statRowIdx = 0;
function StatRow({ label, value, sub, green, red }: { label: string; value: string; sub?: string; green?: boolean; red?: boolean }) {
  const idx = _statRowIdx++;
  return (
    <div className={"flex items-center justify-between py-2.5 px-3 rounded-lg " + (idx % 2 === 0 ? "bg-white/[0.02]" : "")}>
      <span className="text-sm text-[#94A3B8]">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-bold ${green ? 'text-[#4ADE80]' : red ? 'text-[#FF453A]' : 'text-white'}`}>
          {value}
        </span>
        {sub && <p className="text-[10px] text-[#64748B] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 rounded-lg bg-white/[0.06]">
        <Icon className="w-4 h-4 text-[#94A3B8]" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <p className="text-xs text-[#64748B]">{subtitle}</p>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className={`${GLASS} p-4 flex flex-col gap-1`}>
      <span className="text-xs text-[#64748B]">{label}</span>
      <span className={`text-lg font-bold ${color || 'text-white'}`}>{value}</span>
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Deep dive into your trading performance</p>
      </div>

      {/* ═══ Score + Radar ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`${GLASS} p-6 flex flex-col items-center justify-center gap-4`}>
          <h2 className="text-sm font-bold text-white self-start">Trader Score</h2>
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx="45" cy="45" r="40" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray="251" strokeDashoffset={scoreOffset}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{analytics.score}</span>
              <span className="text-xs font-semibold text-[#64748B]">/ 100</span>
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
                  <span className="text-[#64748B]">{label}</span>
                  <span className="text-[#94A3B8] font-semibold">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4ADE80, #22c55e)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`lg:col-span-2 ${GLASS} p-5`}>
          <h2 className="text-sm font-bold text-white mb-1">Performance Radar</h2>
          <p className="text-xs text-[#64748B] mb-4">6 key performance dimensions, scored 0-100</p>
          <div className="h-72 min-h-[300px]">
            <RadarChartComp data={radarData} />
          </div>
        </div>
      </div>

      {/* ═══ Stats breakdown ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`${GLASS} p-5`}>
          <h2 className="text-sm font-bold text-white mb-4">Trade Stats</h2>
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

        <div className={`${GLASS} p-5`}>
          <h2 className="text-sm font-bold text-white mb-4">Risk & Drawdown</h2>
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

        <div className={`${GLASS} p-5`}>
          <h2 className="text-sm font-bold text-white mb-4">Streaks & Patterns</h2>
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

      {/* ═══ TIME INTELLIGENCE ═══ */}
      <div className={`${GLASS} p-5`}>
        <SectionHeader title="Time Intelligence" subtitle="When do you trade best?" icon={Clock} />

        {/* Best hours stat cards */}
        {bestHours.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {bestHours.map((h, i) => (
              <div key={h.hour} className={`${GLASS} p-4 flex items-center gap-3`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-[#4ADE80]/15 text-[#4ADE80]' : 'bg-white/[0.06] text-[#94A3B8]'
                }`}>
                  #{i + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{h.label}</p>
                  <p className="text-xs text-[#64748B]">{formatPnl(h.avgPnl)} avg / {h.count} trades</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Trades by hour */}
          <div>
            <p className="text-xs text-[#64748B] mb-3">Trades by Hour of Day</p>
            <div className="min-h-[280px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={activeHours} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={TT_STYLE} formatter={(v: any) => [v, 'Trades']} />
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
            <p className="text-xs text-[#64748B] mb-3">P&L by Hour of Day</p>
            <div className="min-h-[280px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={activeHours} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={50}
                    tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                  <Tooltip contentStyle={TT_STYLE} formatter={(v: any) => [formatCurrency(v), 'Net P&L']} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
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
              <p className="text-xs text-[#64748B]">Trades by Day of Week</p>
              {bestDay && (
                <span className="text-xs text-[#4ADE80] font-semibold">Best: {bestDay.name}</span>
              )}
            </div>
            <div className="min-h-[280px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dayOfWeekStats} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={TT_STYLE} formatter={(v: any) => [v, 'Trades']} />
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
            <p className="text-xs text-[#64748B] mb-3">P&L by Day of Week</p>
            <div className="min-h-[280px]">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dayOfWeekStats} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={50}
                    tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                  <Tooltip contentStyle={TT_STYLE} formatter={(v: any) => [formatCurrency(v), 'Net P&L']} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
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
      <div className={`${GLASS} p-5`}>
        <SectionHeader title="Trade Quality" subtitle="Execution metrics and streaks" icon={Target} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
        <div className={`${GLASS} p-5`}>
          <SectionHeader title="Instrument Breakdown" subtitle="Avg P&L per instrument, sorted by profitability" icon={BarChart3} />
          {instrumentStats.length === 0 ? (
            <div className="text-center text-[#64748B] text-sm py-8">No data</div>
          ) : (
            <>
              <div className="min-h-[280px]">
                <ResponsiveContainer width="100%" height={Math.max(280, instrumentStats.length * 40)}>
                  <BarChart data={instrumentStats} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                    <YAxis type="category" dataKey="symbol" tick={{ fill: '#fff', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip contentStyle={TT_STYLE}
                      formatter={(v: any, name: any) => [formatCurrency(v), 'Avg P&L']}
                      labelFormatter={(label) => {
                        const inst = instrumentStats.find(i => i.symbol === label)
                        return inst ? `${label} \u2022 ${inst.count} trades \u2022 ${inst.winRate.toFixed(0)}% WR` : label
                      }}
                    />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
                    <Bar dataKey="avgPnl" radius={[0, 6, 6, 0]} barSize={18}>
                      {instrumentStats.map((d, i) => <Cell key={i} fill={d.avgPnl >= 0 ? '#4ADE80' : '#FF453A'} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1">
                {instrumentStats.map(s => (
                  <div key={s.symbol} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-white/[0.02]">
                    <span className="text-white font-semibold">{s.symbol}</span>
                    <div className="flex items-center gap-4 text-[#64748B]">
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

        <div className={`${GLASS} p-5`}>
          <SectionHeader title="P&L by Setup" subtitle="Performance by trading strategy" icon={Zap} />
          {setupData.length === 0 ? (
            <div className="text-center text-[#64748B] text-sm py-8">No setup data &mdash; add setups to your trades</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {setupData.map(s => (
                <div key={s.setup} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-white truncate">{s.setup}</span>
                      <span className={`text-sm font-bold font-mono ${s.pnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                        {formatPnl(s.pnl)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#64748B]">
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
        <div className={`${GLASS} p-5`}>
          <SectionHeader title="P&L Distribution" subtitle="Frequency of trade outcomes by dollar range" icon={BarChart3} />
          <div className="min-h-[280px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pnlDist} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={Math.max(12, Math.min(40, 600 / pnlDist.length))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={TT_STYLE} formatter={(v: any) => [v, 'Trades']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pnlDist.map((d, i) => <Cell key={i} fill={d.from >= 0 ? '#4ADE80' : '#FF453A'} fillOpacity={0.7} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ DRAWDOWN CHART ═══ */}
      {drawdownData.length > 0 && (
        <div className={`${GLASS} p-5`}>
          <SectionHeader title="Drawdown" subtitle="Running drawdown over time (daily)" icon={TrendingDown} />
          <div className="min-h-[280px]">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={drawdownData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={55}
                  tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={TT_STYLE}
                  formatter={(v: any) => [formatCurrency(v), 'Drawdown']}
                  labelFormatter={l => `Date: ${l}`} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Line type="monotone" dataKey="drawdown" stroke="#FF453A" strokeWidth={2} dot={false} />
                {maxDDPoint && (
                  <ReferenceDot x={maxDDPoint.date} y={maxDDPoint.drawdown} r={5} fill="#FF453A" stroke="#fff" strokeWidth={2}>
                  </ReferenceDot>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {maxDDPoint && (
            <div className="mt-2 text-xs text-[#64748B] text-center">
              Max drawdown: <span className="text-[#FF453A] font-semibold">{formatCurrency(maxDDPoint.drawdown)}</span> on {maxDDPoint.date}
            </div>
          )}
        </div>
      )}

      {/* ═══ SESSION PERFORMANCE ═══ */}
      {sortedSessions.length > 0 && (
        <div className={`${GLASS} p-5`}>
          <SectionHeader title="Session Performance" subtitle="Daily trading session breakdown" icon={Calendar} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {([
                    ['date', 'Date'],
                    ['trades', 'Trades'],
                    ['pnl', 'Net P&L'],
                    ['winRate', 'Win Rate'],
                  ] as const).map(([key, label]) => (
                    <th key={key}
                      className="text-left text-xs text-[#64748B] font-medium py-3 px-3 cursor-pointer hover:text-white transition-colors select-none"
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
                  <th className="text-left text-xs text-[#64748B] font-medium py-3 px-3">Gross P&L</th>
                  <th className="text-left text-xs text-[#64748B] font-medium py-3 px-3">Max Loss</th>
                </tr>
              </thead>
              <tbody>
                {sortedSessions.slice(0, 50).map(s => (
                  <tr key={s.date} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-white font-medium">{s.date}</td>
                    <td className="py-2.5 px-3 text-[#94A3B8]">{s.trades}</td>
                    <td className={`py-2.5 px-3 font-bold ${s.netPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                      {formatPnl(s.netPnl)}
                    </td>
                    <td className="py-2.5 px-3 text-[#94A3B8]">{s.winRate.toFixed(0)}%</td>
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
  )
}
