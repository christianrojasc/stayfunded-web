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

  const dailyPnls = daily.map(d => d.netPnl)
  const mean = dailyPnls.reduce((a, b) => a + b, 0) / dailyPnls.length
  const variance = dailyPnls.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / dailyPnls.length
  const stdDev = Math.sqrt(variance)
  const sharpeRatio = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0

  const recoveryFactor = maxDrawdown > 0 ? netPnl / maxDrawdown : netPnl > 0 ? 999 : 0

  const profitDays = daily.filter(d => d.netPnl > 0).length
  const consistency = daily.length ? (profitDays / daily.length) * 100 : 0

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

// ── Time Intelligence ────────────────────────────────────────────────────────

export function calcHourlyStats(trades: Trade[]): { hour: number; label: string; count: number; pnl: number; avgPnl: number }[] {
  const map = new Map<number, { count: number; pnl: number }>()
  trades.filter(t => t.status === 'closed' && t.entryTime).forEach(t => {
    const h = parseInt(t.entryTime!.split(':')[0])
    const s = map.get(h) || { count: 0, pnl: 0 }
    map.set(h, { count: s.count + 1, pnl: s.pnl + t.netPnl })
  })
  return Array.from({ length: 24 }, (_, h) => {
    const d = map.get(h) || { count: 0, pnl: 0 }
    return { hour: h, label: `${h.toString().padStart(2, '0')}:00`, count: d.count, pnl: d.pnl, avgPnl: d.count ? d.pnl / d.count : 0 }
  })
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function calcDayOfWeekStats(trades: Trade[]): { day: number; name: string; count: number; pnl: number; avgPnl: number }[] {
  const map = new Map<number, { count: number; pnl: number }>()
  trades.filter(t => t.status === 'closed').forEach(t => {
    const d = new Date((t.sessionDate || t.date) + 'T12:00:00').getDay()
    const s = map.get(d) || { count: 0, pnl: 0 }
    map.set(d, { count: s.count + 1, pnl: s.pnl + t.netPnl })
  })
  return [1, 2, 3, 4, 5].map(d => {
    const s = map.get(d) || { count: 0, pnl: 0 }
    return { day: d, name: DAY_NAMES[d], count: s.count, pnl: s.pnl, avgPnl: s.count ? s.pnl / s.count : 0 }
  })
}

// ── Trade Quality ────────────────────────────────────────────────────────────

export interface TradeQuality {
  avgWinPnl: number
  avgLossPnl: number
  largestWin: number
  largestLoss: number
  avgHoldTimeWins: number
  avgHoldTimeLosses: number
  tradesPerSession: number
  maxConsecWins: number
  maxConsecLosses: number
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function calcTradeQuality(trades: Trade[]): TradeQuality {
  const closed = trades.filter(t => t.status === 'closed')
  const wins = closed.filter(t => t.netPnl > 0)
  const losses = closed.filter(t => t.netPnl <= 0)

  const holdTime = (ts: Trade[]) => {
    const valid = ts.filter(t => t.entryTime && t.exitTime)
    if (!valid.length) return 0
    const total = valid.reduce((s, t) => {
      const entry = parseTimeToMinutes(t.entryTime!)
      let exit = parseTimeToMinutes(t.exitTime!)
      if (exit < entry) exit += 24 * 60
      return s + (exit - entry)
    }, 0)
    return total / valid.length
  }

  const sessions = new Set(closed.map(t => t.sessionDate || t.date))

  let maxW = 0, maxL = 0, w = 0, l = 0
  const sorted = [...closed].sort((a, b) => a.date.localeCompare(b.date))
  sorted.forEach(t => {
    if (t.netPnl > 0) { w++; l = 0; if (w > maxW) maxW = w }
    else { l++; w = 0; if (l > maxL) maxL = l }
  })

  return {
    avgWinPnl: wins.length ? wins.reduce((s, t) => s + t.netPnl, 0) / wins.length : 0,
    avgLossPnl: losses.length ? losses.reduce((s, t) => s + t.netPnl, 0) / losses.length : 0,
    largestWin: wins.length ? Math.max(...wins.map(t => t.netPnl)) : 0,
    largestLoss: losses.length ? Math.min(...losses.map(t => t.netPnl)) : 0,
    avgHoldTimeWins: holdTime(wins),
    avgHoldTimeLosses: holdTime(losses),
    tradesPerSession: sessions.size ? closed.length / sessions.size : 0,
    maxConsecWins: maxW,
    maxConsecLosses: maxL,
  }
}

// ── Instrument Breakdown (enhanced) ─────────────────────────────────────────

export interface InstrumentStats {
  symbol: string
  count: number
  pnl: number
  avgPnl: number
  winRate: number
  wins: number
}

export function calcInstrumentBreakdown(trades: Trade[]): InstrumentStats[] {
  const map = new Map<string, { count: number; pnl: number; wins: number }>()
  trades.filter(t => t.status === 'closed').forEach(t => {
    const s = map.get(t.symbol) || { count: 0, pnl: 0, wins: 0 }
    map.set(t.symbol, { count: s.count + 1, pnl: s.pnl + t.netPnl, wins: s.wins + (t.netPnl > 0 ? 1 : 0) })
  })
  return Array.from(map.entries())
    .map(([symbol, d]) => ({
      symbol, count: d.count, pnl: d.pnl,
      avgPnl: d.count ? d.pnl / d.count : 0,
      winRate: d.count ? (d.wins / d.count) * 100 : 0,
      wins: d.wins,
    }))
    .sort((a, b) => b.avgPnl - a.avgPnl)
}

// ── P&L Distribution ────────────────────────────────────────────────────────

export function calcPnlDistribution(trades: Trade[], bucketSize = 100): { range: string; count: number; from: number }[] {
  const closed = trades.filter(t => t.status === 'closed')
  if (!closed.length) return []
  const pnls = closed.map(t => t.netPnl)
  const min = Math.floor(Math.min(...pnls) / bucketSize) * bucketSize
  const max = Math.ceil(Math.max(...pnls) / bucketSize) * bucketSize
  const buckets: { range: string; count: number; from: number }[] = []
  for (let b = min; b <= max; b += bucketSize) {
    const count = pnls.filter(p => p >= b && p < b + bucketSize).length
    if (count > 0) buckets.push({ range: `$${b}`, count, from: b })
  }
  return buckets
}

// ── Drawdown over time ──────────────────────────────────────────────────────

export function calcDrawdownSeries(trades: Trade[]): { date: string; drawdown: number; isMax: boolean }[] {
  const daily = calcDailyStats(trades)
  if (!daily.length) return []
  let peak = 0, cum = 0, maxDD = 0, maxIdx = 0
  const series = daily.map((d, i) => {
    cum += d.netPnl
    if (cum > peak) peak = cum
    const dd = cum - peak
    if (dd < maxDD) { maxDD = dd; maxIdx = i }
    return { date: d.date, drawdown: parseFloat(dd.toFixed(2)), isMax: false }
  })
  if (series.length && maxDD < 0) series[maxIdx].isMax = true
  return series
}

// ── Session Performance ─────────────────────────────────────────────────────

export interface SessionPerf {
  date: string
  trades: number
  grossPnl: number
  netPnl: number
  winRate: number
  maxLoss: number
}

export function calcSessionPerformance(trades: Trade[]): SessionPerf[] {
  const map = new Map<string, Trade[]>()
  trades.filter(t => t.status === 'closed').forEach(t => {
    const key = t.sessionDate || t.date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  })
  return Array.from(map.entries())
    .map(([date, ts]) => {
      const wins = ts.filter(t => t.netPnl > 0).length
      return {
        date,
        trades: ts.length,
        grossPnl: ts.reduce((s, t) => s + t.pnl, 0),
        netPnl: ts.reduce((s, t) => s + t.netPnl, 0),
        winRate: ts.length ? (wins / ts.length) * 100 : 0,
        maxLoss: ts.length ? Math.min(...ts.map(t => t.netPnl)) : 0,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}


// ── Daily Grade ─────────────────────────────────────────────────────────────

export function calcDailyGrade(compliancePct: number): { grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F', color: string } {
  if (compliancePct >= 95) return { grade: 'A+', color: '#4ADE80' }
  if (compliancePct >= 85) return { grade: 'A', color: '#4ADE80' }
  if (compliancePct >= 75) return { grade: 'B', color: '#86EFAC' }
  if (compliancePct >= 65) return { grade: 'C', color: '#FCD34D' }
  if (compliancePct >= 50) return { grade: 'D', color: '#FB923C' }
  return { grade: 'F', color: '#FF453A' }
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
