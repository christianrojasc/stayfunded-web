export type InsightSeverity = 'critical' | 'warning' | 'info' | 'positive'
export type InsightCategory = 'behavior' | 'timing' | 'risk' | 'instrument' | 'compliance'

export interface Insight {
  id: string
  category: InsightCategory
  severity: InsightSeverity
  title: string
  description: string
  impact?: number
  suggestion?: string
  data?: Record<string, unknown>
}

export interface WhatIfScenario {
  id: string
  label: string
  description: string
  actualPnl: number
  whatIfPnl: number
  difference: number
  tradesAffected: number
}

export interface TradingScore {
  overall: number
  consistency: number
  discipline: number
  riskManagement: number
  edge: number
  journaling: number
  trend: number
}

export interface TimeHeatmapCell {
  hour: number
  dayOfWeek: number
  pnl: number
  count: number
  avgPnl: number
}

export interface InstrumentEdge {
  symbol: string
  count: number
  pnl: number
  winRate: number
  avgPnl: number
  profitFactor: number
  isEdge: boolean
}
