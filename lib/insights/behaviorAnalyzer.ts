import { Trade } from '@/lib/types'
import { Insight } from './types'

// ── Helpers ──

/** Parse entryTime/exitTime "HH:MM" or "HH:MM:SS" → seconds since midnight */
function parseTimeToSeconds(timeStr: string | undefined): number | null {
  if (!timeStr) return null
  const parts = timeStr.split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const s = parts.length >= 3 ? parseInt(parts[2], 10) : 0
  if (isNaN(h) || isNaN(m) || isNaN(s)) return null
  return h * 3600 + m * 60 + s
}

/** Get hold duration in seconds between entry and exit times */
function holdDurationSeconds(trade: Trade): number | null {
  const entry = parseTimeToSeconds(trade.entryTime)
  const exit = parseTimeToSeconds(trade.exitTime)
  if (entry === null || exit === null) return null
  let diff = exit - entry
  if (diff < 0) diff += 86400 // crossed midnight
  return diff
}

/** Get gap in seconds between prev trade's exit and next trade's entry */
function gapBetweenTrades(prev: Trade, next: Trade): number | null {
  const prevExit = parseTimeToSeconds(prev.exitTime)
  const nextEntry = parseTimeToSeconds(next.entryTime)
  if (prevExit === null || nextEntry === null) return null
  let diff = nextEntry - prevExit
  if (diff < 0) diff += 86400
  return diff
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
      const ta = parseTimeToSeconds(a.entryTime)
      const tb = parseTimeToSeconds(b.entryTime)
      if (ta !== null && tb !== null) return ta - tb
      return 0
    })
  }
  return map
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

// ── Types ──

export interface BehaviorData {
  revengeTradeCount: number
  revengeAvgPnl: number
  revengeTotalCost: number
  overtradeDays: number
  overtradeAvgPnl: number
  tiltEvents: number
  avgTradesPerDay: number
  firstTradeBias: { winRate: number; avgPnl: number; otherWinRate: number; otherAvgPnl: number }
  lossStreakBehavior: { streakLen: number; avgPnlAfter: number; count: number }[]
  // New fields
  sizeEscalationEvents: number
  sizeEscalationAvgPnl: number
  avgHoldWinners: number    // seconds
  avgHoldLosers: number     // seconds
  ultraShortTrades: number  // held < 5 seconds
  rapidFireClusters: number // 3+ trades within 2 minutes
  lateSessionPnl: number    // P&L after 10PM ET
  earlySessionPnl: number   // P&L before 10PM ET
  lateSessionCount: number
  earlySessionCount: number
}

// ── Main Analyzer ──

export function analyzeBehavior(trades: Trade[]): { insights: Insight[]; data: BehaviorData } {
  const insights: Insight[] = []
  const closed = trades.filter(t => t.status === 'closed')

  const empty: BehaviorData = {
    revengeTradeCount: 0, revengeAvgPnl: 0, revengeTotalCost: 0,
    overtradeDays: 0, overtradeAvgPnl: 0,
    tiltEvents: 0, avgTradesPerDay: 0,
    firstTradeBias: { winRate: 0, avgPnl: 0, otherWinRate: 0, otherAvgPnl: 0 },
    lossStreakBehavior: [],
    sizeEscalationEvents: 0, sizeEscalationAvgPnl: 0,
    avgHoldWinners: 0, avgHoldLosers: 0,
    ultraShortTrades: 0, rapidFireClusters: 0,
    lateSessionPnl: 0, earlySessionPnl: 0,
    lateSessionCount: 0, earlySessionCount: 0,
  }

  if (closed.length === 0) return { insights: [], data: empty }

  const byDay = groupBySessionDate(closed)

  // ══════════════════════════════════════════════
  // 1. REVENGE TRADING
  // Re-entry within 3 minutes of a loss, especially with increased size
  // ══════════════════════════════════════════════
  let revengeCount = 0
  let revengePnlSum = 0
  const revengeTrades: { trade: Trade; gap: number; sizeIncrease: boolean }[] = []

  for (const [, dayTrades] of byDay) {
    for (let i = 1; i < dayTrades.length; i++) {
      const prev = dayTrades[i - 1]
      const curr = dayTrades[i]
      if (prev.netPnl < 0) {
        const gap = gapBetweenTrades(prev, curr)
        if (gap !== null && gap < 180) { // within 3 minutes
          revengeCount++
          revengePnlSum += curr.netPnl
          revengeTrades.push({
            trade: curr,
            gap,
            sizeIncrease: curr.contracts > prev.contracts
          })
        }
      }
    }
  }

  const revengeAvgPnl = revengeCount > 0 ? revengePnlSum / revengeCount : 0
  const revengeWithSizeUp = revengeTrades.filter(r => r.sizeIncrease).length

  if (revengeCount > 0) {
    const desc = revengeWithSizeUp > 0
      ? `${revengeCount} trades entered within 3 minutes of a loss (${revengeWithSizeUp} with increased size), averaging ${revengeAvgPnl >= 0 ? '+' : ''}$${revengeAvgPnl.toFixed(0)} P&L. Total cost: $${Math.abs(revengePnlSum).toFixed(0)}.`
      : `${revengeCount} trades entered within 3 minutes of a loss, averaging ${revengeAvgPnl >= 0 ? '+' : ''}$${revengeAvgPnl.toFixed(0)} P&L.`
    insights.push({
      id: 'revenge-trading',
      category: 'behavior',
      severity: revengeCount >= 5 || revengeWithSizeUp >= 2 ? 'critical' : 'warning',
      title: 'Revenge Trading Detected',
      description: desc,
      impact: revengePnlSum,
      suggestion: revengeWithSizeUp > 0
        ? 'You\'re doubling down after losses — the worst combo. Take a 5-minute break after every loss and NEVER increase size on the next trade.'
        : 'Take a 5-minute break after every losing trade. Walk away from the screen.',
    })
  }

  // ══════════════════════════════════════════════
  // 2. SIZE ESCALATION
  // Increasing position size 2+ times within a session without plan
  // ══════════════════════════════════════════════
  let sizeEscalationEvents = 0
  let sizeEscalationPnlSum = 0
  let sizeEscalationTradeCount = 0

  for (const [, dayTrades] of byDay) {
    if (dayTrades.length < 3) continue
    const sizes = dayTrades.map(t => t.contracts)
    const startSize = sizes[0]
    let escalated = false
    let escalationIdx = -1

    // Detect if size increases significantly (50%+) from starting size
    for (let i = 1; i < sizes.length; i++) {
      if (sizes[i] > startSize * 1.5 && sizes[i] > sizes[Math.max(0, i - 1)]) {
        if (!escalated) {
          escalated = true
          escalationIdx = i
        }
      }
    }

    if (escalated && escalationIdx >= 0) {
      sizeEscalationEvents++
      const escalatedTrades = dayTrades.slice(escalationIdx)
      const escalatedPnl = escalatedTrades.reduce((s, t) => s + t.netPnl, 0)
      const baseTrades = dayTrades.slice(0, escalationIdx)
      const basePnl = baseTrades.reduce((s, t) => s + t.netPnl, 0)

      sizeEscalationPnlSum += escalatedPnl
      sizeEscalationTradeCount += escalatedTrades.length

      // Check if bigger size = worse results (common pattern)
      const baseAvg = baseTrades.length > 0 ? basePnl / baseTrades.length : 0
      const escalatedAvg = escalatedTrades.length > 0 ? escalatedPnl / escalatedTrades.length : 0
    }
  }

  const sizeEscalationAvgPnl = sizeEscalationTradeCount > 0
    ? sizeEscalationPnlSum / sizeEscalationTradeCount
    : 0

  if (sizeEscalationEvents > 0) {
    // Compare P&L of small vs large trades across ALL data
    const avgSize = closed.reduce((s, t) => s + t.contracts, 0) / closed.length
    const smallTrades = closed.filter(t => t.contracts <= avgSize)
    const bigTrades = closed.filter(t => t.contracts > avgSize)
    const smallPnl = smallTrades.length > 0 ? smallTrades.reduce((s, t) => s + t.netPnl, 0) : 0
    const bigPnl = bigTrades.length > 0 ? bigTrades.reduce((s, t) => s + t.netPnl, 0) : 0
    const smallAvg = smallTrades.length > 0 ? smallPnl / smallTrades.length : 0
    const bigAvg = bigTrades.length > 0 ? bigPnl / bigTrades.length : 0

    insights.push({
      id: 'size-escalation',
      category: 'behavior',
      severity: sizeEscalationEvents >= 3 || (bigAvg < 0 && smallAvg > 0) ? 'critical' : 'warning',
      title: 'Size Escalation Without a Plan',
      description: `${sizeEscalationEvents} sessions where you escalated position size mid-session. Small trades (≤${Math.ceil(avgSize)} lots) avg ${smallAvg >= 0 ? '+' : ''}$${smallAvg.toFixed(0)}/trade vs larger trades avg ${bigAvg >= 0 ? '+' : ''}$${bigAvg.toFixed(0)}/trade.`,
      impact: bigPnl,
      suggestion: bigAvg < smallAvg
        ? 'Bigger size correlated with worse decisions. Stick to your base size until you have 3 consecutive green days.'
        : 'Only increase size with a pre-planned reason (high-conviction setup, not emotion).',
    })
  }

  // ══════════════════════════════════════════════
  // 3. HOLD TIME ASYMMETRY
  // Holding losers longer than winners (the opposite of what you want)
  // ══════════════════════════════════════════════
  const winHolds: number[] = []
  const lossHolds: number[] = []
  for (const t of closed) {
    const hold = holdDurationSeconds(t)
    if (hold === null) continue
    if (t.netPnl > 0) winHolds.push(hold)
    else if (t.netPnl < 0) lossHolds.push(hold)
  }

  const avgHoldWinners = winHolds.length > 0 ? winHolds.reduce((a, b) => a + b, 0) / winHolds.length : 0
  const avgHoldLosers = lossHolds.length > 0 ? lossHolds.reduce((a, b) => a + b, 0) / lossHolds.length : 0

  if (winHolds.length >= 3 && lossHolds.length >= 3 && avgHoldLosers > avgHoldWinners * 1.5) {
    insights.push({
      id: 'hold-asymmetry',
      category: 'behavior',
      severity: avgHoldLosers > avgHoldWinners * 3 ? 'critical' : 'warning',
      title: 'Holding Losers Longer Than Winners',
      description: `You hold losing trades ${formatDuration(avgHoldLosers)} on average, but only ${formatDuration(avgHoldWinners)} for winners. That's ${(avgHoldLosers / avgHoldWinners).toFixed(1)}x longer for losers — the exact opposite of what profitable traders do.`,
      impact: lossHolds.reduce((s, _, i) => s + (closed.filter(t => t.netPnl < 0)[i]?.netPnl || 0), 0),
      suggestion: 'Set a hard time-based stop. If a trade isn\'t working within your average winner hold time, cut it.',
    })
  }

  // ══════════════════════════════════════════════
  // 4. ULTRA-SHORT TRADES (1-5 seconds)
  // Compulsive clicking / accidental entries
  // ══════════════════════════════════════════════
  const ultraShortTrades: Trade[] = []
  for (const t of closed) {
    const hold = holdDurationSeconds(t)
    if (hold !== null && hold <= 5) {
      ultraShortTrades.push(t)
    }
  }

  const ultraShortCount = ultraShortTrades.length
  if (ultraShortCount > 0) {
    const ultraPnl = ultraShortTrades.reduce((s, t) => s + t.netPnl, 0)
    insights.push({
      id: 'ultra-short-trades',
      category: 'behavior',
      severity: ultraShortCount >= 5 ? 'critical' : ultraShortCount >= 2 ? 'warning' : 'info',
      title: 'Ultra-Short Trades (≤5 seconds)',
      description: `${ultraShortCount} trades held for 5 seconds or less, totaling ${ultraPnl >= 0 ? '+' : ''}$${ultraPnl.toFixed(0)}. These look like accidental entries or compulsive clicking — not real setups.`,
      impact: ultraPnl,
      suggestion: 'These aren\'t trades — they\'re clicks. If this happens often, it signals discipline has broken down. Stop trading for the day.',
    })
  }

  // ══════════════════════════════════════════════
  // 5. RAPID-FIRE CLUSTERS
  // 3+ trades within 2 minutes of each other
  // ══════════════════════════════════════════════
  let rapidFireClusters = 0
  for (const [, dayTrades] of byDay) {
    if (dayTrades.length < 3) continue
    for (let i = 0; i < dayTrades.length - 2; i++) {
      const first = parseTimeToSeconds(dayTrades[i].entryTime)
      const third = parseTimeToSeconds(dayTrades[i + 2].entryTime)
      if (first !== null && third !== null) {
        let span = third - first
        if (span < 0) span += 86400
        if (span <= 120) { // 3 trades within 2 minutes
          rapidFireClusters++
          // Skip ahead to avoid double-counting overlapping clusters
          i += 2
        }
      }
    }
  }

  if (rapidFireClusters > 0) {
    insights.push({
      id: 'rapid-fire',
      category: 'behavior',
      severity: rapidFireClusters >= 3 ? 'critical' : 'warning',
      title: 'Rapid-Fire Trading',
      description: `${rapidFireClusters} instances of 3+ trades within 2 minutes. This isn\'t strategy — it\'s impulse. Quality entries need time to develop.`,
      suggestion: 'Enforce a 60-second minimum between entries. If you can\'t wait 60 seconds, the trade isn\'t worth taking.',
    })
  }

  // ══════════════════════════════════════════════
  // 6. LATE-SESSION DETERIORATION
  // Performance drops after 10 PM ET
  // ══════════════════════════════════════════════
  let earlySessionPnl = 0, lateSessionPnl = 0
  let earlySessionCount = 0, lateSessionCount = 0
  const LATE_CUTOFF = 22 * 3600 // 10 PM

  for (const t of closed) {
    const entry = parseTimeToSeconds(t.entryTime)
    if (entry === null) continue
    if (entry >= LATE_CUTOFF || entry < 5 * 3600) { // 10PM to 5AM = late night
      lateSessionPnl += t.netPnl
      lateSessionCount++
    } else {
      earlySessionPnl += t.netPnl
      earlySessionCount++
    }
  }

  if (lateSessionCount >= 3 && earlySessionCount >= 3) {
    const lateAvg = lateSessionPnl / lateSessionCount
    const earlyAvg = earlySessionPnl / earlySessionCount

    if (lateAvg < earlyAvg && lateSessionPnl < 0) {
      insights.push({
        id: 'late-session',
        category: 'behavior',
        severity: lateSessionPnl < -200 ? 'critical' : 'warning',
        title: 'Late-Night Trading Is Costing You',
        description: `After 10 PM: ${lateSessionCount} trades, ${lateSessionPnl >= 0 ? '+' : ''}$${lateSessionPnl.toFixed(0)} (avg $${lateAvg.toFixed(0)}/trade). Before 10 PM: ${earlySessionCount} trades, +$${earlySessionPnl.toFixed(0)} (avg $${earlyAvg.toFixed(0)}/trade). Your discipline deteriorates at night.`,
        impact: lateSessionPnl,
        suggestion: earlySessionPnl > 0
          ? `Without late-night trades, you\'d be up $${earlySessionPnl.toFixed(0)} instead of $${(earlySessionPnl + lateSessionPnl).toFixed(0)}. Consider a hard 10 PM cutoff.`
          : 'Set a hard cutoff time. Stop trading after 10 PM — you\'re giving back your gains.',
      })
    } else if (lateAvg > earlyAvg && lateSessionPnl > 0) {
      insights.push({
        id: 'late-session-positive',
        category: 'behavior',
        severity: 'positive',
        title: 'Strong Evening Performance',
        description: `After 10 PM: ${lateSessionCount} trades averaging +$${lateAvg.toFixed(0)}/trade vs $${earlyAvg.toFixed(0)}/trade before 10 PM. You trade well at night.`,
      })
    }
  }

  // ══════════════════════════════════════════════
  // 7. OVERTRADING
  // ══════════════════════════════════════════════
  const dayCounts = Array.from(byDay.values()).map(d => d.length)
  const avgCount = dayCounts.reduce((a, b) => a + b, 0) / dayCounts.length
  const stddev = Math.sqrt(dayCounts.reduce((s, c) => s + (c - avgCount) ** 2, 0) / dayCounts.length)
  const threshold = Math.max(avgCount + 1.5 * stddev, 8) // at least 8

  let overtradeDays = 0
  let overtradePnlSum = 0
  for (const [, dayTrades] of byDay) {
    if (dayTrades.length > threshold) {
      overtradeDays++
      overtradePnlSum += dayTrades.reduce((s, t) => s + t.netPnl, 0)
    }
  }
  const overtradeAvgPnl = overtradeDays > 0 ? overtradePnlSum / overtradeDays : 0

  if (overtradeDays > 0) {
    insights.push({
      id: 'overtrading',
      category: 'behavior',
      severity: overtradeDays >= 3 ? 'warning' : 'info',
      title: 'Overtrading Days',
      description: `${overtradeDays} days had significantly more trades than average (>${Math.ceil(threshold)}). Those days averaged $${overtradeAvgPnl.toFixed(0)} P&L.`,
      impact: overtradePnlSum,
      suggestion: 'Set a maximum trade count per day. Quality over quantity.',
    })
  }

  // ══════════════════════════════════════════════
  // 8. TILT DETECTION
  // 3+ consecutive losses → continued aggressive trading
  // ══════════════════════════════════════════════
  let tiltEvents = 0
  for (const [, dayTrades] of byDay) {
    let consecutiveLosses = 0
    for (let i = 0; i < dayTrades.length; i++) {
      if (dayTrades[i].netPnl < 0) {
        consecutiveLosses++
        if (consecutiveLosses >= 3 && i + 1 < dayTrades.length) {
          const remaining = dayTrades.slice(i + 1)
          if (remaining.length > 0) {
            const avgSizeBefore = dayTrades.slice(0, i + 1).reduce((s, t) => s + t.contracts, 0) / (i + 1)
            const avgSizeAfter = remaining.reduce((s, t) => s + t.contracts, 0) / remaining.length
            if (avgSizeAfter > avgSizeBefore * 1.2 || remaining.length >= 2) {
              tiltEvents++
              break
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

  // ══════════════════════════════════════════════
  // 9. FIRST TRADE BIAS
  // ══════════════════════════════════════════════
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

  // ══════════════════════════════════════════════
  // 10. LOSS STREAK BEHAVIOR
  // ══════════════════════════════════════════════
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
      revengeTotalCost: revengePnlSum,
      overtradeDays,
      overtradeAvgPnl,
      tiltEvents,
      avgTradesPerDay,
      firstTradeBias: { winRate: firstWinRate, avgPnl: firstAvgPnl, otherWinRate, otherAvgPnl },
      lossStreakBehavior,
      sizeEscalationEvents,
      sizeEscalationAvgPnl,
      avgHoldWinners,
      avgHoldLosers,
      ultraShortTrades: ultraShortCount,
      rapidFireClusters,
      lateSessionPnl,
      earlySessionPnl,
      lateSessionCount,
      earlySessionCount,
    },
  }
}
