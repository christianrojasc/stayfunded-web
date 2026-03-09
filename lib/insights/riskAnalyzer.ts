import { Trade } from '@/lib/types'
import { Insight } from './types'

export function analyzeRisk(trades: Trade[]): Insight[] {
  const insights: Insight[] = []
  const closed = trades.filter(t => t.status === 'closed')

  if (closed.length < 5) return []

  const wins = closed.filter(t => t.netPnl > 0)
  const losses = closed.filter(t => t.netPnl < 0)

  // ── R:R Ratio ──
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.netPnl, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.netPnl, 0) / losses.length) : 1
  const rr = avgLoss > 0 ? avgWin / avgLoss : 0

  if (rr > 0 && rr < 1) {
    insights.push({
      id: 'rr-ratio-low',
      category: 'risk',
      severity: 'warning',
      title: 'Low Reward-to-Risk Ratio',
      description: `Your average win ($${avgWin.toFixed(2)}) is smaller than your average loss ($${avgLoss.toFixed(2)}). R:R = ${rr.toFixed(2)}.`,
      impact: -(avgLoss - avgWin) * losses.length,
      suggestion: 'Widen your targets or tighten your stops to improve R:R above 1.0.',
    })
  } else if (rr >= 2) {
    insights.push({
      id: 'rr-ratio-good',
      category: 'risk',
      severity: 'positive',
      title: 'Strong Reward-to-Risk Ratio',
      description: `Average win $${avgWin.toFixed(2)} vs average loss $${avgLoss.toFixed(2)}. R:R = ${rr.toFixed(2)}.`,
      suggestion: 'Keep managing risk well. Your winners outpace your losers.',
    })
  }

  // ── Position Sizing Consistency ──
  const sizes = closed.map(t => t.contracts)
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length
  const sizeStddev = Math.sqrt(sizes.reduce((s, c) => s + (c - avgSize) ** 2, 0) / sizes.length)
  const sizeCV = avgSize > 0 ? sizeStddev / avgSize : 0

  if (sizeCV > 0.5 && closed.length >= 10) {
    insights.push({
      id: 'inconsistent-sizing',
      category: 'risk',
      severity: 'warning',
      title: 'Inconsistent Position Sizing',
      description: `Position sizes vary significantly (CV: ${(sizeCV * 100).toFixed(0)}%). Avg: ${avgSize.toFixed(1)} contracts, StdDev: ${sizeStddev.toFixed(1)}.`,
      suggestion: 'Standardize your position size. Varying size often indicates emotional trading.',
    })
  }

  // ── Daily P&L Variance ──
  const dailyPnl = new Map<string, number>()
  for (const t of closed) {
    const key = t.sessionDate || t.date
    dailyPnl.set(key, (dailyPnl.get(key) || 0) + t.netPnl)
  }
  const dailyPnls = Array.from(dailyPnl.values())
  if (dailyPnls.length >= 5) {
    const avgDaily = dailyPnls.reduce((a, b) => a + b, 0) / dailyPnls.length
    const dailyStddev = Math.sqrt(dailyPnls.reduce((s, p) => s + (p - avgDaily) ** 2, 0) / dailyPnls.length)
    const dailyCV = Math.abs(avgDaily) > 0 ? dailyStddev / Math.abs(avgDaily) : 0

    if (dailyCV > 2) {
      insights.push({
        id: 'high-daily-variance',
        category: 'risk',
        severity: 'warning',
        title: 'High Daily P&L Variance',
        description: `Your daily P&L swings widely. Avg: $${avgDaily.toFixed(2)}, StdDev: $${dailyStddev.toFixed(2)}.`,
        suggestion: 'Reduce variance with consistent sizing and a daily loss limit.',
      })
    }
  }

  // ── Max Loss Management ──
  if (losses.length >= 3) {
    const maxLoss = Math.min(...losses.map(t => t.netPnl))
    const medianLoss = [...losses.map(t => t.netPnl)].sort((a, b) => a - b)[Math.floor(losses.length / 2)]
    if (maxLoss < medianLoss * 2.5) {
      insights.push({
        id: 'max-loss-outlier',
        category: 'risk',
        severity: 'critical',
        title: 'Large Loss Outliers',
        description: `Your worst loss ($${maxLoss.toFixed(2)}) is significantly larger than typical losses (median: $${medianLoss.toFixed(2)}).`,
        impact: maxLoss - medianLoss,
        suggestion: 'Use hard stop losses on every trade. Never move a stop further away.',
      })
    }
  }

  // ── Drawdown Recovery ──
  if (dailyPnls.length >= 10) {
    let peak = 0, equity = 0, maxDD = 0, ddDays = 0, maxDDDays = 0, inDD = false
    for (const pnl of dailyPnls) {
      equity += pnl
      if (equity > peak) {
        peak = equity
        if (inDD) {
          maxDDDays = Math.max(maxDDDays, ddDays)
          ddDays = 0
          inDD = false
        }
      } else {
        const dd = peak - equity
        if (dd > maxDD) maxDD = dd
        inDD = true
        ddDays++
      }
    }
    if (inDD) maxDDDays = Math.max(maxDDDays, ddDays)

    if (maxDD > 0) {
      insights.push({
        id: 'drawdown-info',
        category: 'risk',
        severity: maxDDDays > 10 ? 'warning' : 'info',
        title: 'Drawdown Analysis',
        description: `Max drawdown: $${maxDD.toFixed(2)}. Longest recovery: ${maxDDDays} trading days.`,
        impact: -maxDD,
        suggestion: maxDDDays > 10 ? 'Long drawdowns indicate edge erosion. Review your strategy.' : 'Drawdowns are manageable. Stay disciplined.',
      })
    }
  }

  return insights
}
