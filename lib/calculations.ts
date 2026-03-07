import { Trade, DailyStats, AnalyticsData } from './types'
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'

export function calcDailyStats(trades: Trade[]): DailyStats[] {
  const map = new Map<string, Trade[]>()
  trades.filter(t => t.status === 'closed').forEach(t => {
    const key = t.sessionDate || t.date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  })

  return Array.from(map.entries()).map(([date, ts]) => {
    const wins = ts.filter(t => t.netPnl > 0)
    const losses = ts.filter(t => t.netPnl <= 0)
    const grossPnl = ts.reduce((s, t) => s + t.pnl, 0)
    const totalFees = ts.reduce((s, t) => s + t.fees, 0)
    const netPnl = ts.reduce((s, t) => s + t.netPnl, 0)
    return {
      date,
      sessionDate: date,
      totalPnl: grossPnl,
      totalFees,
      netPnl,
      tradeCount: ts.length,
      winCount: wins.length,
      lossCount: losses.length,
      winRate: ts.length ? (wins.length / ts.length) * 100 : 0,
      largestWin: wins.length ? Math.max(...wins.map(t => t.netPnl)) : 0,
      largestLoss: losses.length ? Math.min(...losses.map(t => t.netPnl)) : 0,
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
}

export function calcCumulativePnl(dailyStats: DailyStats[]): { date: string; cumPnl: number; netPnl: number }[] {
  let cum = 0
  return dailyStats.map(d => {
    cum += d.netPnl
    return { date: d.date, cumPnl: parseFloat(cum.toFixed(2)), netPnl: d.netPnl }
  })
}

export function calcDrawdown(dailyStats: DailyStats[]): { date: string; drawdown: number; peak: number }[] {
  let peak = 0
  let cum = 0
  return dailyStats.map(d => {
    cum += d.netPnl
    if (cum > peak) peak = cum
    const dd = peak > 0 ? ((cum - peak) / peak) * 100 : 0
    return { date: d.date, drawdown: parseFloat(dd.toFixed(2)), peak }
  })
}

export function calcAnalytics(trades: Trade[]): AnalyticsData {
  const closed = trades.filter(t => t.status === 'closed')
  if (!closed.length) return emptyAnalytics()

  const wins = closed.filter(t => t.netPnl > 0)
  const losses = closed.filter(t => t.netPnl <= 0)
  const grossProfit = wins.reduce((s, t) => s + t.netPnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0))
  const netPnl = grossProfit - grossLoss
  const totalFees = closed.reduce((s, t) => s + t.fees, 0)
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0
  const avgWin = wins.length ? grossProfit / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0

  const daily = calcDailyStats(closed)
  const cumulative = calcCumulativePnl(daily)

  let maxDrawdown = 0
  let peak = 0
  cumulative.forEach(d => {
    if (d.cumPnl > peak) peak = d.cumPnl
    const dd = peak - d.cumPnl
    if (dd > maxDrawdown) maxDrawdown = dd
  })
  const maxDrawdownPct = peak > 0 ? (maxDrawdown / peak) * 100 : 0

  // Streaks
  let currentStreak = 0
  let longestWinStreak = 0
  let longestLossStreak = 0
  let winStreak = 0
  let lossStreak = 0
  const sorted = [...closed].sort((a, b) => a.date.localeCompare(b.date))
  sorted.forEach(t => {
    if (t.netPnl > 0) {
      winStreak++; lossStreak = 0
      if (winStreak > longestWinStreak) longestWinStreak = winStreak
    } else {
      lossStreak++; winStreak = 0
      if (lossStreak > longestLossStreak) longestLossStreak = lossStreak
    }
  })
  const last = sorted[sorted.length - 1]
  currentStreak = last?.netPnl > 0 ? winStreak : -lossStreak

  // Daily P&L for sharpe
  const dailyPnls = daily.map(d => d.netPnl)
  const mean = dailyPnls.reduce((a, b) => a + b, 0) / dailyPnls.length
  const variance = dailyPnls.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / dailyPnls.length
  const stdDev = Math.sqrt(variance)
  const sharpeRatio = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0

  const recoveryFactor = maxDrawdown > 0 ? netPnl / maxDrawdown : netPnl > 0 ? 999 : 0

  // Consistency: % of profitable days
  const profitDays = daily.filter(d => d.netPnl > 0).length
  const consistency = daily.length ? (profitDays / daily.length) * 100 : 0

  // Score out of 100
  const score = calcScore({
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    profitFactor,
    maxDrawdownPct,
    avgWinLossRatio: avgLoss > 0 ? avgWin / avgLoss : 1,
    consistency,
    recoveryFactor,
  })

  return {
    totalTrades: closed.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    profitFactor,
    netPnl,
    grossProfit,
    grossLoss,
    avgWin,
    avgLoss,
    avgRR: avgLoss > 0 ? avgWin / avgLoss : 0,
    bestDay: daily.length ? Math.max(...daily.map(d => d.netPnl)) : 0,
    worstDay: daily.length ? Math.min(...daily.map(d => d.netPnl)) : 0,
    maxDrawdown,
    maxDrawdownPct,
    currentStreak,
    longestWinStreak,
    longestLossStreak,
    avgTradesPerDay: daily.length ? closed.length / daily.length : 0,
    totalFees,
    sharpeRatio,
    recoveryFactor,
    consistency,
    score,
  }
}

interface ScoreInput {
  winRate: number
  profitFactor: number
  maxDrawdownPct: number
  avgWinLossRatio: number
  consistency: number
  recoveryFactor: number
}

function calcScore(s: ScoreInput): number {
  const winRateScore = Math.min(s.winRate, 70) / 70 * 20
  const pfScore = Math.min(s.profitFactor / 3, 1) * 20
  const ddScore = Math.max(0, 1 - s.maxDrawdownPct / 20) * 20
  const rrScore = Math.min(s.avgWinLossRatio / 2, 1) * 20
  const consistencyScore = (s.consistency / 100) * 20
  return Math.round(winRateScore + pfScore + ddScore + rrScore + consistencyScore)
}

export function getMonthlyStats(trades: Trade[], year: number, month: number) {
  const start = startOfMonth(new Date(year, month - 1))
  const end = endOfMonth(new Date(year, month - 1))
  const days = eachDayOfInterval({ start, end })

  const daily = calcDailyStats(trades)
  const byDate = new Map(daily.map(d => [d.date, d]))

  return days.map(d => {
    const key = format(d, 'yyyy-MM-dd')
    const stats = byDate.get(key)
    return { date: key, day: d.getDate(), dayOfWeek: d.getDay(), stats: stats || null }
  })
}

export function formatCurrency(val: number, compact = false): string {
  if (compact && Math.abs(val) >= 1000) {
    return (val >= 0 ? '+' : '') + (val / 1000).toFixed(1) + 'k'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

export function formatPnl(val: number): string {
  const fmt = formatCurrency(Math.abs(val))
  return (val >= 0 ? '+' : '-') + fmt.replace(/^-/, '')
}

function emptyAnalytics(): AnalyticsData {
  return {
    totalTrades: 0, winCount: 0, lossCount: 0, winRate: 0, profitFactor: 0,
    netPnl: 0, grossProfit: 0, grossLoss: 0, avgWin: 0, avgLoss: 0, avgRR: 0,
    bestDay: 0, worstDay: 0, maxDrawdown: 0, maxDrawdownPct: 0, currentStreak: 0,
    longestWinStreak: 0, longestLossStreak: 0, avgTradesPerDay: 0, totalFees: 0,
    sharpeRatio: 0, recoveryFactor: 0, consistency: 0, score: 0,
  }
}
