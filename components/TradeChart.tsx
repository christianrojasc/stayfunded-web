'use client'
import { useEffect, useRef, useMemo } from 'react'
import {
  createChart,
  CandlestickSeries,
  createSeriesMarkers,
  CrosshairMode,
} from 'lightweight-charts'
import type { Time, CandlestickData, SeriesMarker } from 'lightweight-charts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { Trade } from '@/lib/types'

interface Props {
  trade: Trade
}

// ── Simulated OHLC Generator ─────────────────────────────────────────────────

function generateCandleData(
  entryPrice: number,
  exitPrice: number,
  dateStr: string
): CandlestickData<Time>[] {
  const TOTAL = 30
  const ENTRY_IDX = 7
  const EXIT_IDX = 22

  // Ensure there's at least a minimal price spread for visual interest
  const priceSpread = Math.abs(exitPrice - entryPrice)
  const volatility = Math.max(priceSpread * 0.4, 0.5)

  // Start 5-minute bars from 09:30 on the trade date
  const baseMs = new Date(dateStr + 'T14:30:00Z').getTime() // 09:30 ET = 14:30 UTC
  const barMs = 5 * 60 * 1000

  // Seeded-ish random based on prices for stable rendering
  let seed = Math.round(entryPrice * 100 + exitPrice * 100)
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return (seed >>> 0) / 0x100000000
  }

  // Weighted random walk: drifts toward target
  const walk = (from: number, to: number, steps: number): number[] => {
    const pts: number[] = [from]
    for (let i = 1; i < steps; i++) {
      const t = i / (steps - 1)
      const target = from + (to - from) * t
      const noise = (rand() - 0.5) * volatility * 1.2
      pts.push(target + noise)
    }
    pts[steps - 1] = to
    return pts
  }

  // Pre-entry wander: approach entry price
  const pre = walk(
    entryPrice + (rand() - 0.5) * volatility * 3,
    entryPrice,
    ENTRY_IDX + 1
  )

  // Entry → Exit arc
  const mid = walk(entryPrice, exitPrice, EXIT_IDX - ENTRY_IDX + 1)

  // Post-exit drift
  const post = walk(
    exitPrice,
    exitPrice + (rand() - 0.5) * volatility * 2,
    TOTAL - EXIT_IDX
  )

  const closes: number[] = [
    ...pre.slice(0, ENTRY_IDX),
    ...mid,
    ...post.slice(1),
  ]

  // Anchor the key bars
  closes[ENTRY_IDX] = entryPrice
  closes[EXIT_IDX] = exitPrice

  return closes.map((close, i) => {
    const open = i === 0 ? close : closes[i - 1]
    const wickExtra = volatility * (0.3 + rand() * 0.5)
    const high = Math.max(open, close) + rand() * wickExtra
    const low = Math.min(open, close) - rand() * wickExtra
    return {
      time: Math.floor((baseMs + i * barMs) / 1000) as Time,
      open,
      high,
      low,
      close,
    }
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TradeChart({ trade }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Memoize candle data so it's stable across re-renders
  const candles = useMemo(
    () => generateCandleData(trade.entryPrice, trade.exitPrice, trade.date),
    [trade.entryPrice, trade.exitPrice, trade.date]
  )

  const isWin = trade.netPnl >= 0
  const pnlColor = isWin ? '#4ADE50' : '#EF4444'
  const pnlSign = isWin ? '+' : ''

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 200,
      layout: {
        background: { color: '#0B1628' },
        textColor: '#94A3B8',
        fontFamily: 'Inter, ui-sans-serif, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(148,163,184,0.06)' },
        horzLines: { color: 'rgba(148,163,184,0.06)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: 'rgba(148,163,184,0.12)',
        textColor: '#64748B',
        minimumWidth: 60,
      },
      timeScale: {
        borderColor: 'rgba(148,163,184,0.12)',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: false,
      handleScale: false,
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#4ADE50',
      downColor: '#EF4444',
      borderUpColor: '#4ADE50',
      borderDownColor: '#EF4444',
      wickUpColor: '#4ADE50',
      wickDownColor: '#EF4444',
    })

    series.setData(candles)

    // Entry & exit markers
    const markers: SeriesMarker<Time>[] = [
      {
        time: candles[7].time,
        position: 'belowBar',
        color: '#4ADE50',
        shape: 'arrowUp',
        text: `Entry ${trade.entryPrice.toFixed(2)}`,
        size: 1,
      },
      {
        time: candles[22].time,
        position: 'aboveBar',
        color: '#EF4444',
        shape: 'arrowDown',
        text: `Exit ${trade.exitPrice.toFixed(2)}`,
        size: 1,
      },
    ]
    createSeriesMarkers(series, markers)

    chart.timeScale().fitContent()

    // Responsive resize
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.remove()
    }
  }, [candles, trade.entryPrice, trade.exitPrice])

  return (
    <div className="px-3 pt-2 pb-1">
      {/* Metadata bar */}
      <div className="flex flex-wrap items-center gap-3 mb-2 text-xs">
        <span
          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold ${
            trade.side === 'Long'
              ? 'bg-green-500/15 text-green-400'
              : 'bg-orange-500/15 text-orange-400'
          }`}
        >
          {trade.side === 'Long' ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trade.side}
        </span>

        <span className="text-[var(--text-secondary)]">
          <span className="font-mono font-bold text-[var(--text-secondary)]">{trade.symbol}</span>
          {' · '}
          {trade.date}
        </span>

        <span className="text-[var(--text-secondary)]">
          Entry{' '}
          <span className="font-mono text-[var(--text-secondary)]">{trade.entryPrice.toFixed(2)}</span>
        </span>

        <span className="text-[var(--text-secondary)]">
          Exit{' '}
          <span className="font-mono text-[var(--text-secondary)]">{trade.exitPrice.toFixed(2)}</span>
        </span>

        {trade.contracts > 1 && (
          <span className="text-[var(--text-secondary)]">
            <span className="font-mono text-[var(--text-secondary)]">{trade.contracts}</span>
            {' cts'}
          </span>
        )}

        <span
          className="ml-auto font-mono font-bold"
          style={{ color: pnlColor }}
        >
          {pnlSign}${Math.abs(trade.netPnl).toFixed(2)}
        </span>
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: 200 }}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1.5 text-[10px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <span className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-b-[7px] border-l-transparent border-r-transparent border-b-[#4ADE50]" />
          Entry
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#EF4444]" />
          Exit
        </span>
        <span className="ml-auto italic text-[#334155]">
          Simulated price action — for visual reference only
        </span>
      </div>
    </div>
  )
}
