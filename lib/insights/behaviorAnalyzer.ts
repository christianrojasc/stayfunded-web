import { Trade } from '@/lib/types'
import { Insight } from './types'

function parseTime(trade: Trade): number | null {
  const t = trade.entryTime
  if (!t) return null
  // entryTime is "HH:MM" or "HH:MM:SS" — convert to minutes since midnight
  const parts = t.split(':')
  if (parts.length < 2) return null
  const hours = parseInt(parts[0], 10)
  const mins = parseInt(parts[1], 10)
  if (isNaN(hours) || isNaN(mins)) return null
  return hours * 60 + mins // minutes since midnight
}

function groupBySessionDate(trades: Trade[]): Map<string, Trade[]> {
  const map = new Map<string, Trade[]>()
  for (const t of trades) {
    const key = t.sessionDate || t.date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  // Sort each day's trades by entryTime
  for (const [, arr] of map) {
    arr.sort((a, b) => {
      const ta = parseTime(a)
      const tb = parseTime(b)
      if (ta && tb) return ta - tb
      return 0
    })
  }
  return map
}

export interface BehaviorData {
  revengeTradeCount: number
  revengeAvgPnl: number
  overtradeDays: number
  overtradeAvgPnl: number
  tiltEvents: number
  avgTradesPerDay: number
  firstTradeBias: { winRate: number; avgPnl: number; otherWinRate: number; otherAvgPnl: number }
  lossStreakBehavior: { streakLen: number; avgPnlAfter: number; count: number }[]
}

export function analyzeBehavior(trades: Trade[]): { insights: Insight[]; data: BehaviorData } {
  const insights: Insight[] = []
  const closed = trades.filter(t => t.status === 'closed')

  if (closed.length === 0) {
    return {
      insights: [],
      data: {
        revengeTradeCount: 0, revengeAvgPnl: 0,
        overtradeDays: 0, overtradeAvgPnl: 0,
        tiltEvents: 0, avgTradesPerDay: 0,
        firstTradeBias: { winRate: 0, avgPnl: 0, otherWinRate: 0, otherAvgPnl: 0 },
        lossStreakBehavior: [],
      },
    }
  }

  const byDay = groupBySessionDate(closed)

  // ── Revenge Trading ──
  let revengeCount = 0
  let revengePnlSum = 0
  for (const [, dayTrades] of byDay) {
    for (let i = 1; i < dayTrades.length; i++) {
      const prev = dayTrades[i - 1]
      const curr = dayTrades[i]
      if (prev.netPnl < 0) {
        const prevExit = prev.exitTime ? new Date(prev.exitTime).getTime() : null
        const currEntry = parseTime(curr)
        if (prevExit && currEntry && (currEntry - prevExit) < 3 * 60 * 1000) {
          revengeCount++
          revengePnlSum += curr.netPnl
        }
      }
    }
  }
  const revengeAvgPnl = revengeCount > 0 ? revengePnlSum / revengeCount : 0

  if (revengeCount > 0) {
    insights.push({
      id: 'revenge-trading',
      category: 'behavior',
      severity: revengeCount >= 5 ? 'critical' : 'warning',
      title: 'Revenge Trading Detected',
      description: `${revengeCount} trades were opened within 3 minutes of a loss, averaging $${revengeAvgPnl.toFixed(2)} P&L each.`,
      impact: revengePnlSum,
      suggestion: 'Take a 5-minute break after every losing trade. Walk away from the screen.',
    })
  }

  // ── Overtrading ──
  const dayCounts = Array.from(byDay.values()).map(d => d.length)
  const avgCount = dayCounts.reduce((a, b) => a + b, 0) / dayCounts.length
  const stddev = Math.sqrt(dayCounts.reduce((s, c) => s + (c - avgCount) ** 2, 0) / dayCounts.length)
  const threshold = avgCount + 1.5 * stddev

  let overtradeDays = 0
  let overtradePnlSum = 0
  let overtradeTradeCount = 0
  for (const [, dayTrades] of byDay) {
    if (dayTrades.length > threshold) {
      overtradeDays++
      const dayPnl = dayTrades.reduce((s, t) => s + t.netPnl, 0)
      overtradePnlSum += dayPnl
      overtradeTradeCount += dayTrades.length
    }
  }
  const overtradeAvgPnl = overtradeDays > 0 ? overtradePnlSum / overtradeDays : 0

  if (overtradeDays > 0) {
    insights.push({
      id: 'overtrading',
      category: 'behavior',
      severity: overtradeDays >= 3 ? 'warning' : 'info',
      title: 'Overtrading Days',
      description: `${overtradeDays} days had significantly more trades than average (>${Math.ceil(threshold)}). Those days averaged $${overtradeAvgPnl.toFixed(2)} P&L.`,
      impact: overtradePnlSum,
      suggestion: 'Set a maximum trade count per day. Quality over quantity.',
    })
  }

  // ── Tilt Detection ──
  let tiltEvents = 0
  for (const [, dayTrades] of byDay) {
    let consecutiveLosses = 0
    for (let i = 0; i < dayTrades.length; i++) {
      if (dayTrades[i].netPnl < 0) {
        consecutiveLosses++
        if (consecutiveLosses >= 3 && i + 1 < dayTrades.length) {
          // Check if frequency increased or size increased after streak
          const remaining = dayTrades.slice(i + 1)
          if (remaining.length > 0) {
            const avgSizeBefore = dayTrades.slice(0, i + 1).reduce((s, t) => s + t.contracts, 0) / (i + 1)
            const avgSizeAfter = remaining.reduce((s, t) => s + t.contracts, 0) / remaining.length
            if (avgSizeAfter > avgSizeBefore * 1.2 || remaining.length >= 2) {
              tiltEvents++
              break // Count once per day
            }
          }
        }
      } else {
        consecutiveLosses = 0
      }
    }
  }

  if (tiltEvents > 0) {
    insights.push({
      id: 'tilt-detection',
      category: 'behavior',
      severity: tiltEvents >= 3 ? 'critical' : 'warning',
      title: 'Tilt Events Detected',
      description: `${tiltEvents} sessions where 3+ consecutive losses led to continued aggressive trading.`,
      suggestion: 'Implement a hard stop rule: stop trading after 3 consecutive losses.',
    })
  }

  // ── First Trade Bias ──
  const firstTrades: Trade[] = []
  const otherTrades: Trade[] = []
  for (const [, dayTrades] of byDay) {
    if (dayTrades.length > 0) {
      firstTrades.push(dayTrades[0])
      otherTrades.push(...dayTrades.slice(1))
    }
  }
  const firstWinRate = firstTrades.length > 0 ? firstTrades.filter(t => t.netPnl > 0).length / firstTrades.length : 0
  const firstAvgPnl = firstTrades.length > 0 ? firstTrades.reduce((s, t) => s + t.netPnl, 0) / firstTrades.length : 0
  const otherWinRate = otherTrades.length > 0 ? otherTrades.filter(t => t.netPnl > 0).length / otherTrades.length : 0
  const otherAvgPnl = otherTrades.length > 0 ? otherTrades.reduce((s, t) => s + t.netPnl, 0) / otherTrades.length : 0

  if (firstTrades.length >= 5) {
    const diff = firstAvgPnl - otherAvgPnl
    if (Math.abs(diff) > 10) {
      insights.push({
        id: 'first-trade-bias',
        category: 'behavior',
        severity: diff > 0 ? 'positive' : 'info',
        title: diff > 0 ? 'Strong First Trade Performance' : 'Weak First Trade Performance',
        description: `First trade of the day: ${(firstWinRate * 100).toFixed(0)}% win rate, $${firstAvgPnl.toFixed(2)} avg P&L vs ${(otherWinRate * 100).toFixed(0)}% / $${otherAvgPnl.toFixed(2)} for subsequent trades.`,
        impact: diff * firstTrades.length,
        suggestion: diff > 0
          ? 'Your first trade edge is strong. Trust your opening read.'
          : 'Consider paper trading your first idea and entering on the second setup.',
      })
    }
  }

  // ── Loss Streak Behavior ──
  const lossStreakBehavior: { streakLen: number; avgPnlAfter: number; count: number }[] = []
  for (const streakLen of [2, 3, 4]) {
    const pnlsAfter: number[] = []
    for (const [, dayTrades] of byDay) {
      let consecutive = 0
      for (let i = 0; i < dayTrades.length; i++) {
        if (dayTrades[i].netPnl < 0) {
          consecutive++
        } else {
          consecutive = 0
        }
        if (consecutive === streakLen && i + 1 < dayTrades.length) {
          pnlsAfter.push(dayTrades[i + 1].netPnl)
        }
      }
    }
    if (pnlsAfter.length > 0) {
      lossStreakBehavior.push({
        streakLen,
        avgPnlAfter: pnlsAfter.reduce((a, b) => a + b, 0) / pnlsAfter.length,
        count: pnlsAfter.length,
      })
    }
  }

  const avgTradesPerDay = byDay.size > 0 ? closed.length / byDay.size : 0

  return {
    insights,
    data: {
      revengeTradeCount: revengeCount,
      revengeAvgPnl,
      overtradeDays,
      overtradeAvgPnl,
      tiltEvents,
      avgTradesPerDay,
      firstTradeBias: { winRate: firstWinRate, avgPnl: firstAvgPnl, otherWinRate, otherAvgPnl },
      lossStreakBehavior,
    },
  }
}
