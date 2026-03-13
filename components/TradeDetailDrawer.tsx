'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { X, StickyNote, TrendingUp, TrendingDown, LineChart, BarChart3, Check } from 'lucide-react'
import { Trade } from '@/lib/types'
import { formatAccountNumber } from '@/lib/utils'
import { formatPnl } from '@/lib/calculations'
import { getSetups } from '@/lib/storage'
import { useTrades } from '@/components/TradeContext'
import { useAccountFilter } from '@/components/AccountFilterContext'
import dynamic from 'next/dynamic'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import ProGate from '@/components/ProGate'

const TradeCandleChart = dynamic(() => import('@/components/TradeCandleChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-xs">
      Loading chart...
    </div>
  ),
})

const CONTRACT_SPECS: Record<string, { multiplier: number; tickSize: number }> = {
  ES: { multiplier: 50, tickSize: 0.25 }, MES: { multiplier: 5, tickSize: 0.25 },
  NQ: { multiplier: 20, tickSize: 0.25 }, MNQ: { multiplier: 2, tickSize: 0.25 },
  YM: { multiplier: 5, tickSize: 1 }, MYM: { multiplier: 0.5, tickSize: 1 },
  RTY: { multiplier: 50, tickSize: 0.1 }, M2K: { multiplier: 5, tickSize: 0.1 },
  CL: { multiplier: 1000, tickSize: 0.01 }, MCL: { multiplier: 100, tickSize: 0.01 },
  GC: { multiplier: 100, tickSize: 0.1 }, MGC: { multiplier: 10, tickSize: 0.1 },
}

interface Props {
  trade: Trade
  onClose: () => void
}

export default function TradeDetailDrawer({ trade, onClose }: Props) {
  const { updateTrade } = useTrades()
  const { accounts } = useAccountFilter()
  const [notes, setNotes] = useState(trade.notes || '')
  const [setup, setSetup] = useState(trade.setup || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'chart' | 'pnl'>('chart')
  const savedSetups = useMemo(() => getSetups(), [])
  const [visible, setVisible] = useState(false)
  const notesRef = useRef(notes)
  notesRef.current = notes

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 300)
  }, [onClose])

  const saveNotes = useCallback(async () => {
    if (notesRef.current === (trade.notes || '')) return
    setSaving(true)
    await updateTrade(trade.id, { notes: notesRef.current })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [trade.id, trade.notes, updateTrade])

  const spec = CONTRACT_SPECS[trade.symbol] || { multiplier: 20, tickSize: 0.25 }
  const points = trade.side === 'Long'
    ? trade.exitPrice - trade.entryPrice
    : trade.entryPrice - trade.exitPrice
  const ticks = points / spec.tickSize
  const grossPnl = trade.pnl
  const netRoi = trade.entryPrice > 0
    ? (trade.netPnl / (trade.entryPrice * trade.contracts * spec.multiplier)) * 100
    : 0

  const acct = accounts.find(a => a.id === trade.accountId)
  const isWin = trade.netPnl >= 0

  // Duration
  let duration = ''
  if (trade.entryTime && trade.exitTime) {
    const entry = new Date(`${trade.date}T${trade.entryTime}`)
    const exit = new Date(`${trade.date}T${trade.exitTime}`)
    const diffMs = exit.getTime() - entry.getTime()
    if (diffMs > 0) {
      const mins = Math.floor(diffMs / 60000)
      const hrs = Math.floor(mins / 60)
      const remMins = mins % 60
      duration = hrs > 0 ? `${hrs}h ${remMins}m` : `${mins}m`
    }
  }

  // Fetch real 1m candle data for running P&L
  const [runningPnlData, setRunningPnlData] = useState<{ time: string; pnl: number }[]>([])
  const [pnlLoading, setPnlLoading] = useState(true)

  useEffect(() => {
    if (tab !== 'pnl') return
    let cancelled = false

    async function fetchRunningPnl() {
      setPnlLoading(true)
      const fallback = [
        { time: 'Entry', pnl: 0 },
        { time: 'Exit', pnl: trade.pnl },
      ]

      try {
        const symbol = trade.symbol.replace(/[A-Z]\d{2}$/, '').replace(/\d+$/, '')
        const yahooMap: Record<string, string> = {
          ES: 'ES=F', MES: 'MES=F', NQ: 'NQ=F', MNQ: 'MNQ=F',
          YM: 'YM=F', MYM: 'MYM=F', RTY: 'RTY=F', M2K: 'M2K=F',
          CL: 'CL=F', MCL: 'MCL=F', GC: 'GC=F', MGC: 'MGC=F',
        }
        const yahooSymbol = yahooMap[symbol] || `${symbol}=F`

        // Fetch a wide window around the trade date — we'll find entry/exit by PRICE, not time
        // Try multiple offsets to get the right candles
        const offsets = ['-05:00', '-06:00', '-04:00', '+00:00']
        const intervals = ['1m', '2m', '5m', '15m']
        const baseTime = trade.entryTime || '12:00'
        let bestResult: { timestamps: number[]; quotes: any } | null = null

        // Try each interval (1m has 7-day limit, 2m/5m/15m go further back)
        for (const iv of intervals) {
          if (bestResult) break
          const pad = iv === '1m' ? 7200 : iv === '2m' ? 10800 : iv === '5m' ? 14400 : 21600
          for (const offset of offsets) {
            const anchor = new Date(`${trade.date}T${baseTime}${offset}`)
            if (isNaN(anchor.getTime())) continue
            const anchorTs = Math.floor(anchor.getTime() / 1000)
            const res = await fetch(`/api/candles?symbol=${encodeURIComponent(yahooSymbol)}&interval=${iv}&from=${anchorTs - pad}&to=${anchorTs + pad}`)
            const data = await res.json()
            const result = data?.chart?.result?.[0]
            if (result?.timestamp?.length > 0) {
              const timestamps = result.timestamp as number[]
              const quotes = result.indicators?.quote?.[0]
              for (let i = 0; i < timestamps.length; i++) {
                const h = quotes?.high?.[i]
                const l = quotes?.low?.[i]
                if (h != null && l != null && trade.entryPrice >= l && trade.entryPrice <= h) {
                  bestResult = { timestamps, quotes }
                  break
                }
              }
              if (bestResult) break
            }
          }
        }

        if (cancelled) return

        if (!bestResult) {
          setRunningPnlData(fallback)
          setPnlLoading(false)
          return
        }

        const { timestamps, quotes } = bestResult

        // Parse entry/exit times to narrow search window
        const parseHHMM = (t: string | undefined): number | null => {
          if (!t) return null
          const parts = t.split(':')
          if (parts.length < 2) return null
          return parseInt(parts[0]) * 60 + parseInt(parts[1])
        }
        const entryMinutes = parseHHMM(trade.entryTime)
        const exitMinutes = parseHHMM(trade.exitTime)

        // Find entry candle: use time + price match
        let entryIdx = -1
        for (let i = 0; i < timestamps.length; i++) {
          const h = quotes?.high?.[i]; const l = quotes?.low?.[i]
          if (h == null || l == null) continue
          // Check if candle time is close to entry time
          if (entryMinutes !== null) {
            const d = new Date(timestamps[i] * 1000)
            const candleMin = d.getHours() * 60 + d.getMinutes()
            // Allow 5 min tolerance for time match
            if (Math.abs(candleMin - entryMinutes) > 5 && Math.abs(candleMin - entryMinutes + 1440) > 5 && Math.abs(candleMin - entryMinutes - 1440) > 5) continue
          }
          if (trade.entryPrice >= l && trade.entryPrice <= h) {
            entryIdx = i
            break
          }
        }

        // If time-based search failed, fall back to price-only
        if (entryIdx === -1) {
          for (let i = 0; i < timestamps.length; i++) {
            const h = quotes?.high?.[i]; const l = quotes?.low?.[i]
            if (h != null && l != null && trade.entryPrice >= l && trade.entryPrice <= h) {
              entryIdx = i
              break
            }
          }
        }

        // Find exit candle: use time + price match (search forward from entry)
        let exitIdx = -1
        if (exitMinutes !== null && entryIdx >= 0) {
          for (let i = entryIdx; i < timestamps.length; i++) {
            const h = quotes?.high?.[i]; const l = quotes?.low?.[i]
            if (h == null || l == null) continue
            const d = new Date(timestamps[i] * 1000)
            const candleMin = d.getHours() * 60 + d.getMinutes()
            if (Math.abs(candleMin - exitMinutes) > 5 && Math.abs(candleMin - exitMinutes + 1440) > 5 && Math.abs(candleMin - exitMinutes - 1440) > 5) continue
            if (trade.exitPrice >= l && trade.exitPrice <= h) {
              exitIdx = i
              break
            }
          }
        }

        // Fallback: search forward from entry for exit price
        if (exitIdx === -1 && entryIdx >= 0) {
          for (let i = entryIdx + 1; i < timestamps.length; i++) {
            const h = quotes?.high?.[i]; const l = quotes?.low?.[i]
            if (h != null && l != null && trade.exitPrice >= l && trade.exitPrice <= h) {
              exitIdx = i
              break
            }
          }
        }

        if (entryIdx === -1 || exitIdx === -1 || exitIdx <= entryIdx) {
          setRunningPnlData(fallback)
          setPnlLoading(false)
          return
        }

        // Build P&L curve from entry candle to exit candle
        const points: { time: string; pnl: number }[] = [{ time: 'Entry', pnl: 0 }]

        for (let i = entryIdx; i <= exitIdx; i++) {
          const close = quotes?.close?.[i]
          if (close == null) continue
          const unrealizedPnl = trade.side === 'Long'
            ? (close - trade.entryPrice) * trade.contracts * spec.multiplier
            : (trade.entryPrice - close) * trade.contracts * spec.multiplier
          // Format time from UTC epoch → local display
          const d = new Date(timestamps[i] * 1000)
          const h = d.getHours()
          const m = d.getMinutes()
          const label = `${h}:${m.toString().padStart(2, '0')}`
          points.push({ time: label, pnl: parseFloat(unrealizedPnl.toFixed(2)) })
        }

        // Add actual exit P&L as final point
        points.push({ time: 'Exit', pnl: trade.pnl })

        if (!cancelled) {
          setRunningPnlData(points.length > 2 ? points : fallback)
        }
      } catch {
        if (!cancelled) setRunningPnlData(fallback)
      }
      if (!cancelled) setPnlLoading(false)
    }

    fetchRunningPnl()
    return () => { cancelled = true }
  }, [tab, trade, spec.multiplier])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center p-4 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
      />

      {/* Floating Modal */}
      <div
        className={`fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ease-out ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="pointer-events-auto flex w-full max-w-[980px] h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}
        >
        {/* Left sidebar */}
        <div className="w-[300px] shrink-0 flex flex-col overflow-y-auto relative" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
          {/* Header */}
          <div className="p-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{trade.symbol}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                trade.side === 'Long' ? 'bg-green-500/15 text-[var(--green)]' : 'bg-red-500/15 text-[#EF4444]'
              }`}>
                {trade.side === 'Long' ? <TrendingUp className="inline w-3 h-3 mr-0.5" /> : <TrendingDown className="inline w-3 h-3 mr-0.5" />}
                {trade.side}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-1">Net P&L</p>
            <p
              className="font-bold"
              style={{ fontFamily: 'Outfit, sans-serif', fontSize: '36px', color: isWin ? '#4ADE80' : '#EF4444' }}
            >
              {formatPnl(trade.netPnl)}
            </p>
          </div>

          <div className="flex-1 p-5 space-y-0">
            <StatRow label="Gross P&L">
              <span className={grossPnl >= 0 ? 'text-[var(--green)]' : 'text-[#EF4444]'}>{formatPnl(grossPnl)}</span>
            </StatRow>
            <StatRow label="Fees" value={`$${trade.fees.toFixed(2)}`} />
            <StatRow label="Side">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                trade.side === 'Long' ? 'bg-green-500/15 text-[var(--green)]' : 'bg-red-500/15 text-[#EF4444]'
              }`}>
                {trade.side}
              </span>
            </StatRow>
            <StatRow label="Symbol">
              <span className="font-mono font-bold text-xs bg-[var(--bg-primary)] px-2 py-0.5 rounded text-[var(--text-primary)]">{trade.symbol}</span>
            </StatRow>
            {acct && (
              <StatRow label="Account">
                <span className="text-[var(--text-secondary)] font-mono text-xs">
                  {formatAccountNumber(acct.accountNumber)}
                </span>
              </StatRow>
            )}
            <StatRow label="Contracts" value={trade.contracts.toString()} />
            <StatRow label="Entry Price" value={trade.entryPrice.toFixed(2)} />
            <StatRow label="Exit Price" value={trade.exitPrice.toFixed(2)} />
            <StatRow label="Points" value={Math.abs(trade.exitPrice - trade.entryPrice).toFixed(2)} />
            <StatRow label="Ticks" value={ticks.toFixed(1)} />
            <StatRow label="Net ROI" value={`${netRoi.toFixed(2)}%`} />
            <StatRow label="Session Date" value={trade.sessionDate || trade.date} />
            {duration && <StatRow label="Duration" value={duration} />}
          </div>

          {/* Setup */}
          <div className="p-5 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-[var(--text-secondary)]" />
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">Setup</span>
            </div>
            {savedSetups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {savedSetups.map(s => (
                  <button
                    key={s}
                    onClick={async () => {
                      const val = setup === s ? '' : s
                      setSetup(val)
                      await updateTrade(trade.id, { setup: val || undefined })
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      setup === s
                        ? 'border-[var(--green)] bg-[var(--green)]/15 text-[var(--green)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--green)] transition-colors"
                placeholder="Type a setup name..."
                value={setup}
                onChange={e => setSetup(e.target.value)}
                onBlur={async () => {
                  if (setup !== (trade.setup || '')) {
                    await updateTrade(trade.id, { setup: setup || undefined })
                  }
                }}
              />
            )}
            {savedSetups.length > 0 && (
              <input
                className="w-full mt-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--green)] transition-colors"
                placeholder="Or type a custom setup..."
                value={savedSetups.includes(setup) ? '' : setup}
                onChange={e => setSetup(e.target.value)}
                onBlur={async () => {
                  if (setup !== (trade.setup || '')) {
                    await updateTrade(trade.id, { setup: setup || undefined })
                  }
                }}
              />
            )}
          </div>

          {/* Notes */}
          <div className="p-5 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={14} className="text-[var(--text-secondary)]" />
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">Notes</span>
              {saved && <Check size={14} className="text-[var(--green)]" />}
            </div>
            <textarea
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--green)] transition-colors"
              rows={4}
              placeholder="Add trade notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={saveNotes}
            />
            {saved && (
              <p className="text-xs text-[var(--green)] mt-1 flex items-center gap-1">
                <Check size={12} /> Saved
              </p>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)' }}>
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#1E293B] transition-colors"
          >
            <X size={18} />
          </button>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-4 border-b border-[var(--border)]">
            <TabBtn active={tab === 'chart'} onClick={() => setTab('chart')}>
              <BarChart3 size={14} /> Chart
            </TabBtn>
            <TabBtn active={tab === 'pnl'} onClick={() => setTab('pnl')}>
              <LineChart size={14} /> Running P&L
            </TabBtn>
          </div>

          <div className="flex-1 overflow-hidden">
            <ProGate feature="dashboard_charts" mode="blur" label="Trade Charts">
            {tab === 'chart' && (
              <TradeCandleChart trade={trade} />
            )}

            {tab === 'pnl' && (
              <div className="h-full p-6">
                <div className="rounded-xl p-4 h-full" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-4">
                    Running P&L — Entry to Exit
                  </p>
                  {pnlLoading ? (
                    <div className="flex items-center justify-center h-[85%] text-[var(--text-secondary)] text-xs">
                      Loading P&L data...
                    </div>
                  ) : (
                  <RunningPnlChart data={runningPnlData} isWin={isWin} />
                  )}
                </div>
              </div>
            )}
            </ProGate>
          </div>
        </div>
      </div>
        </div>
    </>
  )
}

function StatRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)]/50">
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      {children || <span className="text-sm text-[var(--text-primary)] font-mono">{value}</span>}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[var(--bg-card)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
      }`}
    >
      {children}
    </button>
  )
}

function RunningPnlChart({ data, isWin }: { data: { time: string; pnl: number }[]; isWin: boolean }) {
  const minPnl = Math.min(...data.map(d => d.pnl))
  const maxPnl = Math.max(...data.map(d => d.pnl))
  // Calculate where $0 falls in the gradient (0=top, 1=bottom)
  const range = maxPnl - minPnl
  const zeroOffset = range > 0 ? maxPnl / range : 0.5
  const clampedOffset = Math.max(0.01, Math.min(0.99, zeroOffset))

  return (
    <ResponsiveContainer width="100%" height="85%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset={`${clampedOffset * 100}%`} stopColor="#4ADE80" />
            <stop offset={`${clampedOffset * 100}%`} stopColor="#EF4444" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <linearGradient id="splitFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.2} />
            <stop offset={`${clampedOffset * 100}%`} stopColor="#4ADE80" stopOpacity={0.05} />
            <stop offset={`${clampedOffset * 100}%`} stopColor="#EF4444" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.4)" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v >= 0 ? '' : ''}${v.toFixed(0)}`}
          width={55}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid rgba(30,41,59,0.6)', borderRadius: '10px', color: '#F1F5F9', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
          formatter={((value: any) => {
            const v = Number(value ?? 0)
            return [`${v >= 0 ? '+' : ''}$${v.toFixed(2)}`, 'P&L']
          }) as any}
          labelFormatter={(l: any) => l ?? ''}
          cursor={{ stroke: 'rgba(148,163,184,0.3)', strokeDasharray: '4 4' }}
        />
        {/* Zero line */}
        {minPnl < 0 && maxPnl > 0 && (
          <CartesianGrid strokeDasharray="0" horizontal={false} vertical={false} />
        )}
        <Area
          type="monotone"
          dataKey="pnl"
          stroke="url(#splitStroke)"
          strokeWidth={2.5}
          fill="url(#splitFill)"
          dot={false}
          activeDot={{ r: 4, fill: '#F1F5F9', stroke: isWin ? '#4ADE80' : '#EF4444', strokeWidth: 2 }}
        />
        {/* Render $0 reference line */}
        {minPnl < 0 && maxPnl > 0 && (
          <Area type="monotone" dataKey={() => 0} stroke="rgba(100,116,139,0.3)" strokeWidth={1} strokeDasharray="4 4" fill="none" dot={false} activeDot={false} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
