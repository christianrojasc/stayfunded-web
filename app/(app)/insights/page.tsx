'use client'
import { useMemo, useState, useEffect } from 'react'
import { useTrades } from '@/components/TradeContext'
import { useAccountFilter } from '@/components/AccountFilterContext'
import AccountSelector from '@/components/AccountSelector'
import { generateInsights, InsightsResult, Insight, WhatIfScenario, TimeHeatmapCell, InstrumentEdge } from '@/lib/insights'
import { Trade, DailyNote } from '@/lib/types'
import * as dl from '@/lib/data-layer'
import {
  Brain, AlertTriangle, AlertCircle, Info, CheckCircle, TrendingUp, TrendingDown,
  Zap, Clock, Shield, BarChart3, Target, Flame, Activity, DollarSign, Calendar,
  ArrowUpRight, ArrowDownRight, Timer, Award, Crosshair
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import ProGate from '@/components/ProGate'

const CARD = 'glass-card'
const TT: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
  borderRadius: 12, fontSize: 12, color: 'var(--text-primary)', padding: '8px 12px',
}

// ── Error Boundary ──
import React from 'react'
class InsightsErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return <div className="p-8 text-center text-[var(--text-muted)]">Something went wrong loading insights.</div>
    return this.props.children
  }
}

export default function InsightsPage() {
  return (
    <InsightsErrorBoundary>
      <ProGate feature="insights" mode="block">
        <InsightsPageInner />
      </ProGate>
    </InsightsErrorBoundary>
  )
}

function InsightsPageInner() {
  const { trades } = useTrades()
  const { selectedId: selectedAccountId } = useAccountFilter()
  const [notes, setNotes] = useState<DailyNote[]>([])

  useEffect(() => {
    dl.getNotes().then(setNotes).catch(() => setNotes([]))
  }, [])

  const filtered = useMemo(() => {
    if (!selectedAccountId || selectedAccountId === 'all') return trades
    return trades.filter(t => t.accountId === selectedAccountId)
  }, [trades, selectedAccountId])

  const result = useMemo(() => generateInsights(filtered, notes), [filtered, notes])

  const { score, insights, whatIfs, heatmap, instruments, behaviorData } = result

  const closed = useMemo(() => filtered.filter(t => t.status === 'closed'), [filtered])
  const totalPnl = useMemo(() => closed.reduce((s, t) => s + t.netPnl, 0), [closed])
  const wins = useMemo(() => closed.filter(t => t.netPnl > 0), [closed])
  const losses = useMemo(() => closed.filter(t => t.netPnl < 0), [closed])
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.netPnl, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.netPnl, 0) / losses.length) : 0
  const rrRatio = avgLoss > 0 ? avgWin / avgLoss : 0
  const profitFactor = losses.length > 0 && losses.reduce((s, t) => s + t.netPnl, 0) !== 0
    ? wins.reduce((s, t) => s + t.netPnl, 0) / Math.abs(losses.reduce((s, t) => s + t.netPnl, 0))
    : 0

  const dowStats = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const map = new Map<number, { pnl: number; count: number; wins: number }>()
    closed.forEach(t => {
      const d = new Date((t.sessionDate || t.date) + 'T12:00:00')
      const dow = d.getDay()
      const stat = map.get(dow) || { pnl: 0, count: 0, wins: 0 }
      stat.pnl += t.netPnl
      stat.count++
      if (t.netPnl > 0) stat.wins++
      map.set(dow, stat)
    })
    return [1, 2, 3, 4, 5].map(dow => ({
      day: days[dow],
      pnl: map.get(dow)?.pnl || 0,
      trades: map.get(dow)?.count || 0,
      winRate: map.get(dow) ? ((map.get(dow)!.wins / map.get(dow)!.count) * 100) : 0,
    }))
  }, [closed])

  const hourStats = useMemo(() => {
    const map = new Map<number, { pnl: number; count: number; wins: number }>()
    closed.forEach(t => {
      if (!t.entryTime) return
      const hour = parseInt(t.entryTime.split(':')[0], 10)
      if (isNaN(hour)) return
      const stat = map.get(hour) || { pnl: 0, count: 0, wins: 0 }
      stat.pnl += t.netPnl
      stat.count++
      if (t.netPnl > 0) stat.wins++
      map.set(hour, stat)
    })
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, stat]) => ({
        hour: `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`,
        pnl: stat.pnl,
        trades: stat.count,
        winRate: stat.count > 0 ? (stat.wins / stat.count) * 100 : 0,
      }))
  }, [closed])

  const streaks = useMemo(() => {
    let currentWin = 0, currentLoss = 0, bestWin = 0, worstLoss = 0
    closed.forEach(t => {
      if (t.netPnl > 0) { currentWin++; currentLoss = 0; bestWin = Math.max(bestWin, currentWin) }
      else { currentLoss++; currentWin = 0; worstLoss = Math.max(worstLoss, currentLoss) }
    })
    return { bestWin, worstLoss }
  }, [closed])

  const topInsights = useMemo(() => {
    return [...insights].sort((a, b) => {
      const sev: Record<string, number> = { critical: 0, warning: 1, info: 2, positive: 3 }
      return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2)
    }).slice(0, 6)
  }, [insights])

  // ── Edge Detection: symbol + side + time combos ──
  const edges = useMemo(() => {
    const combos = new Map<string, { pnl: number; count: number; wins: number; symbol: string; side: string; timeSlot: string }>()
    closed.forEach(t => {
      const hour = t.entryTime ? parseInt(t.entryTime.split(':')[0], 10) : null
      const timeSlot = hour !== null && !isNaN(hour)
        ? (hour < 10 ? 'Morning' : hour < 12 ? 'Midday' : 'Afternoon')
        : 'Unknown'
      const key = `${t.symbol}|${t.side}|${timeSlot}`
      const e = combos.get(key) || { pnl: 0, count: 0, wins: 0, symbol: t.symbol, side: t.side, timeSlot }
      e.pnl += t.netPnl
      e.count++
      if (t.netPnl > 0) e.wins++
      combos.set(key, e)
    })
    return [...combos.values()]
      .filter(e => e.count >= 3) // need enough data
      .map(e => ({ ...e, winRate: (e.wins / e.count) * 100, avgPnl: e.pnl / e.count }))
      .sort((a, b) => b.pnl - a.pnl)
  }, [closed])

  const bestEdges = edges.filter(e => e.pnl > 0).slice(0, 3)
  const worstEdges = edges.filter(e => e.pnl < 0).sort((a, b) => a.pnl - b.pnl).slice(0, 3)

  // ── Side Analysis: Long vs Short ──
  const sideStats = useMemo(() => {
    const longs = closed.filter(t => t.side === 'Long')
    const shorts = closed.filter(t => t.side === 'Short')
    const calc = (arr: Trade[]) => {
      const w = arr.filter(t => t.netPnl > 0)
      return {
        count: arr.length,
        pnl: arr.reduce((s, t) => s + t.netPnl, 0),
        winRate: arr.length > 0 ? (w.length / arr.length) * 100 : 0,
        avgPnl: arr.length > 0 ? arr.reduce((s, t) => s + t.netPnl, 0) / arr.length : 0,
      }
    }
    return { long: calc(longs), short: calc(shorts) }
  }, [closed])

  // ── Trend: Last 7 days vs Previous 7 ──
  const trendComparison = useMemo(() => {
    const sessionDates = [...new Set(closed.map(t => t.sessionDate || t.date))].sort().reverse()
    const recentDates = new Set(sessionDates.slice(0, 7))
    const prevDates = new Set(sessionDates.slice(7, 14))
    const calc = (dates: Set<string>) => {
      const t = closed.filter(tr => dates.has(tr.sessionDate || tr.date))
      const w = t.filter(tr => tr.netPnl > 0)
      return {
        pnl: t.reduce((s, tr) => s + tr.netPnl, 0),
        trades: t.length,
        winRate: t.length > 0 ? (w.length / t.length) * 100 : 0,
        days: dates.size,
      }
    }
    return { recent: calc(recentDates), previous: calc(prevDates) }
  }, [closed])

  // ── P&L Distribution Histogram ──
  const pnlDistribution = useMemo(() => {
    if (closed.length === 0) return []
    const pnls = closed.map(t => t.netPnl)
    const min = Math.min(...pnls)
    const max = Math.max(...pnls)
    const range = max - min
    const bucketSize = range / 12 || 1
    const buckets = new Map<number, { min: number; max: number; count: number; isProfit: boolean }>()
    pnls.forEach(p => {
      const idx = Math.floor((p - min) / bucketSize)
      const key = Math.min(idx, 11)
      const b = buckets.get(key) || { min: min + key * bucketSize, max: min + (key + 1) * bucketSize, count: 0, isProfit: (min + key * bucketSize + min + (key + 1) * bucketSize) / 2 >= 0 }
      b.count++
      buckets.set(key, b)
    })
    return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([, b]) => ({
      range: `$${b.min.toFixed(0)}`,
      count: b.count,
      isProfit: b.isProfit,
    }))
  }, [closed])

  // ── AI Coach Summary ──
  const coachSummary = useMemo(() => {
    const parts: string[] = []

    // Overall assessment
    if (totalPnl > 0) {
      parts.push(`You're net positive at +$${totalPnl.toFixed(0)} across ${closed.length} trades — that's solid.`)
    } else {
      parts.push(`You're currently down $${Math.abs(totalPnl).toFixed(0)} across ${closed.length} trades.`)
    }

    // Win rate assessment
    if (winRate >= 60) parts.push(`Your ${winRate.toFixed(0)}% win rate is strong.`)
    else if (winRate >= 45) parts.push(`Your ${winRate.toFixed(0)}% win rate is decent, but there's room to improve trade selection.`)
    else parts.push(`At ${winRate.toFixed(0)}% win rate, you need your winners to be significantly larger than losers to stay profitable.`)

    // R:R assessment
    if (rrRatio >= 2) parts.push(`Great R:R of ${rrRatio.toFixed(1)}:1 — you're letting winners run.`)
    else if (rrRatio >= 1) parts.push(`Your R:R of ${rrRatio.toFixed(1)}:1 is acceptable but could be better.`)
    else if (avgLoss > 0) parts.push(`Warning: your average loss ($${avgLoss.toFixed(0)}) is bigger than your average win ($${avgWin.toFixed(0)}). You might be cutting winners short.`)

    // Best edge
    if (bestEdges.length > 0) {
      const e = bestEdges[0]
      parts.push(`Your best edge is ${e.symbol} ${e.side} in the ${e.timeSlot.toLowerCase()} — ${e.winRate.toFixed(0)}% win rate with +$${e.pnl.toFixed(0)} total.`)
    }

    // Worst pattern
    if (worstEdges.length > 0) {
      const e = worstEdges[0]
      parts.push(`Avoid ${e.symbol} ${e.side} in the ${e.timeSlot.toLowerCase()} — it's costing you $${Math.abs(e.pnl).toFixed(0)}.`)
    }

    // Behavior flags
    if (behaviorData) {
      if (behaviorData.revengeTradeCount > 0) parts.push(`You have ${behaviorData.revengeTradeCount} revenge trades averaging $${behaviorData.revengeAvgPnl.toFixed(0)} each — ${behaviorData.revengeTradeCount > 2 ? 'this is your biggest leak' : 'watch this pattern'}.`)
      if (behaviorData.sizeEscalationEvents > 0) parts.push(`${behaviorData.sizeEscalationEvents} sessions where you escalated size mid-session — bigger size often means worse decisions.`)
      if (behaviorData.avgHoldLosers > behaviorData.avgHoldWinners * 1.5 && behaviorData.avgHoldWinners > 0) parts.push(`You hold losers ${(behaviorData.avgHoldLosers / behaviorData.avgHoldWinners).toFixed(1)}x longer than winners — flip that ratio.`)
      if (behaviorData.ultraShortTrades > 0) parts.push(`${behaviorData.ultraShortTrades} trades held under 5 seconds — that's compulsive clicking, not strategy.`)
      if (behaviorData.rapidFireClusters > 0) parts.push(`${behaviorData.rapidFireClusters} rapid-fire clusters (3+ trades in 2 min) — slow down.`)
      if (behaviorData.lateSessionPnl < -100 && behaviorData.lateSessionCount >= 3) parts.push(`Late-night trading (after 10 PM) is costing you $${Math.abs(behaviorData.lateSessionPnl).toFixed(0)}.`)
      if (behaviorData.overtradeDays > 2) parts.push(`You overtrade on ${behaviorData.overtradeDays} days, which drags your average down.`)
      if (behaviorData.tiltEvents > 0) parts.push(`${behaviorData.tiltEvents} tilt events (3+ consecutive losses) detected. Consider stepping away after 2 losses.`)
    }

    // Trend
    if (trendComparison.previous.trades > 0) {
      const pnlDelta = trendComparison.recent.pnl - trendComparison.previous.pnl
      if (pnlDelta > 0) parts.push(`Good news: your last 7 sessions are up $${pnlDelta.toFixed(0)} vs the previous 7.`)
      else if (pnlDelta < 0) parts.push(`Your last 7 sessions are down $${Math.abs(pnlDelta).toFixed(0)} vs the previous 7 — something changed.`)
    }

    // Recommendations
    const recs: string[] = []
    if (behaviorData && behaviorData.revengeTradeCount > 0) recs.push('Implement a 10-minute cooldown after any losing trade — never re-enter immediately')
    if (behaviorData && behaviorData.sizeEscalationEvents > 0) recs.push('Stick to your base position size — only scale up with a pre-planned reason')
    if (behaviorData && behaviorData.avgHoldLosers > behaviorData.avgHoldWinners * 2 && behaviorData.avgHoldWinners > 0) recs.push('Set a hard time stop — if a trade hasn\'t worked within your average winner hold time, cut it')
    if (behaviorData && behaviorData.lateSessionPnl < -100 && behaviorData.lateSessionCount >= 3) recs.push('Set a hard 10 PM cutoff — your late-night trading is giving back gains')
    if (bestEdges.length > 0) recs.push(`Focus on ${bestEdges[0].symbol} ${bestEdges[0].side} setups in the ${bestEdges[0].timeSlot.toLowerCase()}`)
    if (worstEdges.length > 0) recs.push(`Stop trading ${worstEdges[0].symbol} ${worstEdges[0].side} in the ${worstEdges[0].timeSlot.toLowerCase()}`)
    if (rrRatio < 1 && avgLoss > 0 && recs.length < 4) recs.push('Tighten stops or let winners run longer to improve R:R')

    const bestDow = dowStats.reduce((best, d) => d.pnl > best.pnl ? d : best, dowStats[0])
    const worstDow = dowStats.reduce((worst, d) => d.pnl < worst.pnl ? d : worst, dowStats[0])
    if (worstDow.pnl < -50) recs.push(`Consider sitting out on ${worstDow.day}s — they cost you $${Math.abs(worstDow.pnl).toFixed(0)}`)

    return { text: parts.join(' '), recommendations: recs.slice(0, 4) }
  }, [totalPnl, closed, winRate, rrRatio, avgWin, avgLoss, bestEdges, worstEdges, behaviorData, trendComparison, dowStats])

  if (filtered.length < 3) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Insights</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">AI-powered analysis of your trading</p>
          </div>
          <AccountSelector />
        </div>
        <div className={`${CARD} p-12 text-center`}>
          <Brain size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Need more data</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">Import at least 3 trades to unlock insights. The more trades you have, the better the analysis.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Insights</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{closed.length} trades analyzed</p>
        </div>
        <AccountSelector />
      </div>

      {/* ── AI Coach Summary ── */}
      <div className={`${CARD} p-5`} style={{ borderLeft: '3px solid #8B5CF6' }}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 flex items-center justify-center flex-shrink-0">
            <Brain size={18} className="text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">AI Coach Analysis</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{coachSummary.text}</p>
            {coachSummary.recommendations.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Recommendations</p>
                {coachSummary.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#8B5CF6]/15 text-[#8B5CF6] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-[var(--text-primary)]">{r}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 1: Score + Key Metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Score Card */}
        <div className={`${CARD} p-6 lg:col-span-4 flex flex-col items-center justify-center`}>
          <ScoreCircle score={score.overall} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full max-w-[240px]">
            <SubScore label="Risk Mgmt" value={score.riskManagement} icon={Shield} />
            <SubScore label="Consistency" value={score.consistency} icon={Target} />
            <SubScore label="Edge" value={score.edge} icon={Crosshair} />
            <SubScore label="Discipline" value={score.discipline} icon={Flame} />
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Net P&L" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`} color={totalPnl >= 0 ? 'green' : 'red'} icon={DollarSign} />
          <MetricCard label="Win Rate" value={`${winRate.toFixed(1)}%`} color={winRate >= 50 ? 'green' : 'red'} icon={Target} />
          <MetricCard label="Profit Factor" value={profitFactor.toFixed(2)} color={profitFactor >= 1 ? 'green' : 'red'} icon={TrendingUp} />
          <MetricCard label="Avg R:R" value={`${rrRatio.toFixed(2)}:1`} color={rrRatio >= 1 ? 'green' : 'red'} icon={Activity} />
          <MetricCard label="Avg Win" value={`+$${avgWin.toFixed(0)}`} color="green" icon={ArrowUpRight} />
          <MetricCard label="Avg Loss" value={`-$${avgLoss.toFixed(0)}`} color="red" icon={ArrowDownRight} />
          <MetricCard label="Best Streak" value={`${streaks.bestWin} wins`} color="green" icon={Flame} />
          <MetricCard label="Worst Streak" value={`${streaks.worstLoss} losses`} color="red" icon={AlertTriangle} />
        </div>
      </div>

      {/* ── Row 2: Key Insights ── */}
      {topInsights.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Brain size={18} className="text-[var(--text-muted)]" /> Key Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topInsights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* ── Trend Comparison + Side Analysis ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Week-over-Week Trend */}
        {trendComparison.previous.trades > 0 && (
          <div className={`${CARD} p-5`}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--text-muted)]" /> Trend: Last 7 vs Previous 7 Sessions
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <TrendMetric label="P&L" recent={`${trendComparison.recent.pnl >= 0 ? '+' : ''}$${trendComparison.recent.pnl.toFixed(0)}`} previous={`${trendComparison.previous.pnl >= 0 ? '+' : ''}$${trendComparison.previous.pnl.toFixed(0)}`} improving={trendComparison.recent.pnl > trendComparison.previous.pnl} />
              <TrendMetric label="Win Rate" recent={`${trendComparison.recent.winRate.toFixed(0)}%`} previous={`${trendComparison.previous.winRate.toFixed(0)}%`} improving={trendComparison.recent.winRate > trendComparison.previous.winRate} />
              <TrendMetric label="Trades" recent={`${trendComparison.recent.trades}`} previous={`${trendComparison.previous.trades}`} improving={trendComparison.recent.trades <= trendComparison.previous.trades} />
            </div>
          </div>
        )}

        {/* Long vs Short */}
        <div className={`${CARD} p-5`}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Activity size={16} className="text-[var(--text-muted)]" /> Long vs Short
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <SideCard side="Long" stats={sideStats.long} />
            <SideCard side="Short" stats={sideStats.short} />
          </div>
        </div>
      </div>

      {/* ── Edge Detection ── */}
      {(bestEdges.length > 0 || worstEdges.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bestEdges.length > 0 && (
            <div className={`${CARD} p-5`}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Award size={16} className="text-[#4ADE80]" /> Your Best Edges
              </h3>
              <div className="space-y-2">
                {bestEdges.map((e, i) => (
                  <EdgeRow key={i} edge={e} rank={i + 1} type="best" />
                ))}
              </div>
            </div>
          )}
          {worstEdges.length > 0 && (
            <div className={`${CARD} p-5`}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#FF453A]" /> Your Worst Patterns
              </h3>
              <div className="space-y-2">
                {worstEdges.map((e, i) => (
                  <EdgeRow key={i} edge={e} rank={i + 1} type="worst" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── P&L Distribution ── */}
      {pnlDistribution.length > 0 && (
        <div className={`${CARD} p-5`}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--text-muted)]" /> P&L Distribution
            <span className="text-[10px] font-normal text-[var(--text-muted)]">How your trade outcomes are spread</span>
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={pnlDistribution} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <XAxis dataKey="range" tick={{ fill: '#94A3B8', fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TT} formatter={((v: any) => [`${v} trades`, 'Count']) as any} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {pnlDistribution.map((b, i) => (
                  <Cell key={i} fill={b.isProfit ? '#4ADE80' : '#FF453A'} opacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Row 3: Time Analysis ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* P&L by Hour */}
        {hourStats.length > 0 && (
          <div className={`${CARD} p-5`}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[var(--text-muted)]" /> P&L by Hour
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourStats} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={TT} formatter={((v: any) => [`$${Number(v).toFixed(0)}`, 'P&L']) as any} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {hourStats.map((h, i) => (
                    <Cell key={i} fill={h.pnl >= 0 ? '#4ADE80' : '#FF453A'} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* P&L by Day of Week */}
        <div className={`${CARD} p-5`}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-[var(--text-muted)]" /> P&L by Day of Week
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dowStats} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={TT} formatter={((v: any, name: any) => [name === 'pnl' ? `$${v.toFixed(0)}` : `${v}`, name === 'pnl' ? 'P&L'  : 'Trades']) as any} />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {dowStats.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? '#4ADE80' : '#FF453A'} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: Heatmap + Instruments side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {heatmap.length > 0 && (
          <div className={`${CARD} p-5`}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Zap size={16} className="text-[var(--text-muted)]" /> Performance Heatmap
              <span className="text-[10px] font-normal text-[var(--text-muted)]">Hour × Day</span>
            </h3>
            <TimeHeatmap data={heatmap} />
          </div>
        )}

      {instruments.length > 0 && (
        <div className={`${CARD} p-5`}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--text-muted)]" /> Instrument Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-muted)] uppercase">Symbol</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--text-muted)] uppercase">Trades</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--text-muted)] uppercase">Win Rate</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--text-muted)] uppercase">Net P&L</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--text-muted)] uppercase">Avg P&L</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--text-muted)] uppercase">PF</th>
                </tr>
              </thead>
              <tbody>
                {instruments.sort((a, b) => b.pnl - a.pnl).map(inst => (
                  <tr key={inst.symbol} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[var(--text-primary)]">{inst.symbol}</td>
                    <td className="py-3 px-3 text-right text-[var(--text-secondary)]">{inst.count}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={inst.winRate >= 50 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}>{inst.winRate.toFixed(0)}%</span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">
                      <span className={inst.pnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}>{inst.pnl >= 0 ? '+' : ''}${inst.pnl.toFixed(0)}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-[var(--text-secondary)]">${inst.avgPnl.toFixed(0)}</td>
                    <td className="py-3 px-3 text-right text-[var(--text-secondary)]">{inst.profitFactor === Infinity ? '∞' : inst.profitFactor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* ── Row 5: What-If Scenarios ── */}
      {whatIfs.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-[#FF453A]" /> Bad Habits Costing You Money
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {whatIfs.map((w, i) => (
              <WhatIfCard key={i} scenario={w} />
            ))}
          </div>
        </div>
      )}

      {/* ── Row 7: Behavior Flags ── */}
      {behaviorData && (
        <div className={`${CARD} p-5`}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Shield size={16} className="text-[var(--text-muted)]" /> Behavioral Analysis
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <BehaviorStat label="Revenge Trades" value={behaviorData.revengeTradeCount} bad={behaviorData.revengeTradeCount > 0} detail={behaviorData.revengeTradeCount > 0 ? `Avg P&L: $${behaviorData.revengeAvgPnl.toFixed(0)}` : 'None detected'} />
            <BehaviorStat label="Size Escalation" value={behaviorData.sizeEscalationEvents} bad={behaviorData.sizeEscalationEvents > 0} detail={behaviorData.sizeEscalationEvents > 0 ? `Avg P&L: $${behaviorData.sizeEscalationAvgPnl.toFixed(0)}` : 'None detected'} />
            <BehaviorStat label="Tilt Events" value={behaviorData.tiltEvents} bad={behaviorData.tiltEvents > 0} detail="3+ consecutive losses" />
            <BehaviorStat label="Avg Trades/Day" value={behaviorData.avgTradesPerDay.toFixed(1)} bad={false} detail="Per session" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
            <BehaviorStat
              label="Avg Hold (Winners)"
              value={behaviorData.avgHoldWinners > 0 ? formatHold(behaviorData.avgHoldWinners) : '—'}
              bad={false}
              detail="Time in winning trades"
            />
            <BehaviorStat
              label="Avg Hold (Losers)"
              value={behaviorData.avgHoldLosers > 0 ? formatHold(behaviorData.avgHoldLosers) : '—'}
              bad={behaviorData.avgHoldLosers > behaviorData.avgHoldWinners * 1.5 && behaviorData.avgHoldWinners > 0}
              detail={behaviorData.avgHoldLosers > behaviorData.avgHoldWinners * 1.5 && behaviorData.avgHoldWinners > 0
                ? `${(behaviorData.avgHoldLosers / behaviorData.avgHoldWinners).toFixed(1)}x longer than winners`
                : 'Time in losing trades'}
            />
            <BehaviorStat label="Ultra-Short" value={behaviorData.ultraShortTrades} bad={behaviorData.ultraShortTrades > 0} detail="Trades held ≤5 seconds" />
            <BehaviorStat label="Rapid-Fire" value={behaviorData.rapidFireClusters} bad={behaviorData.rapidFireClusters > 0} detail="3+ trades in 2 min" />
          </div>
          {(behaviorData.lateSessionCount >= 3 && behaviorData.earlySessionCount >= 3) && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
              <div className="rounded-xl p-4" style={{ background: behaviorData.earlySessionPnl >= 0 ? 'rgba(74,222,128,0.06)' : 'rgba(255,69,58,0.06)', border: `1px solid ${behaviorData.earlySessionPnl >= 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,69,58,0.15)'}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-muted)]">Before 10 PM</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{behaviorData.earlySessionCount} trades</span>
                </div>
                <span className={`text-lg font-bold ${behaviorData.earlySessionPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                  {behaviorData.earlySessionPnl >= 0 ? '+' : ''}${behaviorData.earlySessionPnl.toFixed(0)}
                </span>
              </div>
              <div className="rounded-xl p-4" style={{ background: behaviorData.lateSessionPnl >= 0 ? 'rgba(74,222,128,0.06)' : 'rgba(255,69,58,0.06)', border: `1px solid ${behaviorData.lateSessionPnl >= 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,69,58,0.15)'}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-muted)]">After 10 PM</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{behaviorData.lateSessionCount} trades</span>
                </div>
                <span className={`text-lg font-bold ${behaviorData.lateSessionPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                  {behaviorData.lateSessionPnl >= 0 ? '+' : ''}${behaviorData.lateSessionPnl.toFixed(0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Components ──

function ScoreCircle({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? 'var(--green)' : score >= 40 ? '#F59E0B' : 'var(--red)'
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-[var(--text-primary)]">{score}</span>
        <span className="text-xs text-[var(--text-muted)]">/ 100</span>
      </div>
    </div>
  )
}

function SubScore({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  const color = value >= 70 ? 'var(--green)' : value >= 40 ? '#F59E0B' : 'var(--red)'
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-[var(--text-muted)] flex-shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
          <span className="text-[10px] font-bold text-[var(--text-primary)]">{value}</span>
        </div>
        <div className="h-1 rounded-full bg-[var(--border)]">
          <div className="h-full rounded-full" style={{ width: `${value}%`, background: color, transition: 'width 0.7s ease' }} />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color, icon: Icon }: { label: string; value: string; color: 'green' | 'red' | 'neutral'; icon: any }) {
  const textColor = color === 'green' ? 'text-[#4ADE80]' : color === 'red' ? 'text-[#FF453A]' : 'text-[var(--text-primary)]'
  const iconColor = color === 'green' ? '#4ADE80' : color === 'red' ? '#FF453A' : 'var(--text-muted)'
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: iconColor }} />
        <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium">{label}</span>
      </div>
      <span className={`text-xl font-bold ${textColor}`}>{value}</span>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const borderColor = { critical: '#FF453A', warning: '#F59E0B', positive: '#4ADE80', info: '#3B82F6' }[insight.severity] || '#3B82F6'
  const IconComp = { critical: AlertTriangle, warning: AlertCircle, positive: CheckCircle, info: Info }[insight.severity] || Info
  return (
    <div className={`${CARD} p-4`} style={{ borderLeft: `3px solid ${borderColor}` }}>
      <div className="flex items-start gap-3">
        <IconComp size={18} style={{ color: borderColor }} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{insight.title}</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </div>
  )
}

function TrendMetric({ label, recent, previous, improving }: { label: string; recent: string; previous: string; improving: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-1">{label}</p>
      <p className={`text-lg font-bold ${improving ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>{recent}</p>
      <div className="flex items-center justify-center gap-1 mt-1">
        {improving ? <ArrowUpRight size={12} className="text-[#4ADE80]" /> : <ArrowDownRight size={12} className="text-[#FF453A]" />}
        <span className="text-[10px] text-[var(--text-muted)]">was {previous}</span>
      </div>
    </div>
  )
}

function SideCard({ side, stats }: { side: string; stats: { count: number; pnl: number; winRate: number; avgPnl: number } }) {
  const color = side === 'Long' ? '#4ADE80' : '#FF453A'
  return (
    <div className="rounded-xl p-4" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold" style={{ color }}>{side}</span>
        <span className="text-xs text-[var(--text-muted)]">{stats.count} trades</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">P&L</span>
          <span className={`font-semibold ${stats.pnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>{stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">Win Rate</span>
          <span className={`font-semibold ${stats.winRate >= 50 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>{stats.winRate.toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">Avg P&L</span>
          <span className="font-semibold text-[var(--text-primary)]">${stats.avgPnl.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}

function EdgeRow({ edge, rank, type }: { edge: { symbol: string; side: string; timeSlot: string; pnl: number; winRate: number; count: number; avgPnl: number }; rank: number; type: 'best' | 'worst' }) {
  const color = type === 'best' ? '#4ADE80' : '#FF453A'
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${color}15`, color }}>{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{edge.symbol}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: edge.side === 'Long' ? '#4ADE8015' : '#FF453A15', color: edge.side === 'Long' ? '#4ADE80' : '#FF453A' }}>{edge.side}</span>
          <span className="text-[10px] text-[var(--text-muted)]">{edge.timeSlot}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-[var(--text-muted)]">{edge.count} trades</span>
          <span className="text-[10px] text-[var(--text-muted)]">WR: {edge.winRate.toFixed(0)}%</span>
          <span className="text-[10px] font-semibold" style={{ color }}>{edge.pnl >= 0 ? '+' : ''}${edge.pnl.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}

function WhatIfCard({ scenario }: { scenario: WhatIfScenario }) {
  return (
    <div className={`${CARD} p-4`} style={{ borderLeft: '3px solid #FF453A' }}>
      <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{scenario.label}</p>
      <p className="text-xs text-[var(--text-secondary)] mb-3">{scenario.description}</p>
      <div className="flex items-center gap-3">
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)]">Without this</span>
          <p className="text-sm font-bold text-[#4ADE80]">${scenario.whatIfPnl.toFixed(0)}</p>
        </div>
        <div className="w-px h-8 bg-[var(--border)]" />
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)]">Cost</span>
          <p className="text-sm font-bold text-[#FF453A]">-${Math.abs(scenario.difference).toFixed(0)}</p>
        </div>
      </div>
    </div>
  )
}

function formatHold(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function BehaviorStat({ label, value, bad, detail }: { label: string; value: number | string; bad: boolean; detail: string }) {
  return (
    <div className="text-center">
      <span className={`text-2xl font-bold ${bad ? 'text-[#FF453A]' : 'text-[var(--text-primary)]'}`}>{value}</span>
      <p className="text-xs font-medium text-[var(--text-primary)] mt-1">{label}</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{detail}</p>
    </div>
  )
}

function TimeHeatmap({ data }: { data: TimeHeatmapCell[] }) {
  // Futures session: Sunday 6PM EST → Friday 5PM EST
  // Columns: Sun, Mon, Tue, Wed, Thu, Fri
  // Rows: 6PM, 7PM, ..., 11PM, 12AM, 1AM, ..., 4PM, 5PM
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  // dayOfWeek mapping: 7=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  const dowOrder = [7, 1, 2, 3, 4, 5]
  // Session hours: 18,19,20,21,22,23, 0,1,2,...,16,17
  const sessionHours = [
    ...Array.from({ length: 6 }, (_, i) => 18 + i),   // 18-23 (6PM-11PM)
    ...Array.from({ length: 18 }, (_, i) => i),         // 0-17  (12AM-5PM)
  ]

  const cellMap = new Map<string, TimeHeatmapCell>()
  let maxAbsPnl = 1
  for (const c of data) {
    cellMap.set(`${c.hour}-${c.dayOfWeek}`, c)
    if (Math.abs(c.avgPnl) > maxAbsPnl) maxAbsPnl = Math.abs(c.avgPnl)
  }

  // Determine which hours actually have data (or neighbor data) to trim empty rows
  const hoursWithData = new Set<number>()
  for (const c of data) hoursWithData.add(c.hour)

  // Find session range that has data, with 1-hour buffer
  let firstIdx = sessionHours.length, lastIdx = -1
  for (let i = 0; i < sessionHours.length; i++) {
    if (hoursWithData.has(sessionHours[i])) {
      if (i < firstIdx) firstIdx = i
      if (i > lastIdx) lastIdx = i
    }
  }
  if (firstIdx > lastIdx) { firstIdx = 0; lastIdx = sessionHours.length - 1 }
  firstIdx = Math.max(0, firstIdx - 1)
  lastIdx = Math.min(sessionHours.length - 1, lastIdx + 1)
  const visibleHours = sessionHours.slice(firstIdx, lastIdx + 1)

  // Is this cell within valid futures session hours?
  function isValidSession(dow: number, hour: number): boolean {
    // Sunday: only 6PM (18) onwards
    if (dow === 7) return hour >= 18
    // Friday: only up to 5PM (17)
    if (dow === 5) return hour <= 17
    // Mon-Thu: all hours valid
    return true
  }

  return (
    <div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `36px repeat(6, 1fr)` }}>
        <div />
        {days.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[var(--text-muted)] pb-1">{d}</div>
        ))}
        {visibleHours.map(hour => (
          <div key={hour} className="contents">
            <div className="text-right pr-2 text-[10px] flex items-center justify-end text-[var(--text-muted)] h-8">
              {hour % 12 || 12}{hour >= 12 ? 'p' : 'a'}
            </div>
            {dowOrder.map(dow => {
              if (!isValidSession(dow, hour)) {
                return <div key={dow} className="h-8 rounded-lg" style={{ background: 'transparent' }} />
              }
              const cell = cellMap.get(`${hour}-${dow}`)
              const intensity = cell ? Math.min(Math.abs(cell.avgPnl) / maxAbsPnl, 1) : 0
              const isProfit = cell ? cell.avgPnl >= 0 : true
              const bg = cell
                ? isProfit
                  ? `rgba(74, 222, 128, ${0.15 + intensity * 0.65})`
                  : `rgba(255, 69, 58, ${0.15 + intensity * 0.65})`
                : 'rgba(255,255,255,0.02)'
              return (
                <div
                  key={dow}
                  className="h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold cursor-default transition-all hover:scale-105 hover:ring-1 hover:ring-[var(--border-strong)]"
                  style={{ background: bg, color: cell ? 'var(--text-primary)' : 'transparent' }}
                  title={cell ? `${cell.count} trades · Avg: ${cell.avgPnl >= 0 ? '+' : ''}$${cell.avgPnl.toFixed(0)}` : 'No trades'}
                >
                  {cell ? cell.count : ''}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3 text-[9px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'rgba(255, 69, 58, 0.5)' }} /> Loss</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }} /> No data</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'rgba(74, 222, 128, 0.5)' }} /> Profit</span>
      </div>
    </div>
  )
}
