'use client'
import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { useTrades } from '@/components/TradeContext'
import { useAccountFilter } from '@/components/AccountFilterContext'
import AccountSelector from '@/components/AccountSelector'
import { calcAnalytics, calcDailyStats, formatCurrency, formatPnl } from '@/lib/calculations'
import RadarChartComp from '@/components/charts/RadarChart'

let _statRowIdx = 0;
function StatRow({ label, value, sub, green, red }: { label: string; value: string; sub?: string; green?: boolean; red?: boolean }) {
  const idx = _statRowIdx++;
  return (
    <div className={"flex items-center justify-between py-2.5 px-3 rounded-lg " + (idx % 2 === 0 ? "bg-white/[0.02]" : "")}>
      <span className="text-sm text-[#6B7E91] dark:text-[#94A3B8]">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-bold ${green ? 'text-[#2D8B4E]' : red ? 'text-[#EF4444]' : 'text-[#1E2D3D] dark:text-[#F1F5F9]'}`}>
          {value}
        </span>
        {sub && <p className="text-[10px] text-[#64748B] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
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

  // Radar data (all scored 0–100)
  const radarData = [
    { metric: 'Win Rate', value: Math.min(analytics.winRate / 70 * 100, 100), fullMark: 100 },
    { metric: 'Profit Factor', value: Math.min(analytics.profitFactor / 3 * 100, 100), fullMark: 100 },
    { metric: 'Consistency', value: analytics.consistency, fullMark: 100 },
    { metric: 'Risk:Reward', value: Math.min(analytics.avgRR / 2 * 100, 100), fullMark: 100 },
    { metric: 'Drawdown Ctrl', value: Math.max(0, 100 - analytics.maxDrawdownPct * 5), fullMark: 100 },
    { metric: 'Recovery', value: Math.min(analytics.recoveryFactor / 5 * 100, 100), fullMark: 100 },
  ]

  // Symbol breakdown
  const symbolMap = new Map<string, { count: number; pnl: number }>()
  trades.forEach(t => {
    if (t.status !== 'closed') return
    const s = symbolMap.get(t.symbol) || { count: 0, pnl: 0 }
    symbolMap.set(t.symbol, { count: s.count + 1, pnl: s.pnl + t.netPnl })
  })
  const symbolData = Array.from(symbolMap.entries())
    .map(([sym, d]) => ({ sym, ...d }))
    .sort((a, b) => b.pnl - a.pnl)

  // Setup breakdown
  const setupMap = new Map<string, { count: number; pnl: number; wins: number }>()
  trades.forEach(t => {
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

  // Hour distribution
  const hourMap = new Map<number, { count: number; pnl: number }>()
  trades.forEach(t => {
    if (t.status !== 'closed' || !t.entryTime) return
    const h = parseInt(t.entryTime.split(':')[0])
    const s = hourMap.get(h) || { count: 0, pnl: 0 }
    hourMap.set(h, { count: s.count + 1, pnl: s.pnl + t.netPnl })
  })
  const hourData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, '0')}:00`,
    ...( hourMap.get(h) || { count: 0, pnl: 0 })
  })).filter(d => d.count > 0)

  // Score breakdown
  const scoreColor = analytics.score >= 70 ? '#2D8B4E' : analytics.score >= 50 ? '#F59E0B' : '#EF4444'
  const scoreOffset = 251 - (analytics.score / 100) * 251

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Deep dive into your trading performance</p>
      </div>

      {/* Score + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Score card */}
        <div className="glass-card p-6 flex flex-col items-center justify-center gap-4">
          <h2 className="section-title self-start">Trader Score</h2>
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="45" cy="45" r="40"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="251"
                strokeDashoffset={scoreOffset}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-[#1E2D3D] dark:text-[#F1F5F9]">{analytics.score}</span>
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
                  <span className="text-[#6B7E91] dark:text-[#94A3B8] font-semibold">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #2D8B4E, #4ADE50)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="section-title mb-1">Performance Radar</h2>
          <p className="text-xs text-[#64748B] mb-4">6 key performance dimensions, scored 0–100</p>
          <div className="h-72 min-h-[300px]">
            <RadarChartComp data={radarData} />
          </div>
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trade stats */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Trade Stats</h2>
          <div>
            <StatRow label="Total Trades" value={`${analytics.totalTrades}`} />
            <StatRow label="Win / Loss" value={`${analytics.winCount} / ${analytics.lossCount}`} />
            <StatRow label="Win Rate" value={`${analytics.winRate.toFixed(1)}%`} green={analytics.winRate >= 55} red={analytics.winRate < 45} />
            <StatRow label="Profit Factor" value={analytics.profitFactor >= 999 ? '∞' : analytics.profitFactor.toFixed(2)} green={analytics.profitFactor >= 1.5} red={analytics.profitFactor < 1} />
            <StatRow label="Avg Win" value={formatCurrency(analytics.avgWin)} green />
            <StatRow label="Avg Loss" value={formatCurrency(analytics.avgLoss)} red />
            <StatRow label="Avg R:R" value={analytics.avgRR.toFixed(2)} green={analytics.avgRR >= 1} red={analytics.avgRR < 0.8} />
            <StatRow label="Total Fees" value={formatCurrency(analytics.totalFees)} />
            <StatRow label="Net P&L" value={formatCurrency(analytics.netPnl)} green={analytics.netPnl >= 0} red={analytics.netPnl < 0} />
          </div>
        </div>

        {/* Risk stats */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Risk & Drawdown</h2>
          <div>
            <StatRow label="Max Drawdown ($)" value={formatCurrency(analytics.maxDrawdown)} red />
            <StatRow label="Max Drawdown (%)" value={`${analytics.maxDrawdownPct.toFixed(2)}%`} red />
            <StatRow label="Recovery Factor" value={analytics.recoveryFactor >= 999 ? '∞' : analytics.recoveryFactor.toFixed(2)} green={analytics.recoveryFactor >= 2} />
            <StatRow label="Sharpe Ratio" value={analytics.sharpeRatio.toFixed(2)} green={analytics.sharpeRatio >= 1} />
            <StatRow label="Best Day" value={formatPnl(analytics.bestDay)} green />
            <StatRow label="Worst Day" value={formatPnl(analytics.worstDay)} red />
            <StatRow label="Consistency" value={`${analytics.consistency.toFixed(1)}%`} green={analytics.consistency >= 60} />
            <StatRow label="Avg Trades/Day" value={analytics.avgTradesPerDay.toFixed(1)} />
          </div>
        </div>

        {/* Streak stats */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Streaks & Patterns</h2>
          <div>
            <StatRow
              label="Current Streak"
              value={analytics.currentStreak === 0 ? '—' : analytics.currentStreak > 0 ? `${analytics.currentStreak} wins` : `${Math.abs(analytics.currentStreak)} losses`}
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

      {/* Symbol + Setup breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Symbol P&L */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-1">P&L by Symbol</h2>
          <p className="text-xs text-[#64748B] mb-4">Net P&L breakdown per instrument</p>
          {symbolData.length === 0 ? (
            <div className="text-center text-[#64748B] text-sm py-8">No data</div>
          ) : (
            <div className="h-60 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symbolData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9EB0C0', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                  <YAxis type="category" dataKey="sym" tick={{ fill: '#1E2D3D', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v: any) => [formatCurrency(v), 'Net P&L']} contentStyle={{ borderRadius: 12, border: '1px solid #E4E9F0' }} />
                  <Bar dataKey="pnl" radius={[0, 6, 6, 0]} barSize={18}>
                    {symbolData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#4ADE50' : '#EF4444'} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Setup breakdown */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-1">P&L by Setup</h2>
          <p className="text-xs text-[#64748B] mb-4">Performance by trading strategy</p>
          {setupData.length === 0 ? (
            <div className="text-center text-[#64748B] text-sm py-8">No setup data — add setups to your trades</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {setupData.map(s => (
                <div key={s.setup} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-[#1E2D3D] dark:text-[#F1F5F9] truncate">{s.setup}</span>
                      <span className={`text-sm font-bold font-mono ${s.pnl >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
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

      {/* Time of day */}
      {hourData.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="section-title mb-1">P&L by Time of Day</h2>
          <p className="text-xs text-[#64748B] mb-4">When do you trade best?</p>
          <div className="h-48 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: '#9EB0C0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9EB0C0', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} width={55} />
                <Tooltip formatter={(v: any) => [formatCurrency(v), 'Net P&L']} contentStyle={{ borderRadius: 12, border: '1px solid #E4E9F0' }} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {hourData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#4ADE50' : '#EF4444'} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
