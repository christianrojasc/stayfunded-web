import { Trade } from '@/lib/types'
import { WhatIfScenario, TimeHeatmapCell } from './types'

function groupBySessionDate(trades: Trade[]): Map<string, Trade[]> {
  const map = new Map<string, Trade[]>()
  for (const t of trades) {
    const key = t.sessionDate || t.date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => {
      const ta = a.entryTime || a.date
      const tb = b.entryTime || b.date
      return ta.localeCompare(tb)
    })
  }
  return map
}

export function generateWhatIfs(
  trades: Trade[],
  heatmap: TimeHeatmapCell[]
): WhatIfScenario[] {
  const closed = trades.filter(t => t.status === 'closed')
  if (closed.length < 5) return []

  const actualPnl = closed.reduce((s, t) => s + t.netPnl, 0)
  const scenarios: WhatIfScenario[] = []
  const byDay = groupBySessionDate(closed)

  // ── 1. Cost of trading after consecutive losses ──
  // Find all trades that happened AFTER 2+ consecutive losses in a day
  // and were themselves losers. These are the "revenge/tilt" trades.
  {
    let revengeLosses = 0
    let revengeLossPnl = 0
    let totalAfterStreak = 0
    for (const [, dayTrades] of byDay) {
      let consecLosses = 0
      for (const t of dayTrades) {
        if (consecLosses >= 2) {
          totalAfterStreak++
          if (t.netPnl < 0) {
            revengeLosses++
            revengeLossPnl += t.netPnl // negative number
          }
        }
        if (t.netPnl < 0) consecLosses++
        else consecLosses = 0
      }
    }
    if (revengeLosses > 0) {
      scenarios.push({
        id: 'revenge-loss-cost',
        label: 'Losing trades after 2+ loss streak',
        description: `You took ${totalAfterStreak} trades after hitting 2+ consecutive losses. ${revengeLosses} of those were losers.`,
        actualPnl,
        whatIfPnl: actualPnl - revengeLossPnl, // removing the losses = higher PnL
        difference: -revengeLossPnl, // positive number = money you'd save
        tradesAffected: revengeLosses,
      })
    }
  }

  // ── 2. Cost of your worst trading days ──
  // Your 3 worst days — how much did they drag you down?
  {
    const dailyPnl: { date: string; pnl: number; count: number }[] = []
    for (const [date, dayTrades] of byDay) {
      const pnl = dayTrades.reduce((s, t) => s + t.netPnl, 0)
      dailyPnl.push({ date, pnl, count: dayTrades.length })
    }
    dailyPnl.sort((a, b) => a.pnl - b.pnl) // worst first

    const worstN = Math.min(3, dailyPnl.filter(d => d.pnl < 0).length)
    if (worstN > 0) {
      const worstDays = dailyPnl.slice(0, worstN)
      const worstPnl = worstDays.reduce((s, d) => s + d.pnl, 0)
      const worstTrades = worstDays.reduce((s, d) => s + d.count, 0)
      scenarios.push({
        id: 'worst-days-cost',
        label: `Your ${worstN} worst day${worstN > 1 ? 's' : ''} cost you`,
        description: `${worstDays.map(d => d.date.slice(5)).join(', ')} — these days wiped out $${Math.abs(worstPnl).toFixed(0)} of your profits.`,
        actualPnl,
        whatIfPnl: actualPnl - worstPnl,
        difference: -worstPnl,
        tradesAffected: worstTrades,
      })
    }
  }

  // ── 3. Cost of losing instruments ──
  // Instruments where you have negative P&L — how much are they costing you?
  {
    const symbolPnl = new Map<string, { pnl: number; count: number }>()
    for (const t of closed) {
      const s = symbolPnl.get(t.symbol) || { pnl: 0, count: 0 }
      s.pnl += t.netPnl
      s.count++
      symbolPnl.set(t.symbol, s)
    }

    const losers: { symbol: string; pnl: number; count: number }[] = []
    for (const [sym, s] of symbolPnl) {
      if (s.pnl < 0 && s.count >= 2) losers.push({ symbol: sym, ...s })
    }
    losers.sort((a, b) => a.pnl - b.pnl)

    if (losers.length > 0) {
      const totalLoss = losers.reduce((s, l) => s + l.pnl, 0)
      const totalCount = losers.reduce((s, l) => s + l.count, 0)
      const names = losers.map(l => `${l.symbol} ($${Math.abs(l.pnl).toFixed(0)})`).join(', ')
      scenarios.push({
        id: 'losing-instruments',
        label: 'Unprofitable instruments cost you',
        description: `${names} — you're losing money on ${losers.length === 1 ? 'this instrument' : 'these instruments'}. Consider dropping them.`,
        actualPnl,
        whatIfPnl: actualPnl - totalLoss,
        difference: -totalLoss,
        tradesAffected: totalCount,
      })
    }
  }

  // ── 4. Cost of large outlier losses ──
  // Trades where loss > 2x your average loss
  {
    const losses = closed.filter(t => t.netPnl < 0)
    if (losses.length >= 3) {
      const avgLoss = losses.reduce((s, t) => s + t.netPnl, 0) / losses.length
      const outliers = losses.filter(t => t.netPnl < avgLoss * 2) // worse than 2x avg
      if (outliers.length > 0) {
        const outlierPnl = outliers.reduce((s, t) => s + t.netPnl, 0)
        // What if those outliers were capped at average loss?
        const cappedPnl = outliers.length * avgLoss
        const saved = cappedPnl - outlierPnl // how much you'd save by capping
        if (saved > 50) {
          scenarios.push({
            id: 'outlier-losses',
            label: 'Oversized losses cost you',
            description: `${outliers.length} trades lost more than 2x your average loss ($${Math.abs(avgLoss).toFixed(0)}). If capped at avg, you'd keep $${saved.toFixed(0)}.`,
            actualPnl,
            whatIfPnl: actualPnl + saved,
            difference: saved,
            tradesAffected: outliers.length,
          })
        }
      }
    }
  }

  // ── 5. Cost of worst day of week ──
  {
    const dowPnl = new Map<number, { pnl: number; count: number }>()
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (const t of closed) {
      const d = new Date((t.sessionDate || t.date) + 'T12:00:00')
      const dow = d.getUTCDay()
      if (dow === 0 || dow === 6) continue
      const s = dowPnl.get(dow) || { pnl: 0, count: 0 }
      s.pnl += t.netPnl
      s.count++
      dowPnl.set(dow, s)
    }

    let worstDow = -1, worstDowPnl = Infinity
    for (const [dow, s] of dowPnl) {
      if (s.count >= 3 && s.pnl < worstDowPnl) {
        worstDow = dow
        worstDowPnl = s.pnl
      }
    }

    if (worstDow > 0 && worstDowPnl < 0) {
      const count = dowPnl.get(worstDow)!.count
      scenarios.push({
        id: 'worst-day-of-week',
        label: `${dayNames[worstDow]}s are costing you`,
        description: `You lose $${Math.abs(worstDowPnl).toFixed(0)} total on ${dayNames[worstDow]}s (${count} trades). Consider sitting out or reducing size.`,
        actualPnl,
        whatIfPnl: actualPnl - worstDowPnl,
        difference: -worstDowPnl,
        tradesAffected: count,
      })
    }
  }

  // ── 6. Overtrading days cost ──
  // Days where you took significantly more trades than average and lost money
  {
    const dailyCounts: { date: string; count: number; pnl: number }[] = []
    for (const [date, dayTrades] of byDay) {
      dailyCounts.push({ date, count: dayTrades.length, pnl: dayTrades.reduce((s, t) => s + t.netPnl, 0) })
    }
    if (dailyCounts.length >= 3) {
      const avgCount = dailyCounts.reduce((s, d) => s + d.count, 0) / dailyCounts.length
      const overtradeDays = dailyCounts.filter(d => d.count > avgCount * 1.5 && d.pnl < 0)
      if (overtradeDays.length > 0) {
        const totalLoss = overtradeDays.reduce((s, d) => s + d.pnl, 0)
        const totalTrades = overtradeDays.reduce((s, d) => s + d.count, 0)
        scenarios.push({
          id: 'overtrading-cost',
          label: 'Overtrading days cost you',
          description: `${overtradeDays.length} day${overtradeDays.length > 1 ? 's' : ''} where you traded ${Math.round(avgCount * 1.5)}+ times and lost money. Total damage: $${Math.abs(totalLoss).toFixed(0)}.`,
          actualPnl,
          whatIfPnl: actualPnl - totalLoss,
          difference: -totalLoss,
          tradesAffected: totalTrades,
        })
      }
    }
  }

  // Sort by difference (biggest savings first)
  scenarios.sort((a, b) => b.difference - a.difference)

  return scenarios
}
