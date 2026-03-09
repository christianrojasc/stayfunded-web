import { Trade } from '@/lib/types'
import { Insight, TimeHeatmapCell } from './types'

function getTradeHour(trade: Trade): number | null {
  const t = trade.entryTime
  if (!t) return null
  const d = new Date(t)
  if (isNaN(d.getTime())) return null
  return d.getHours()
}

function getTradeDayOfWeek(trade: Trade): number {
  // 1=Mon ... 5=Fri
  const d = new Date(trade.sessionDate || trade.date)
  const day = d.getUTCDay()
  return day === 0 ? 7 : day // Convert Sunday=0 to 7
}

export function analyzeTime(trades: Trade[]): { insights: Insight[]; heatmap: TimeHeatmapCell[] } {
  const insights: Insight[] = []
  const closed = trades.filter(t => t.status === 'closed')

  if (closed.length === 0) {
    return { insights: [], heatmap: [] }
  }

  // ── Hour-of-day performance ──
  const hourStats = new Map<number, { pnl: number; count: number; wins: number }>()
  for (const t of closed) {
    const hour = getTradeHour(t)
    if (hour === null) continue
    const s = hourStats.get(hour) || { pnl: 0, count: 0, wins: 0 }
    s.pnl += t.netPnl
    s.count++
    if (t.netPnl > 0) s.wins++
    hourStats.set(hour, s)
  }

  // Find best and worst hours
  let bestHour = -1, bestHourPnl = -Infinity
  let worstHour = -1, worstHourPnl = Infinity
  for (const [hour, s] of hourStats) {
    if (s.count >= 3) {
      if (s.pnl > bestHourPnl) { bestHour = hour; bestHourPnl = s.pnl }
      if (s.pnl < worstHourPnl) { worstHour = hour; worstHourPnl = s.pnl }
    }
  }

  if (bestHour >= 0 && bestHourPnl > 0) {
    const s = hourStats.get(bestHour)!
    insights.push({
      id: 'best-hour',
      category: 'timing',
      severity: 'positive',
      title: `Best Trading Hour: ${formatHour(bestHour)}`,
      description: `${s.count} trades at ${formatHour(bestHour)} with $${bestHourPnl.toFixed(2)} total P&L and ${((s.wins / s.count) * 100).toFixed(0)}% win rate.`,
      impact: bestHourPnl,
      suggestion: 'Focus your best setups during this window.',
    })
  }

  if (worstHour >= 0 && worstHourPnl < 0) {
    const s = hourStats.get(worstHour)!
    insights.push({
      id: 'worst-hour',
      category: 'timing',
      severity: 'warning',
      title: `Worst Trading Hour: ${formatHour(worstHour)}`,
      description: `${s.count} trades at ${formatHour(worstHour)} with $${worstHourPnl.toFixed(2)} total P&L and ${((s.wins / s.count) * 100).toFixed(0)}% win rate.`,
      impact: worstHourPnl,
      suggestion: 'Consider avoiding or reducing size during this hour.',
    })
  }

  // ── Day-of-week patterns ──
  const dayStats = new Map<number, { pnl: number; count: number; wins: number }>()
  for (const t of closed) {
    const dow = getTradeDayOfWeek(t)
    if (dow > 5) continue // skip weekends
    const s = dayStats.get(dow) || { pnl: 0, count: 0, wins: 0 }
    s.pnl += t.netPnl
    s.count++
    if (t.netPnl > 0) s.wins++
    dayStats.set(dow, s)
  }

  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  let worstDay = -1, worstDayPnl = Infinity
  for (const [day, s] of dayStats) {
    if (s.count >= 3 && s.pnl < worstDayPnl) {
      worstDay = day
      worstDayPnl = s.pnl
    }
  }

  if (worstDay > 0 && worstDayPnl < 0) {
    const s = dayStats.get(worstDay)!
    insights.push({
      id: 'worst-day',
      category: 'timing',
      severity: 'warning',
      title: `Worst Day: ${dayNames[worstDay]}`,
      description: `${dayNames[worstDay]}s have $${worstDayPnl.toFixed(2)} total P&L across ${s.count} trades.`,
      impact: worstDayPnl,
      suggestion: `Consider taking ${dayNames[worstDay]}s off or trading with reduced size.`,
    })
  }

  // ── Morning vs Afternoon ──
  let morningPnl = 0, morningCount = 0
  let afternoonPnl = 0, afternoonCount = 0
  for (const t of closed) {
    const hour = getTradeHour(t)
    if (hour === null) continue
    if (hour < 12) {
      morningPnl += t.netPnl
      morningCount++
    } else {
      afternoonPnl += t.netPnl
      afternoonCount++
    }
  }

  if (morningCount >= 5 && afternoonCount >= 5) {
    const morningAvg = morningPnl / morningCount
    const afternoonAvg = afternoonPnl / afternoonCount
    if (Math.abs(morningAvg - afternoonAvg) > 20) {
      const better = morningAvg > afternoonAvg ? 'morning' : 'afternoon'
      const worse = better === 'morning' ? 'afternoon' : 'morning'
      const worsePnl = better === 'morning' ? afternoonPnl : morningPnl
      insights.push({
        id: 'session-time',
        category: 'timing',
        severity: worsePnl < 0 ? 'warning' : 'info',
        title: `${better === 'morning' ? 'Morning' : 'Afternoon'} Trader`,
        description: `Morning avg: $${morningAvg.toFixed(2)} (${morningCount} trades) vs Afternoon avg: $${afternoonAvg.toFixed(2)} (${afternoonCount} trades).`,
        impact: worsePnl < 0 ? worsePnl : undefined,
        suggestion: `You perform better in the ${better}. Consider reducing ${worse} trading.`,
      })
    }
  }

  // ── Heatmap Data ──
  const heatmapMap = new Map<string, TimeHeatmapCell>()
  for (const t of closed) {
    const hour = getTradeHour(t)
    const dow = getTradeDayOfWeek(t)
    if (hour === null || dow > 5) continue
    const key = `${hour}-${dow}`
    const cell = heatmapMap.get(key) || { hour, dayOfWeek: dow, pnl: 0, count: 0, avgPnl: 0 }
    cell.pnl += t.netPnl
    cell.count++
    heatmapMap.set(key, cell)
  }
  const heatmap = Array.from(heatmapMap.values()).map(c => ({
    ...c,
    avgPnl: c.count > 0 ? c.pnl / c.count : 0,
  }))

  return { insights, heatmap }
}

function formatHour(h: number): string {
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:00 ${suffix}`
}
