import { Trade, DailyNote } from '@/lib/types'
import { TradingScore } from './types'
import { BehaviorData } from './behaviorAnalyzer'

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function calculateScore(
  trades: Trade[],
  notes: DailyNote[],
  behaviorData: BehaviorData
): TradingScore {
  const closed = trades.filter(t => t.status === 'closed')

  if (closed.length < 3) {
    return { overall: 0, consistency: 0, discipline: 0, riskManagement: 0, edge: 0, journaling: 0, trend: 0 }
  }

  // ── Consistency (25%) ──
  const dailyPnl = new Map<string, number>()
  for (const t of closed) {
    const key = t.sessionDate || t.date
    dailyPnl.set(key, (dailyPnl.get(key) || 0) + t.netPnl)
  }
  const dailyPnls = Array.from(dailyPnl.values())
  const profitDays = dailyPnls.filter(p => p > 0).length
  const profitDayRatio = profitDays / dailyPnls.length
  const avgDaily = dailyPnls.reduce((a, b) => a + b, 0) / dailyPnls.length
  const dailyStddev = Math.sqrt(dailyPnls.reduce((s, p) => s + (p - avgDaily) ** 2, 0) / dailyPnls.length)
  const dailyCV = Math.abs(avgDaily) > 0 ? dailyStddev / Math.abs(avgDaily) : 5

  const consistencyScore = clamp(
    (profitDayRatio * 60) + (Math.max(0, 40 - dailyCV * 10)),
    0, 100
  )

  // ── Discipline (25%) ──
  const revengeDeduction = Math.min(30, behaviorData.revengeTradeCount * 5)
  const overtradeDeduction = Math.min(20, behaviorData.overtradeDays * 5)
  const tiltDeduction = Math.min(30, behaviorData.tiltEvents * 10)
  const disciplineScore = clamp(100 - revengeDeduction - overtradeDeduction - tiltDeduction, 0, 100)

  // ── Risk Management (25%) ──
  const wins = closed.filter(t => t.netPnl > 0)
  const losses = closed.filter(t => t.netPnl < 0)
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.netPnl, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.netPnl, 0) / losses.length) : 1
  const rr = avgLoss > 0 ? avgWin / avgLoss : 0

  const sizes = closed.map(t => t.contracts)
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length
  const sizeStddev = Math.sqrt(sizes.reduce((s, c) => s + (c - avgSize) ** 2, 0) / sizes.length)
  const sizeCV = avgSize > 0 ? sizeStddev / avgSize : 1

  const rrScore = clamp(rr * 25, 0, 40) // R:R of 1.6 = 40 points
  const sizingScore = clamp((1 - sizeCV) * 30, 0, 30) // Low CV = good
  const ddScore = dailyCV < 3 ? 30 : dailyCV < 5 ? 20 : 10
  const riskManagementScore = clamp(rrScore + sizingScore + ddScore, 0, 100)

  // ── Edge (15%) ──
  const totalPnl = closed.reduce((s, t) => s + t.netPnl, 0)
  const expectancy = totalPnl / closed.length
  const grossWins = wins.reduce((s, t) => s + t.netPnl, 0)
  const grossLosses = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.netPnl, 0)) : 1
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 10 : 0

  const expectancyScore = clamp(expectancy > 0 ? 50 : expectancy > -10 ? 25 : 0, 0, 50)
  const pfScore = clamp(profitFactor >= 2 ? 50 : profitFactor >= 1.5 ? 40 : profitFactor >= 1 ? 25 : 10, 0, 50)
  const edgeScore = clamp(expectancyScore + pfScore, 0, 100)

  // ── Journaling (10%) ──
  const tradingDays = new Set(closed.map(t => t.sessionDate || t.date))
  const noteDays = new Set(notes.map(n => n.sessionDate || n.date))
  const journaledDays = [...tradingDays].filter(d => noteDays.has(d)).length
  const journalRate = tradingDays.size > 0 ? journaledDays / tradingDays.size : 0
  const journalingScore = clamp(journalRate * 100, 0, 100)

  // ── Overall ──
  const overall = Math.round(
    consistencyScore * 0.25 +
    disciplineScore * 0.25 +
    riskManagementScore * 0.25 +
    edgeScore * 0.15 +
    journalingScore * 0.10
  )

  // ── Trend (last 2 weeks vs previous 2 weeks) ──
  let trend = 0
  if (dailyPnls.length >= 10) {
    const dates = Array.from(dailyPnl.keys()).sort()
    const now = new Date(dates[dates.length - 1])
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const fourWeeksAgo = new Date(now)
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const recentPnls = dates
      .filter(d => new Date(d) >= twoWeeksAgo)
      .map(d => dailyPnl.get(d) || 0)
    const prevPnls = dates
      .filter(d => new Date(d) >= fourWeeksAgo && new Date(d) < twoWeeksAgo)
      .map(d => dailyPnl.get(d) || 0)

    if (recentPnls.length >= 3 && prevPnls.length >= 3) {
      const recentAvg = recentPnls.reduce((a, b) => a + b, 0) / recentPnls.length
      const prevAvg = prevPnls.reduce((a, b) => a + b, 0) / prevPnls.length
      trend = recentAvg - prevAvg
    }
  }

  return {
    overall,
    consistency: Math.round(consistencyScore),
    discipline: Math.round(disciplineScore),
    riskManagement: Math.round(riskManagementScore),
    edge: Math.round(edgeScore),
    journaling: Math.round(journalingScore),
    trend,
  }
}
