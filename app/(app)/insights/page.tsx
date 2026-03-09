'use client'
import { useMemo, useState, useEffect } from 'react'
import { useTrades } from '@/components/TradeContext'
import { useAccountFilter } from '@/components/AccountFilterContext'
import AccountSelector from '@/components/AccountSelector'
import { generateInsights, InsightsResult, Insight, WhatIfScenario, TimeHeatmapCell, InstrumentEdge } from '@/lib/insights'
import { DailyNote } from '@/lib/types'
import * as dl from '@/lib/data-layer'
import {
  Brain, AlertTriangle, AlertCircle, Info, CheckCircle, TrendingUp, TrendingDown,
  Zap, Clock, Shield, BarChart3, Target, BookOpen, Flame, Activity
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'

const GLASS = 'bg-[var(--bg-card)] backdrop-blur-[20px] border border-[var(--border)] rounded-2xl'
const TT_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--text-primary)',
  padding: '8px 12px',
}

// ── Score Circle ──
function ScoreCircle({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? 'var(--green)' : score >= 40 ? '#F59E0B' : 'var(--red)'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--border)" strokeWidth={8}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{score}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ 100</span>
      </div>
    </div>
  )
}

// ── Sub Score Bar ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SubScore({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  const color = value >= 70 ? 'var(--green)' : value >= 40 ? '#F59E0B' : 'var(--red)'
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} style={{ color: 'var(--text-muted)' }} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${value}%`, background: color }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Severity Icon ──
function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'critical': return <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
    case 'warning': return <AlertCircle size={18} style={{ color: '#F59E0B' }} />
    case 'positive': return <CheckCircle size={18} style={{ color: 'var(--green)' }} />
    default: return <Info size={18} style={{ color: '#3B82F6' }} />
  }
}

function severityBorder(severity: string): string {
  switch (severity) {
    case 'critical': return 'border-l-[3px]'
    case 'warning': return 'border-l-[3px]'
    case 'positive': return 'border-l-[3px]'
    default: return 'border-l-[3px]'
  }
}

function severityBorderColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'var(--red)'
    case 'warning': return '#F59E0B'
    case 'positive': return 'var(--green)'
    default: return '#3B82F6'
  }
}

// ── Heatmap ──
function TimeHeatmap({ data }: { data: TimeHeatmapCell[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const hours = Array.from({ length: 13 }, (_, i) => i + 6) // 6AM - 6PM

  const cellMap = new Map<string, TimeHeatmapCell>()
  let maxAbsPnl = 1
  for (const c of data) {
    cellMap.set(`${c.hour}-${c.dayOfWeek}`, c)
    if (Math.abs(c.avgPnl) > maxAbsPnl) maxAbsPnl = Math.abs(c.avgPnl)
  }

  const [tooltip, setTooltip] = useState<{ cell: TimeHeatmapCell; x: number; y: number } | null>(null)

  return (
    <div className="relative">
      <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(5, 1fr)` }}>
        {/* Header */}
        <div />
        {days.map(d => (
          <div key={d} className="text-center text-[10px] font-medium pb-1" style={{ color: 'var(--text-muted)' }}>
            {d}
          </div>
        ))}
        {/* Rows */}
        {hours.map(hour => (
          <div key={hour} className="contents">
            <div className="text-right pr-2 text-[10px] flex items-center justify-end" style={{ color: 'var(--text-muted)' }}>
              {hour % 12 || 12}{hour >= 12 ? 'p' : 'a'}
            </div>
            {[1, 2, 3, 4, 5].map(dow => {
              const cell = cellMap.get(`${hour}-${dow}`)
              const intensity = cell ? Math.min(Math.abs(cell.avgPnl) / maxAbsPnl, 1) : 0
              const isProfit = cell ? cell.avgPnl >= 0 : true
              const bg = cell
                ? isProfit
                  ? `rgba(74, 222, 128, ${0.1 + intensity * 0.6})`
                  : `rgba(255, 69, 58, ${0.1 + intensity * 0.6})`
                : 'var(--border)'

              return (
                <div
                  key={dow}
                  className="aspect-square rounded-md cursor-pointer transition-transform hover:scale-110 relative"
                  style={{ background: bg, minHeight: 24 }}
                  onMouseEnter={(e) => {
                    if (cell) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({ cell, x: rect.left, y: rect.top })
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </div>
        ))}
      </div>
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg text-xs pointer-events-none"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            left: tooltip.x + 30,
            top: tooltip.y - 10,
          }}
        >
          <div className="font-bold">${tooltip.cell.avgPnl.toFixed(2)} avg</div>
          <div style={{ color: 'var(--text-muted)' }}>{tooltip.cell.count} trades, ${tooltip.cell.pnl.toFixed(2)} total</div>
        </div>
      )}
    </div>
  )
}

// ── What-If Card ──
function WhatIfCard({ scenario }: { scenario: WhatIfScenario }) {
  return (
    <div className={`${GLASS} p-4 border-l-[3px]`} style={{ borderLeftColor: 'var(--red)' }}>
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{scenario.label}</h4>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ color: 'var(--red)', background: 'rgba(255, 69, 58, 0.12)' }}
        >
          -${scenario.difference.toFixed(0)}
        </span>
      </div>
      <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{scenario.description}</p>
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Without this:</span>
          <span className="font-bold" style={{ color: 'var(--green)' }}>
            ${scenario.whatIfPnl.toFixed(0)}
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)' }}>vs</span>
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--text-muted)' }}>Actual:</span>
          <span className="font-bold" style={{ color: scenario.actualPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
            ${scenario.actualPnl.toFixed(0)}
          </span>
        </div>
      </div>
      <div className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
        {scenario.tradesAffected} trades responsible
      </div>
    </div>
  )
}

// ── Insight Card ──
function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div
      className={`${GLASS} p-4 ${severityBorder(insight.severity)}`}
      style={{ borderLeftColor: severityBorderColor(insight.severity) }}
    >
      <div className="flex items-start gap-3">
        <SeverityIcon severity={insight.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {insight.title}
            </h4>
            {insight.impact !== undefined && (
              <span
                className="text-xs font-bold ml-2 shrink-0"
                style={{ color: insight.impact >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {insight.impact >= 0 ? '+' : ''}${insight.impact.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {insight.description}
          </p>
          {insight.suggestion && (
            <p className="text-xs mt-2 italic" style={{ color: 'var(--text-secondary)' }}>
              {insight.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Behavior Stat ──
function BehaviorStat({ label, value, max, severity }: { label: string; value: number; max: number; severity: 'good' | 'warn' | 'bad' }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = severity === 'good' ? 'var(--green)' : severity === 'warn' ? '#F59E0B' : 'var(--red)'
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Empty State ──
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Brain size={48} style={{ color: 'var(--text-muted)' }} className="mb-4" />
      <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Insights Yet</h2>
      <p className="text-sm text-center max-w-md" style={{ color: 'var(--text-muted)' }}>
        Start logging trades to unlock AI-powered insights about your trading behavior, timing patterns, and risk management.
      </p>
    </div>
  )
}

// ── Error Boundary ──
import { Component, type ReactNode, type ErrorInfo } from 'react'
class InsightsErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Insights error:', error, info) }
  render() {
    if (this.state.error) return (
      <div className="flex flex-col items-center justify-center py-20">
        <Brain size={48} style={{ color: 'var(--text-muted)' }} className="mb-4" />
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h2>
        <p className="text-sm text-center max-w-md mb-4" style={{ color: 'var(--text-muted)' }}>
          {this.state.error.message}
        </p>
        <button onClick={() => this.setState({ error: null })} className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--green)', color: '#fff' }}>Try Again</button>
      </div>
    )
    return this.props.children
  }
}

// ── Main Page ──
function InsightsPageInner() {
  const { trades, loaded } = useTrades()
  const { selectedId } = useAccountFilter()
  const [notes, setNotes] = useState<DailyNote[]>([])

  useEffect(() => {
    try {
      dl.getNotes().then(n => setNotes(n || [])).catch(() => setNotes([]))
    } catch {
      setNotes([])
    }
  }, [])

  const filteredTrades = useMemo(() => {
    if (!selectedId) return trades
    return trades.filter(t => t.accountId === selectedId)
  }, [trades, selectedId])

  const result: InsightsResult | null = useMemo(() => {
    if (!loaded) return null
    return generateInsights(filteredTrades, notes)
  }, [filteredTrades, notes, loaded])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--green)' }} />
      </div>
    )
  }

  if (!result || filteredTrades.filter(t => t.status === 'closed').length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'var(--border)' }}>
              <Brain size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Insights</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Trading intelligence & behavior analysis</p>
            </div>
          </div>
          <AccountSelector />
        </div>
        <EmptyState />
      </div>
    )
  }

  const { score, insights, whatIfs, heatmap, instruments, behaviorData } = result
  const topInsights = insights.slice(0, 5)

  // What-if chart data
  const whatIfChartData = whatIfs.map(s => ({
    name: s.label.length > 20 ? s.label.slice(0, 18) + '...' : s.label,
    difference: s.difference,
    helps: s.difference > 0,
  }))

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'var(--border)' }}>
            <Brain size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Insights</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Trading intelligence & behavior analysis</p>
          </div>
        </div>
        <AccountSelector />
      </div>

      {/* A. Trading Score */}
      <div className={`${GLASS} p-6`}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <ScoreCircle score={score.overall} />
            <div className="flex items-center gap-1.5 mt-1">
              {score.trend > 0 ? (
                <TrendingUp size={14} style={{ color: 'var(--green)' }} />
              ) : score.trend < 0 ? (
                <TrendingDown size={14} style={{ color: 'var(--red)' }} />
              ) : null}
              <span className="text-xs font-medium" style={{ color: score.trend >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {score.trend > 0 ? 'Improving' : score.trend < 0 ? 'Declining' : 'Stable'}
              </span>
            </div>
          </div>
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SubScore label="Consistency" value={score.consistency} icon={Target} />
            <SubScore label="Discipline" value={score.discipline} icon={Shield} />
            <SubScore label="Risk Management" value={score.riskManagement} icon={Activity} />
            <SubScore label="Edge" value={score.edge} icon={Zap} />
            <SubScore label="Journaling" value={score.journaling} icon={BookOpen} />
          </div>
        </div>
      </div>

      {/* B. Key Insights */}
      {topInsights.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--border)' }}>
              <AlertCircle size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Key Insights</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {topInsights.map(ins => (
              <InsightCard key={ins.id} insight={ins} />
            ))}
          </div>
        </div>
      )}

      {/* C & D. Heatmap + What-If */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Heatmap */}
        <div className={`${GLASS} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--border)' }}>
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Time Performance</h2>
          </div>
          {heatmap.length > 0 ? (
            <TimeHeatmap data={heatmap} />
          ) : (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
              Add entry times to your trades to see time-based patterns.
            </p>
          )}
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(255, 69, 58, 0.5)' }} />
              Loss
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: 'var(--border)' }} />
              None
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(74, 222, 128, 0.5)' }} />
              Profit
            </div>
          </div>
        </div>

        {/* What-If Scenarios */}
        <div className={`${GLASS} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--border)' }}>
              <BarChart3 size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>What-If Scenarios</h2>
          </div>
          {whatIfs.length > 0 ? (
            <div className="space-y-3">
              {whatIfs.slice(0, 4).map(s => (
                <WhatIfCard key={s.id} scenario={s} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
              Need more trades to generate what-if scenarios.
            </p>
          )}
        </div>
      </div>

      {/* What-If Chart */}
      {whatIfChartData.length > 0 && (
        <div className={`${GLASS} p-5`}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Scenario Impact Comparison</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={whatIfChartData} layout="vertical">
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={TT_STYLE} // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Impact']} />
              <ReferenceLine x={0} stroke="var(--border)" />
              <Bar dataKey="difference" radius={[0, 4, 4, 0]}>
                {whatIfChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.difference >= 0 ? 'rgba(74, 222, 128, 0.7)' : 'rgba(255, 69, 58, 0.7)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* E & F. Behavior + Instruments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behavior Patterns */}
        <div className={`${GLASS} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--border)' }}>
              <Flame size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Behavior Patterns</h2>
          </div>
          <BehaviorStat
            label="Revenge Trades"
            value={behaviorData.revengeTradeCount}
            max={10}
            severity={behaviorData.revengeTradeCount === 0 ? 'good' : behaviorData.revengeTradeCount <= 3 ? 'warn' : 'bad'}
          />
          <BehaviorStat
            label="Overtrade Days"
            value={behaviorData.overtradeDays}
            max={5}
            severity={behaviorData.overtradeDays === 0 ? 'good' : behaviorData.overtradeDays <= 2 ? 'warn' : 'bad'}
          />
          <BehaviorStat
            label="Tilt Events"
            value={behaviorData.tiltEvents}
            max={5}
            severity={behaviorData.tiltEvents === 0 ? 'good' : behaviorData.tiltEvents <= 1 ? 'warn' : 'bad'}
          />
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Avg Trades/Day</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {behaviorData.avgTradesPerDay.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Instrument Edge */}
        <div className={`${GLASS} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--border)' }}>
              <BarChart3 size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Instrument Edge</h2>
          </div>
          {instruments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: 'var(--text-muted)' }}>
                    <th className="text-left pb-2 font-medium">Symbol</th>
                    <th className="text-right pb-2 font-medium">Trades</th>
                    <th className="text-right pb-2 font-medium">Win%</th>
                    <th className="text-right pb-2 font-medium">P&L</th>
                    <th className="text-right pb-2 font-medium">Avg</th>
                    <th className="text-center pb-2 font-medium">Edge</th>
                  </tr>
                </thead>
                <tbody>
                  {instruments.map(inst => (
                    <tr key={inst.symbol} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{inst.symbol}</td>
                      <td className="text-right py-2" style={{ color: 'var(--text-secondary)' }}>{inst.count}</td>
                      <td className="text-right py-2" style={{ color: 'var(--text-secondary)' }}>
                        {(inst.winRate * 100).toFixed(0)}%
                      </td>
                      <td className="text-right py-2 font-medium" style={{ color: inst.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        ${inst.pnl.toFixed(2)}
                      </td>
                      <td className="text-right py-2" style={{ color: inst.avgPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        ${inst.avgPnl.toFixed(2)}
                      </td>
                      <td className="text-center py-2">
                        {inst.isEdge ? (
                          <CheckCircle size={14} style={{ color: 'var(--green)' }} className="inline" />
                        ) : (
                          <AlertCircle size={14} style={{ color: 'var(--text-muted)' }} className="inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No instrument data available yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InsightsPage() {
  return (
    <InsightsErrorBoundary>
      <InsightsPageInner />
    </InsightsErrorBoundary>
  )
}
