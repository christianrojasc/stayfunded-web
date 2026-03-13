import { Trade, DailyNote } from '@/lib/types'
import { Insight, WhatIfScenario, TradingScore, TimeHeatmapCell, InstrumentEdge } from './types'
import { analyzeBehavior, BehaviorData } from './behaviorAnalyzer'
import { analyzeTime } from './timeAnalyzer'
import { analyzeRisk } from './riskAnalyzer'
import { generateWhatIfs } from './whatIfEngine'
import { calculateScore } from './scoringEngine'

export interface InsightsResult {
  score: TradingScore
  insights: Insight[]
  whatIfs: WhatIfScenario[]
  heatmap: TimeHeatmapCell[]
  instruments: InstrumentEdge[]
  behaviorData: BehaviorData
}

export function generateInsights(trades: Trade[], notes: DailyNote[]): InsightsResult {
  const closed = trades.filter(t => t.status === 'closed')

  if (closed.length === 0) {
    return {
      score: { overall: 0, consistency: 0, discipline: 0, riskManagement: 0, edge: 0, journaling: 0, trend: 0 },
      insights: [],
      whatIfs: [],
      heatmap: [],
      instruments: [],
      behaviorData: {
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
      },
    }
  }

  // Run analyzers
  const behavior = analyzeBehavior(closed)
  const time = analyzeTime(closed)
  const riskInsights = analyzeRisk(closed)
  const whatIfs = generateWhatIfs(closed, time.heatmap)
  const score = calculateScore(closed, notes, behavior.data)

  // Build instrument edge table
  const symbolMap = new Map<string, { wins: number; losses: number; grossWin: number; grossLoss: number; pnl: number; count: number }>()
  for (const t of closed) {
    const s = symbolMap.get(t.symbol) || { wins: 0, losses: 0, grossWin: 0, grossLoss: 0, pnl: 0, count: 0 }
    s.pnl += t.netPnl
    s.count++
    if (t.netPnl > 0) {
      s.wins++
      s.grossWin += t.netPnl
    } else {
      s.losses++
      s.grossLoss += Math.abs(t.netPnl)
    }
    symbolMap.set(t.symbol, s)
  }

  const instruments: InstrumentEdge[] = Array.from(symbolMap.entries()).map(([symbol, s]) => ({
    symbol,
    count: s.count,
    pnl: s.pnl,
    winRate: s.count > 0 ? s.wins / s.count : 0,
    avgPnl: s.count > 0 ? s.pnl / s.count : 0,
    profitFactor: s.grossLoss > 0 ? s.grossWin / s.grossLoss : s.grossWin > 0 ? 999 : 0,
    isEdge: s.count >= 5 && s.pnl > 0 && (s.grossLoss > 0 ? s.grossWin / s.grossLoss : 999) > 1.2,
  })).sort((a, b) => b.avgPnl - a.avgPnl)

  // Combine all insights and sort by absolute impact
  const allInsights = [...behavior.insights, ...time.insights, ...riskInsights]
  allInsights.sort((a, b) => Math.abs(b.impact || 0) - Math.abs(a.impact || 0))

  return {
    score,
    insights: allInsights,
    whatIfs,
    heatmap: time.heatmap,
    instruments,
    behaviorData: behavior.data,
  }
}

export type { Insight, WhatIfScenario, TradingScore, TimeHeatmapCell, InstrumentEdge, BehaviorData }
export type { InsightSeverity, InsightCategory } from './types'
