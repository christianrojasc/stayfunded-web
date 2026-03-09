'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { X, StickyNote, TrendingUp, TrendingDown, LineChart, BarChart3, Check } from 'lucide-react'
import { Trade } from '@/lib/types'
import { formatAccountNumber } from '@/lib/utils'
import { formatPnl } from '@/lib/calculations'
import { useTrades } from '@/components/TradeContext'
import { useAccountFilter } from '@/components/AccountFilterContext'
import dynamic from 'next/dynamic'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'chart' | 'pnl'>('chart')
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
      try {
        if (!trade.entryTime || !trade.exitTime) {
          // No time data — show simple entry→exit
          setRunningPnlData([
            { time: 'Entry', pnl: 0 },
            { time: 'Exit', pnl: trade.netPnl },
          ])
          setPnlLoading(false)
          return
        }

        // Build timestamps — Tradovate times are CT (UTC-6)
        const entryDate = new Date(`${trade.date}T${trade.entryTime}-06:00`)
        const exitDate = new Date(`${trade.date}T${trade.exitTime}-06:00`)
        const entryTs = Math.floor(entryDate.getTime() / 1000)
        const exitTs = Math.floor(exitDate.getTime() / 1000)

        const symbol = trade.symbol.replace(/[A-Z]\d{2}$/, '').replace(/\d+$/, '')
        const yahooMap: Record<string, string> = {
          ES: 'ES=F', MES: 'MES=F', NQ: 'NQ=F', MNQ: 'MNQ=F',
          YM: 'YM=F', MYM: 'MYM=F', RTY: 'RTY=F', M2K: 'M2K=F',
          CL: 'CL=F', MCL: 'MCL=F', GC: 'GC=F', MGC: 'MGC=F',
        }
        const yahooSymbol = yahooMap[symbol] || `${symbol}=F`

        const res = await fetch(`/api/candles?symbol=${encodeURIComponent(yahooSymbol)}&interval=1m&from=${entryTs - 60}&to=${exitTs + 60}`)
        const data = await res.json()
        const result = data?.chart?.result?.[0]

        if (cancelled) return

        if (!result?.timestamp?.length) {
          setRunningPnlData([
            { time: 'Entry', pnl: 0 },
            { time: 'Exit', pnl: trade.netPnl },
          ])
          setPnlLoading(false)
          return
        }

        const timestamps = result.timestamp as number[]
        const quotes = result.indicators?.quote?.[0]
        const points: { time: string; pnl: number }[] = []

        // Entry point
        points.push({ time: formatTime(entryTs), pnl: 0 })

        // Each candle close between entry and exit
        for (let i = 0; i < timestamps.length; i++) {
          const ts = timestamps[i]
          const close = quotes?.close?.[i]
          if (close == null || ts < entryTs || ts > exitTs) continue

          const unrealizedPnl = trade.side === 'Long'
            ? (close - trade.entryPrice) * trade.contracts * spec.multiplier
            : (trade.entryPrice - close) * trade.contracts * spec.multiplier

          points.push({ time: formatTime(ts), pnl: parseFloat(unrealizedPnl.toFixed(2)) })
        }

        // Exit point (actual realized P&L before fees)
        points.push({ time: formatTime(exitTs), pnl: trade.pnl })

        // Dedupe by time
        const seen = new Set<string>()
        const deduped = points.filter(p => {
          if (seen.has(p.time)) return false
          seen.add(p.time)
          return true
        })

        if (!cancelled) {
          setRunningPnlData(deduped.length > 1 ? deduped : [
            { time: 'Entry', pnl: 0 },
            { time: 'Exit', pnl: trade.netPnl },
          ])
        }
      } catch {
        if (!cancelled) {
          setRunningPnlData([
            { time: 'Entry', pnl: 0 },
            { time: 'Exit', pnl: trade.netPnl },
          ])
        }
      }
      if (!cancelled) setPnlLoading(false)
    }

    fetchRunningPnl()
    return () => { cancelled = true }
  }, [tab, trade, spec.multiplier])

  function formatTime(ts: number): string {
    // Convert UTC epoch to CT display (UTC-6)
    const d = new Date(ts * 1000)
    const ct = new Date(d.getTime() - 6 * 3600 * 1000)
    const h = ct.getUTCHours()
    const m = ct.getUTCMinutes()
    const s = ct.getUTCSeconds()
    return `${h}:${m.toString().padStart(2, '0')}${s ? ':' + s.toString().padStart(2, '0') : ''}`
  }

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
          <div className="p-5 border-b border-[#1E293B]">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono font-bold text-sm text-[#F1F5F9]">{trade.symbol}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                trade.side === 'Long' ? 'bg-green-500/15 text-[#4ADE80]' : 'bg-red-500/15 text-[#EF4444]'
              }`}>
                {trade.side === 'Long' ? <TrendingUp className="inline w-3 h-3 mr-0.5" /> : <TrendingDown className="inline w-3 h-3 mr-0.5" />}
                {trade.side}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-1">Net P&L</p>
            <p
              className="font-bold"
              style={{ fontFamily: 'Outfit, sans-serif', fontSize: '36px', color: isWin ? '#4ADE80' : '#EF4444' }}
            >
              {formatPnl(trade.netPnl)}
            </p>
          </div>

          <div className="flex-1 p-5 space-y-0">
            <StatRow label="Gross P&L">
              <span className={grossPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#EF4444]'}>{formatPnl(grossPnl)}</span>
            </StatRow>
            <StatRow label="Fees" value={`$${trade.fees.toFixed(2)}`} />
            <StatRow label="Side">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                trade.side === 'Long' ? 'bg-green-500/15 text-[#4ADE80]' : 'bg-red-500/15 text-[#EF4444]'
              }`}>
                {trade.side}
              </span>
            </StatRow>
            <StatRow label="Symbol">
              <span className="font-mono font-bold text-xs bg-[#0F172A] px-2 py-0.5 rounded text-[#F1F5F9]">{trade.symbol}</span>
            </StatRow>
            {acct && (
              <StatRow label="Account">
                <span className="text-[#94A3B8] font-mono text-xs">
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

          {/* Notes */}
          <div className="p-5 border-t border-[#1E293B]">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={14} className="text-[var(--text-secondary)]" />
              <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Notes</span>
              {saved && <Check size={14} className="text-[#4ADE80]" />}
            </div>
            <textarea
              className="w-full bg-[#0A0E17] border border-[#1E293B] rounded-lg p-3 text-sm text-[#F1F5F9] placeholder-[#475569] resize-none focus:outline-none focus:border-[#2D8B4E] transition-colors"
              rows={4}
              placeholder="Add trade notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={saveNotes}
            />
            {saved && (
              <p className="text-xs text-[#4ADE80] mt-1 flex items-center gap-1">
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
          <div className="flex items-center gap-1 p-4 border-b border-[#1E293B]">
            <TabBtn active={tab === 'chart'} onClick={() => setTab('chart')}>
              <BarChart3 size={14} /> Chart
            </TabBtn>
            <TabBtn active={tab === 'pnl'} onClick={() => setTab('pnl')}>
              <LineChart size={14} /> Running P&L
            </TabBtn>
          </div>

          <div className="flex-1 overflow-hidden">
            {tab === 'chart' && (
              <TradeCandleChart trade={trade} />
            )}

            {tab === 'pnl' && (
              <div className="h-full p-6">
                <div className="rounded-xl p-4 h-full" style={{ background: '#151d2e', border: '1px solid rgba(30,41,59,0.5)' }}>
                  <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-4">
                    Running P&L — Entry to Exit
                  </p>
                  {pnlLoading ? (
                    <div className="flex items-center justify-center h-[85%] text-[var(--text-secondary)] text-xs">
                      Loading P&L data...
                    </div>
                  ) : (
                  <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={runningPnlData}>
                      <defs>
                        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isWin ? '#4ADE80' : '#EF4444'} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={isWin ? '#4ADE80' : '#EF4444'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="time" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} tickLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} tickLine={false} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
                      <Tooltip
                        contentStyle={{ background: '#111827', border: '1px solid #1E293B', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }}
                        formatter={(value: any) => [`$${Number(value ?? 0).toFixed(2)}`, 'P&L']}
                        labelFormatter={(l: any) => l ?? ''}
                      />
                      <Area type="monotone" dataKey="pnl" stroke={isWin ? '#4ADE80' : '#EF4444'} strokeWidth={2} fill="url(#pnlGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        </div>
    </>
  )
}

function StatRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1E293B]/50">
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      {children || <span className="text-sm text-[#F1F5F9] font-mono">{value}</span>}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[#151d2e] text-[#F1F5F9]' : 'text-[var(--text-secondary)] hover:text-[#94A3B8] hover:bg-[#111827]'
      }`}
    >
      {children}
    </button>
  )
}
