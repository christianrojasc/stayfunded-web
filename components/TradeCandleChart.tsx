'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, LineStyle, CandlestickSeries, CandlestickData, Time, IChartApi, ISeriesApi, createSeriesMarkers } from 'lightweight-charts'
import { Trade } from '@/lib/types'
import { toYahooSymbol } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface Props {
  trade: Trade
}

const INTERVALS = ['1m', '5m', '15m', '1H'] as const
type Interval = typeof INTERVALS[number]

export default function TradeCandleChart({ trade }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [interval, setInterval] = useState<Interval>('1m')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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

    const from = entryTs - 1800
    const to = exitTs + 1800

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

    const fallbacks: Interval[] = iv === '1m' ? ['1m', '5m', '15m', '1H']
      : iv === '5m' ? ['5m', '15m', '1H']
      : iv === '15m' ? ['15m', '1H']
      : ['1H']

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
        background: { type: ColorType.Solid, color: '#0a0e17' },
        textColor: '#8896b3',
      },
      grid: {
        vertLines: { color: 'var(--text-muted)' },
        horzLines: { color: 'var(--text-muted)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'var(--border)',
      },
      rightPriceScale: {
        borderColor: 'var(--border)',
      },
      crosshair: {
        vertLine: { color: 'var(--text-muted)' },
        horzLine: { color: 'var(--text-muted)' },
      },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#4ADE80',
      downColor: '#EF4444',
      borderUpColor: '#4ADE80',
      borderDownColor: '#EF4444',
      wickUpColor: '#4ADE80',
      wickDownColor: '#EF4444',
    })

    series.setData(candles)

    // Entry price line
    series.createPriceLine({
      price: trade.entryPrice,
      color: '#fb923c',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Entry',
    })

    // Exit price line
    series.createPriceLine({
      price: trade.exitPrice,
      color: trade.netPnl >= 0 ? '#4ADE80' : '#EF4444',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Exit',
    })

    // Markers
    const entryCandle = findClosestCandle(candles, trade.date, trade.entryTime)
    const exitCandle = findClosestCandle(candles, trade.date, trade.exitTime)

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

    chart.timeScale().fitContent()
    chartRef.current = chart
    seriesRef.current = series
    setLoading(false)
  }, [fetchCandles, trade])

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
      <div className="flex items-center gap-1 px-4 py-2">
        {INTERVALS.map(iv => (
          <button
            key={iv}
            onClick={() => setInterval(iv)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              interval === iv
                ? 'bg-[#2D8B4E]/20 text-[#4ADE80]'
                : 'text-[var(--text-secondary)] hover:text-[#94A3B8] hover:bg-[#111827]'
            }`}
          >
            {iv}
          </button>
        ))}
      </div>
      <div className="flex-1 relative" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17] z-10">
            <Loader2 size={24} className="animate-spin text-[var(--text-secondary)]" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17] z-10">
            <p className="text-[var(--text-secondary)] text-sm">Chart unavailable</p>
          </div>
        )}
      </div>
    </div>
  )
}

function findClosestCandle(candles: CandlestickData<Time>[], date: string, time?: string): CandlestickData<Time> | null {
  if (!time || !candles.length) return candles.length ? candles[Math.floor(candles.length / 2)] : null
  // Tradovate timestamps are CT (UTC-6), match what fetchCandles uses
  const target = new Date(`${date}T${time}-06:00`).getTime() / 1000
  let closest = candles[0]
  let minDiff = Math.abs((closest.time as number) - target)
  for (const c of candles) {
    const diff = Math.abs((c.time as number) - target)
    if (diff < minDiff) {
      minDiff = diff
      closest = c
    }
  }
  return closest
}
