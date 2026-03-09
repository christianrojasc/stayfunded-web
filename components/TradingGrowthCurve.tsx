'use client'

import { useMemo, useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Target, Info, Clock, CircleDot,
  DollarSign, Activity,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useTrades } from '@/components/TradeContext'
import { useAccountFilter } from '@/components/AccountFilterContext'
import { getSessionInfo } from '@/lib/session'
import { DrawdownType } from '@/lib/types'

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtDollar(val: number, compact = false): string {
  if (compact) {
    const abs = Math.abs(val)
    if (abs >= 1000) return `$${(abs / 1000).toFixed(1)}K`
    return `$${abs.toFixed(0)}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(val)
}

function fmtPct(val: number, decimals = 1): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(decimals)}%`
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Equity data builder ──────────────────────────────────────────────────────

interface EquityPoint {
  date: string
  label: string
  balance: number
  drawdownFloor: number
  profitTarget: number | null
  highWaterMark: number
}

function buildEquityCurve(
  tradesByDate: Record<string, number>, // sessionDate → daily netPnl
  startingBalance: number,
  maxLossLimit: number,
  profitTarget: number | null,
  drawdownType: DrawdownType,
): EquityPoint[] {
  const dates = Object.keys(tradesByDate).sort()
  if (!dates.length) return []

  let cumPnl = 0
  let highWaterMark = startingBalance

  const points: EquityPoint[] = []

  // Add starting point (day before first trade)
  const firstDate = dates[0]
  let prevDate: string
  try {
    const d = parseISO(firstDate)
    d.setDate(d.getDate() - 1)
    prevDate = format(d, 'yyyy-MM-dd')
  } catch {
    prevDate = firstDate
  }

  const isTrailing = drawdownType === 'trailing'

  // Starting equity point
  const initialFloor = isTrailing
    ? startingBalance - maxLossLimit
    : startingBalance - maxLossLimit
  points.push({
    date: prevDate,
    label: fmtDateLabel(prevDate),
    balance: startingBalance,
    drawdownFloor: initialFloor,
    profitTarget: profitTarget ? startingBalance + profitTarget : null,
    highWaterMark: startingBalance,
  })

  for (const date of dates) {
    cumPnl += tradesByDate[date]
    const balance = startingBalance + cumPnl

    if (isTrailing) {
      if (balance > highWaterMark) highWaterMark = balance
    } else {
      highWaterMark = Math.max(highWaterMark, balance)
    }

    // Trailing floor caps at startingBalance + 100 (locks at break-even)
    const trailingLock = startingBalance + 100
    const rawFloor = isTrailing
      ? highWaterMark - maxLossLimit
      : startingBalance - maxLossLimit
    const floor = isTrailing && rawFloor >= trailingLock ? trailingLock : rawFloor

    points.push({
      date,
      label: fmtDateLabel(date),
      balance,
      drawdownFloor: floor,
      profitTarget: profitTarget ? startingBalance + profitTarget : null,
      highWaterMark,
    })
  }

  return points
}

function fmtDateLabel(date: string): string {
  try {
    return format(parseISO(date), 'MMM d')
  } catch {
    return date
  }
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const balance = payload.find((p: any) => p.dataKey === 'balance')?.value
  const floor = payload.find((p: any) => p.dataKey === 'drawdownFloor')?.value
  const target = payload.find((p: any) => p.dataKey === 'profitTarget')?.value

  return (
    <div className="bg-[var(--bg-primary)] border border-[#30363d] rounded-xl shadow-2xl p-3 text-xs min-w-[180px]">
      <p className="text-[var(--text-muted)] mb-2 font-semibold text-[11px] uppercase tracking-wide">{label}</p>
      {balance !== undefined && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-[var(--text-muted)] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] inline-block" />
            Balance
          </span>
          <span className="font-mono font-bold text-[var(--text-primary)]">{fmtDollar(balance)}</span>
        </div>
      )}
      {target !== undefined && target !== null && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-[var(--text-muted)] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Profit Target
          </span>
          <span className="font-mono font-bold text-green-400">{fmtDollar(target)}</span>
        </div>
      )}
      {floor !== undefined && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--text-muted)] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            Min Balance
          </span>
          <span className="font-mono font-bold text-red-400">{fmtDollar(floor)}</span>
        </div>
      )}
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string
  value: string
  subValue?: string
  change?: number | null
  icon: React.ReactNode
  iconBg?: string
  valueColor?: string
}

function MiniKPICard({ label, value, subValue, change, icon, iconBg = 'bg-[var(--bg-card)]', valueColor }: KPICardProps) {
  const pctColor = change !== undefined && change !== null
    ? change >= 0 ? 'text-green-400' : 'text-red-400'
    : 'text-[var(--text-muted)]'

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-primary)]/60 border border-[var(--border)] hover:border-[#30363d] transition-colors flex-1">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] truncate">{label}</p>
        <p className={`text-sm font-bold leading-tight mt-0.5 ${valueColor || 'text-[var(--text-primary)]'}`}>{value}</p>
        {(subValue || change !== null) && (
          <p className={`text-[10px] mt-0.5 ${change !== null && change !== undefined ? pctColor : 'text-[var(--text-muted)]'}`}>
            {subValue}
            {change !== null && change !== undefined && ` (${fmtPct(change)})`}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TradingGrowthCurve() {
  const { selected, accounts: propAccounts } = useAccountFilter()
  const { trades, loaded } = useTrades()
  const [now, setNow] = useState(() => new Date())

  // Update clock every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const sessionInfo = useMemo(() => getSessionInfo(now), [now])

  // Filter trades for the selected account (or all accounts)
  const accountTrades = useMemo(() => {
    if (selected) return trades.filter(t => t.accountId === selected.id && t.status === 'closed')
    // All Accounts — aggregate all closed trades
    return trades.filter(t => t.status === 'closed')
  }, [trades, selected, propAccounts])

  // Group by session date → daily netPnl
  const tradesByDate = useMemo(() => {
    const map: Record<string, number> = {}
    accountTrades.forEach(t => {
      const key = t.sessionDate || t.date
      map[key] = (map[key] || 0) + t.netPnl
    })
    return map
  }, [accountTrades])

  // Aggregate starting balance across all prop accounts (for All Accounts view)
  const aggregatedStartingBalance = useMemo(() => {
    if (selected) return selected.startingBalance
    return propAccounts.reduce((sum, a) => sum + (a.startingBalance || 0), 0) || 100000
  }, [selected, propAccounts])

  // Build equity curve
  const equityPoints = useMemo(() => {
    if (!Object.keys(tradesByDate).length) return []
    return buildEquityCurve(
      tradesByDate,
      aggregatedStartingBalance,
      selected?.maxLossLimit ?? 0,
      selected?.profitTarget ?? null,
      selected?.drawdownType ?? 'static_eod',
    )
  }, [selected, tradesByDate, aggregatedStartingBalance])

  // Calculations for KPI cards
  const kpiData = useMemo(() => {
    if (!equityPoints.length) return null

    const last = equityPoints[equityPoints.length - 1]
    const totalPnl = last.balance - aggregatedStartingBalance
    const totalPnlPct = (totalPnl / aggregatedStartingBalance) * 100

    // Current equity
    const currentEquity = last.balance
    const equityChangePct = ((currentEquity - aggregatedStartingBalance) / aggregatedStartingBalance) * 100

    // Max drawdown floor reached (lowest floor across all points)
    const lowestFloor = Math.min(...equityPoints.map(p => p.drawdownFloor))
    // Worst floor pct from starting balance
    const floorPct = ((lowestFloor - aggregatedStartingBalance) / aggregatedStartingBalance) * 100

    // Actual max drawdown: peak equity - lowest balance after peak
    let peakBalance = aggregatedStartingBalance
    let maxDrawdownAmount = 0
    for (const p of equityPoints) {
      if (p.balance > peakBalance) peakBalance = p.balance
      const dd = peakBalance - p.balance
      if (dd > maxDrawdownAmount) maxDrawdownAmount = dd
    }
    const maxDrawdownPct = peakBalance > 0 ? (maxDrawdownAmount / peakBalance) * 100 : 0

    // Profit target remaining
    const profitTargetRemaining = selected?.profitTarget
      ? Math.max(0, (selected?.profitTarget ?? 0) - Math.max(0, totalPnl))
      : null
    const profitTargetPct = selected?.profitTarget && selected.profitTarget > 0
      ? (Math.max(0, totalPnl) / selected.profitTarget) * 100
      : null

    return {
      totalPnl,
      totalPnlPct,
      currentEquity,
      equityChangePct,
      lowestFloor,
      floorPct,
      maxDrawdownAmount,
      maxDrawdownPct,
      profitTargetRemaining,
      profitTargetPct,
      isFunded: selected?.status === 'funded',
    }
  }, [selected, equityPoints])

  // Date range label
  const dateRange = useMemo(() => {
    const dates = Object.keys(tradesByDate).sort()
    if (!dates.length) return null
    const first = fmtDateLabel(dates[0])
    const last = fmtDateLabel(format(now, 'yyyy-MM-dd'))
    return `${first} – ${last}`
  }, [tradesByDate, now])

  // Y-axis domain
  const yDomain = useMemo(() => {
    if (!equityPoints.length) return ['auto', 'auto']
    const allValues = equityPoints.flatMap(p => [
      p.balance,
      p.drawdownFloor,
      ...(p.profitTarget ? [p.profitTarget] : []),
    ])
    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const padding = (max - min) * 0.08
    return [Math.floor(min - padding), Math.ceil(max + padding)]
  }, [equityPoints])

  // ── Empty state ──
  if (!loaded) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!equityPoints.length) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 text-center min-h-[280px]">
        <div className="w-12 h-12 rounded-full bg-amber-400/10 flex items-center justify-center">
          <TrendingUp size={22} className="text-amber-400" />
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] text-sm">No Trades Yet</p>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            Add trades for <span className="text-amber-400 font-semibold">{selected?.nickname || selected?.firmName || 'this account'}</span> to see your equity curve
          </p>
        </div>
      </div>
    )
  }

  const isEval = selected?.status === 'evaluation'
  const profitTargetLevel = isEval && selected?.profitTarget
    ? (selected?.startingBalance ?? 0) + (selected?.profitTarget ?? 0)
    : null
  const drawdownFloorLevel = equityPoints[equityPoints.length - 1].drawdownFloor

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)] flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="section-title text-[var(--text-primary)]">Trading Growth Curve</h2>
            <span title="Equity curve showing your account balance over time with drawdown and target levels">
              <Info size={13} className="text-[var(--text-muted)] cursor-help" />
            </span>
          </div>
          {dateRange && (
            <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-0.5 rounded-full">
              {dateRange}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isEval
              ? 'bg-amber-400/10 text-amber-400'
              : 'bg-green-400/10 text-green-400'
          }`}>
            {isEval ? 'Evaluation' : 'Funded'}
          </span>
        </div>

        {/* Session countdown */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <Clock size={12} className={
            sessionInfo.status === 'closing_soon' ? 'text-red-400 animate-pulse' :
            sessionInfo.status === 'closed' ? 'text-[var(--text-muted)]' : 'text-amber-400'
          } />
          <span className="text-[var(--text-muted)] font-sans text-[11px]">Session Ends In</span>
          <span className={`font-bold text-sm tabular-nums ${
            sessionInfo.status === 'closing_soon' ? 'text-red-400' :
            sessionInfo.status === 'closed' ? 'text-[var(--text-muted)]' : 'text-amber-400'
          }`}>
            {sessionInfo.status === 'closed'
              ? 'Closed'
              : formatCountdown(sessionInfo.remainingMs)}
          </span>
        </div>
      </div>

      {/* Body: chart + KPIs */}
      <div className="flex flex-col lg:flex-row">
        {/* Chart (left, 80%) */}
        <div className="flex-1 lg:w-[80%] p-5 min-h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={equityPoints} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                {/* Dynamic gradient: green when profitable, red when in loss */}
                <linearGradient id="tgcBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={kpiData && kpiData.totalPnl >= 0 ? '#4ADE80' : '#EF4444'} stopOpacity={0.28} />
                  <stop offset="60%" stopColor={kpiData && kpiData.totalPnl >= 0 ? '#4ADE80' : '#EF4444'} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={kpiData && kpiData.totalPnl >= 0 ? '#4ADE80' : '#EF4444'} stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#21262d"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fill: '#8b949e', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={yDomain as [number, number]}
                tick={{ fill: '#8b949e', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => {
                  const abs = Math.abs(v)
                  if (abs >= 1000) return `$${(v / 1000).toFixed(0)}K`
                  return `$${v}`
                }}
                width={58}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Profit Target line (eval only) */}
              {profitTargetLevel !== null && (
                <ReferenceLine
                  y={profitTargetLevel}
                  stroke="#4ADE50"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  label={{
                    value: `Target ${fmtDollar(profitTargetLevel, true)}`,
                    position: 'insideTopRight',
                    fill: '#4ADE50',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}

              {/* Drawdown floor line */}
              <ReferenceLine
                y={drawdownFloorLevel}
                stroke="#EF4444"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                label={{
                  value: `Floor ${fmtDollar(drawdownFloorLevel, true)}`,
                  position: 'insideBottomRight',
                  fill: '#EF4444',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />

              {/* Balance area (green when profitable, red when in loss) */}
              <Area
                type="monotone"
                dataKey="balance"
                stroke={kpiData && kpiData.totalPnl >= 0 ? '#4ADE80' : '#EF4444'}
                strokeWidth={2.5}
                fill="url(#tgcBalanceGrad)"
                dot={false}
                activeDot={{ r: 5, fill: kpiData && kpiData.totalPnl >= 0 ? '#4ADE80' : '#EF4444', stroke: '#0d1117', strokeWidth: 2 }}
              />

              {/* Hidden areas for tooltip data */}
              <Area
                type="monotone"
                dataKey="drawdownFloor"
                stroke="transparent"
                fill="transparent"
                dot={false}
              />
              {isEval && (
                <Area
                  type="monotone"
                  dataKey="profitTarget"
                  stroke="transparent"
                  fill="transparent"
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-1 pl-14 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <span className={`w-8 h-0.5 rounded inline-block ${kpiData && kpiData.totalPnl >= 0 ? 'bg-[#4ADE80]' : 'bg-[#EF4444]'}`} />
              Balance
            </span>
            {profitTargetLevel && (
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <span className="w-8 border-t-2 border-dashed border-green-400 inline-block" />
                Profit Target
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <span className="w-8 border-t-2 border-dashed border-red-400 inline-block" />
              Min Balance ({selected?.drawdownType === 'trailing' ? 'Trailing' : 'Static'})
            </span>
          </div>
        </div>

        {/* KPI Cards (right, 20%) */}
        {kpiData && (
          <div className="lg:w-[20%] lg:min-w-[200px] flex flex-row lg:flex-col gap-3 p-4 lg:pl-0 lg:border-l border-[var(--border)] overflow-x-auto lg:overflow-visible">
            {/* 1. NET P&L */}
            <MiniKPICard
              label="Net Profit Loss"
              value={`${kpiData.totalPnl >= 0 ? '+' : ''}${fmtDollar(kpiData.totalPnl)}`}
              change={kpiData.totalPnlPct}
              subValue={`${fmtPct(kpiData.totalPnlPct)} from start`}
              icon={
                kpiData.totalPnl >= 0
                  ? <TrendingUp size={16} className="text-green-400" />
                  : <TrendingDown size={16} className="text-red-400" />
              }
              iconBg={kpiData.totalPnl >= 0 ? 'bg-green-400/10' : 'bg-red-400/10'}
              valueColor={kpiData.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
            />

            {/* 2. PROFIT TARGET (eval) or ACCOUNT STATUS (funded) */}
            {kpiData.isFunded ? (
              <MiniKPICard
                label="Account Status"
                value={kpiData.totalPnl >= 0
                  ? `Up ${fmtDollar(kpiData.totalPnl)}`
                  : `Down ${fmtDollar(Math.abs(kpiData.totalPnl))}`
                }
                subValue={`${fmtPct(kpiData.totalPnlPct)} overall`}
                icon={<DollarSign size={16} className={kpiData.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'} />}
                iconBg={kpiData.totalPnl >= 0 ? 'bg-green-400/10' : 'bg-red-400/10'}
                valueColor={kpiData.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
              />
            ) : (
              <MiniKPICard
                label="Profit Target"
                value={kpiData.profitTargetRemaining !== null && selected?.profitTarget
                  ? kpiData.profitTargetRemaining <= 0
                    ? '✓ Reached!'
                    : `${fmtDollar(kpiData.profitTargetRemaining)} left`
                  : 'N/A'
                }
                subValue={kpiData.profitTargetPct !== null
                  ? `${kpiData.profitTargetPct.toFixed(0)}% of ${fmtDollar(selected?.profitTarget || 0)}`
                  : 'No target set'
                }
                icon={<Target size={16} className="text-green-400" />}
                iconBg="bg-green-400/10"
                valueColor={
                  kpiData.profitTargetPct !== null && kpiData.profitTargetPct >= 100
                    ? 'text-green-400'
                    : 'text-[var(--text-primary)]'
                }
              />
            )}

            {/* 3. CURRENT EQUITY */}
            <MiniKPICard
              label="Current Equity"
              value={fmtDollar(kpiData.currentEquity)}
              change={kpiData.equityChangePct}
              subValue={`${fmtPct(kpiData.equityChangePct)} from ${fmtDollar(selected?.startingBalance ?? aggregatedStartingBalance, true)}`}
              icon={<Activity size={16} className={kpiData.totalPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#EF4444]'} />}
              iconBg={kpiData.totalPnl >= 0 ? 'bg-[#4ADE80]/10' : 'bg-[#EF4444]/10'}
            />

            {/* 4. MAX DRAWDOWN */}
            <MiniKPICard
              label="Max Drawdown"
              value={kpiData.maxDrawdownAmount > 0 ? `-${fmtDollar(kpiData.maxDrawdownAmount)}` : '$0'}
              subValue={kpiData.maxDrawdownAmount > 0 ? `${kpiData.maxDrawdownPct.toFixed(1)}% from peak · Floor: ${fmtDollar(kpiData.lowestFloor)}` : 'No drawdown yet'}
              change={null}
              icon={<CircleDot size={16} className="text-blue-400" />}
              iconBg="bg-blue-400/10"
              valueColor={kpiData.maxDrawdownAmount > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
