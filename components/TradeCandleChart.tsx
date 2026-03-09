'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, LineStyle, CandlestickSeries, CandlestickData, Time, IChartApi, ISeriesApi, createSeriesMarkers } from 'lightweight-charts'
import { Trade } from '@/lib/types'
import { useTheme } from '@/components/ThemeContext'
import { toYahooSymbol } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface Props {
  trade: Trade
}

const INTERVALS = ['1m', '5m', '15m', '1h'] as const
type Interval = typeof INTERVALS[number]

export default function TradeCandleChart({ trade }: Props) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [interval, setInterval] = useState<Interval>('1m')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [ohlc, setOhlc] = useState<{ open: number; high: number; low: number; close: number; time?: string } | null>(null)
  const lastCandleRef = useRef<CandlestickData<Time> | null>(null)

  const fetchCandles = useCallback(async (iv: Interval): Promise<CandlestickData<Time>[] | null> => {
    const symbol = toYahooSymbol(trade.symbol)
    const tradeDate = new Date(trade.date + 'T00:00:00')

    let entryTs: number
    let exitTs: number

    if (trade.entryTime && trade.exitTime) {
      // Tradovate timestamps are CT (UTC-6). Append offset so parsing is correct.
      const entryDate = new Date(`${trade.date}T${trade.entryTime}-06:00`)
      const exitDate = new Date(`${trade.date}T${trade.exitTime}-06:00`)
      entryTs = Math.floor(entryDate.getTime() / 1000)
      exitTs = Math.floor(exitDate.getTime() / 1000)
    } else {
      const midday = new Date(tradeDate)
      midday.setUTCHours(20, 0, 0, 0) // 8pm UTC = 2pm ET, typical trading session
      entryTs = Math.floor(midday.getTime() / 1000) - 3600
      exitTs = Math.floor(midday.getTime() / 1000) + 3600
    }

    // Pad the window — max context per interval
    const padSeconds = iv === '1h' ? 86400 : iv === '15m' ? 43200 : iv === '5m' ? 28800 : 14400
    const from = entryTs - padSeconds
    const to = exitTs + padSeconds

    try {
      const res = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&interval=${iv}&from=${from}&to=${to}`)
      const data = await res.json()
      const result = data?.chart?.result?.[0]
      if (!result?.timestamp?.length) return null

      const timestamps = result.timestamp as number[]
      const quotes = result.indicators?.quote?.[0]
      if (!quotes) return null

      const candles: CandlestickData<Time>[] = []
      for (let i = 0; i < timestamps.length; i++) {
        const o = quotes.open?.[i]
        const h = quotes.high?.[i]
        const l = quotes.low?.[i]
        const c = quotes.close?.[i]
        if (o == null || h == null || l == null || c == null) continue
        candles.push({
          time: timestamps[i] as Time,
          open: o,
          high: h,
          low: l,
          close: c,
        })
      }
      return candles.length > 0 ? candles : null
    } catch {
      return null
    }
  }, [trade.date, trade.entryTime, trade.exitTime, trade.symbol])

  const loadChart = useCallback(async (iv: Interval) => {
    setLoading(true)
    setError(false)

    const fallbacks: Interval[] = iv === '1m' ? ['1m', '5m', '15m', '1h']
      : iv === '5m' ? ['5m', '15m', '1h']
      : iv === '15m' ? ['15m', '1h']
      : ['1h']

    let candles: CandlestickData<Time>[] | null = null
    for (const fb of fallbacks) {
      candles = await fetchCandles(fb)
      if (candles) break
    }

    if (!candles || !containerRef.current) {
      setError(true)
      setLoading(false)
      return
    }

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: theme === 'light' ? '#f8fafc' : '#0a0e17' },
        textColor: theme === 'light' ? '#64748b' : '#8896b3',
      },
      grid: {
        vertLines: { color: theme === 'light' ? '#e2e8f0' : '#1e293b' },
        horzLines: { color: theme === 'light' ? '#e2e8f0' : '#1e293b' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: theme === 'light' ? '#cbd5e1' : '#1e293b',
      },
      rightPriceScale: {
        borderColor: theme === 'light' ? '#cbd5e1' : '#1e293b',
      },
      crosshair: {
        vertLine: { color: theme === 'light' ? '#94a3b8' : '#475569' },
        horzLine: { color: theme === 'light' ? '#94a3b8' : '#475569' },
      },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#4ADE80',
      downColor: '#EF4444',
      borderUpColor: '#4ADE80',
      borderDownColor: '#EF4444',
      wickUpColor: '#4ADE80',
      wickDownColor: '#EF4444',
      lastValueVisible: false,
      priceLineVisible: false,
    })

    series.setData(candles)

    // Entry price line (axis label shows price, no title to avoid overlap with markers)
    series.createPriceLine({
      price: trade.entryPrice,
      color: '#fb923c',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '',
    })

    // Exit price line
    series.createPriceLine({
      price: trade.exitPrice,
      color: trade.netPnl >= 0 ? '#4ADE80' : '#EF4444',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '',
    })

    // Markers
    const entryCandle = findClosestCandle(candles, trade.date, trade.entryTime, trade.entryPrice)
    const exitCandle = findClosestCandle(candles, trade.date, trade.exitTime, trade.exitPrice)

    const markers: any[] = []
    if (entryCandle) {
      markers.push({
        time: entryCandle.time,
        position: trade.side === 'Long' ? 'belowBar' : 'aboveBar',
        shape: trade.side === 'Long' ? 'arrowUp' : 'arrowDown',
        color: '#fb923c',
        text: 'Entry',
      })
    }
    if (exitCandle) {
      markers.push({
        time: exitCandle.time,
        position: trade.side === 'Long' ? 'aboveBar' : 'belowBar',
        shape: trade.side === 'Long' ? 'arrowDown' : 'arrowUp',
        color: trade.netPnl >= 0 ? '#4ADE80' : '#EF4444',
        text: 'Exit',
      })
    }
    if (markers.length) {
      markers.sort((a, b) => (a.time as number) - (b.time as number))
      createSeriesMarkers(series, markers)
    }

    // Store last candle for default OHLC display
    const lastCandle = candles[candles.length - 1]
    lastCandleRef.current = lastCandle
    setOhlc({ open: lastCandle.open, high: lastCandle.high, low: lastCandle.low, close: lastCandle.close })

    // Subscribe to crosshair move for live OHLC
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        // Reset to last candle when cursor leaves
        if (lastCandleRef.current) {
          const lc = lastCandleRef.current
          setOhlc({ open: lc.open, high: lc.high, low: lc.low, close: lc.close })
        }
        return
      }
      const data = param.seriesData.get(series) as CandlestickData<Time> | undefined
      if (data) {
        setOhlc({ open: data.open, high: data.high, low: data.low, close: data.close })
      }
    })

    chart.timeScale().fitContent()
    chartRef.current = chart
    seriesRef.current = series
    setLoading(false)
  }, [fetchCandles, trade, theme])

  useEffect(() => {
    loadChart(interval)
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [interval, loadChart])

  // Resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        })
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          {INTERVALS.map(iv => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                interval === iv
                  ? 'bg-[var(--green)]/20 text-[var(--green)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {iv.toUpperCase()}
            </button>
          ))}
        </div>
        {ohlc && !loading && !error && (
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-[var(--text-muted)]">O <span className="font-semibold text-[var(--text-primary)]">{ohlc.open.toFixed(2)}</span></span>
            <span className="text-[var(--text-muted)]">H <span className="font-semibold text-[#4ADE80]">{ohlc.high.toFixed(2)}</span></span>
            <span className="text-[var(--text-muted)]">L <span className="font-semibold text-[#FF453A]">{ohlc.low.toFixed(2)}</span></span>
            <span className="text-[var(--text-muted)]">C <span className={`font-semibold ${ohlc.close >= ohlc.open ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>{ohlc.close.toFixed(2)}</span></span>
          </div>
        )}
      </div>
      <div className="flex-1 relative" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)] z-10">
            <Loader2 size={24} className="animate-spin text-[var(--text-secondary)]" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)] z-10">
            <p className="text-[var(--text-secondary)] text-sm">Chart unavailable</p>
          </div>
        )}
      </div>
    </div>
  )
}

function findClosestCandle(candles: CandlestickData<Time>[], date: string, time: string | undefined, price: number): CandlestickData<Time> | null {
  if (!candles.length) return null
  if (!time) {
    // No time — find candle closest to the price
    return findByPrice(candles, price)
  }

  // Try multiple timezone offsets: CT (-06:00), ET (-05:00), UTC
  const offsets = ['-06:00', '-05:00', '-04:00', '+00:00']
  let bestCandle = candles[0]
  let bestScore = Infinity

  for (const offset of offsets) {
    const target = new Date(`${date}T${time}${offset}`).getTime() / 1000
    if (isNaN(target)) continue

    for (const c of candles) {
      const timeDiff = Math.abs((c.time as number) - target)
      // Price match: does this candle's range contain the trade price?
      const priceInRange = price >= c.low && price <= c.high
      // Score: prioritize price match, then time proximity
      const score = priceInRange ? timeDiff : timeDiff + 100000
      if (score < bestScore) {
        bestScore = score
        bestCandle = c
      }
    }
  }

  return bestCandle
}

function findByPrice(candles: CandlestickData<Time>[], price: number): CandlestickData<Time> {
  let best = candles[0]
  let bestDiff = Infinity
  for (const c of candles) {
    // Prefer candles that contain the price in their range
    if (price >= c.low && price <= c.high) {
      return c
    }
    const mid = (c.high + c.low) / 2
    const diff = Math.abs(mid - price)
    if (diff < bestDiff) {
      bestDiff = diff
      best = c
    }
  }
  return best
}
