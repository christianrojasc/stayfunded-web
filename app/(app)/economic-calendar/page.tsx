'use client'
import { useEffect, useState } from 'react'
import { AlertCircle, TrendingUp, Minus, ChevronDown } from 'lucide-react'

const GLASS = 'rounded-2xl border border-white/[0.06]'
const CARD_BG = 'rgba(255,255,255,0.04)'

interface EconEvent {
  event: string
  country: string
  time: string
  impact: 'high' | 'medium' | 'low'
  actual?: string
  forecast?: string
  previous?: string
}

// Static high-quality economic calendar data for the week
// In production, wire to Finnhub /calendar/economic or Tradingeconomics API
const SAMPLE_EVENTS: EconEvent[] = [
  { event: 'CPI (YoY)', country: 'US', time: '08:30', impact: 'high', forecast: '3.1%', previous: '3.4%' },
  { event: 'Core CPI (YoY)', country: 'US', time: '08:30', impact: 'high', forecast: '3.7%', previous: '3.9%' },
  { event: 'Initial Jobless Claims', country: 'US', time: '08:30', impact: 'medium', forecast: '218K', previous: '215K' },
  { event: 'FOMC Meeting Minutes', country: 'US', time: '14:00', impact: 'high', forecast: '-', previous: '-' },
  { event: 'PPI (MoM)', country: 'US', time: '08:30', impact: 'high', forecast: '0.3%', previous: '0.3%' },
  { event: 'Retail Sales (MoM)', country: 'US', time: '08:30', impact: 'high', forecast: '0.4%', previous: '-0.8%' },
  { event: 'Michigan Consumer Sentiment', country: 'US', time: '10:00', impact: 'medium', forecast: '76.5', previous: '76.9' },
  { event: 'NFP (Non-Farm Payrolls)', country: 'US', time: '08:30', impact: 'high', forecast: '185K', previous: '256K' },
  { event: 'Unemployment Rate', country: 'US', time: '08:30', impact: 'high', forecast: '4.1%', previous: '4.1%' },
  { event: 'Fed Chair Powell Speech', country: 'US', time: '13:00', impact: 'high', forecast: '-', previous: '-' },
  { event: 'ISM Manufacturing PMI', country: 'US', time: '10:00', impact: 'medium', forecast: '48.5', previous: '47.2' },
  { event: 'GDP (QoQ)', country: 'US', time: '08:30', impact: 'high', forecast: '2.3%', previous: '3.1%' },
  { event: 'Trade Balance', country: 'US', time: '08:30', impact: 'medium', forecast: '-$67.5B', previous: '-$78.2B' },
  { event: 'Crude Oil Inventories', country: 'US', time: '10:30', impact: 'medium', forecast: '-1.2M', previous: '3.6M' },
  { event: 'JOLTS Job Openings', country: 'US', time: '10:00', impact: 'medium', forecast: '8.0M', previous: '8.1M' },
]

const impactConfig = {
  high:   { color: '#FF453A', label: 'High',   dot: 'bg-[#FF453A]' },
  medium: { color: '#F59E0B', label: 'Med',    dot: 'bg-amber-400' },
  low:    { color: '#64748B', label: 'Low',    dot: 'bg-[#64748B]' },
}

const FILTERS = ['All', 'High', 'Medium', 'Low'] as const
type Filter = typeof FILTERS[number]

export default function EconomicCalendarPage() {
  const [filter, setFilter] = useState<Filter>('All')
  const [expanded, setExpanded] = useState<number | null>(null)

  const filtered = SAMPLE_EVENTS.filter(e => {
    if (filter === 'All') return true
    if (filter === 'High') return e.impact === 'high'
    if (filter === 'Medium') return e.impact === 'medium'
    if (filter === 'Low') return e.impact === 'low'
    return true
  })

  const highCount = SAMPLE_EVENTS.filter(e => e.impact === 'high').length

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Economic Calendar</h1>
          <p className="text-[#64748B] text-sm mt-0.5">Key US macro events affecting futures markets</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{background:CARD_BG, border:'1px solid rgba(255,255,255,0.06)'}}>
          <AlertCircle className="w-4 h-4 text-[#FF453A]" />
          <span className="text-white text-sm font-semibold">{highCount} high-impact</span>
          <span className="text-[#64748B] text-sm">events this week</span>
        </div>
      </div>

      {/* Impact legend + filter */}
      <div className="flex flex-wrap items-center gap-3">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f
                ? 'bg-[#4ADE80] text-black'
                : 'text-[#64748B] hover:text-white'
            }`}
            style={filter !== f ? {background:CARD_BG, border:'1px solid rgba(255,255,255,0.06)'} : {}}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4 text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF453A]" /> High</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#64748B]" /> Low</span>
        </div>
      </div>

      {/* Events list */}
      <div className={`${GLASS} overflow-hidden`} style={{background:CARD_BG}}>
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/[0.06] text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
          <div className="col-span-1">Impact</div>
          <div className="col-span-1">Time</div>
          <div className="col-span-5">Event</div>
          <div className="col-span-2 text-right">Forecast</div>
          <div className="col-span-2 text-right">Previous</div>
          <div className="col-span-1 text-right">Actual</div>
        </div>

        {filtered.map((event, i) => {
          const cfg = impactConfig[event.impact]
          const isOpen = expanded === i
          return (
            <div key={i}>
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full grid grid-cols-12 gap-2 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] last:border-0"
              >
                {/* Impact dot */}
                <div className="col-span-1 flex items-center">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                </div>
                {/* Time */}
                <div className="col-span-1 text-[#64748B] text-sm font-mono">{event.time}</div>
                {/* Event name */}
                <div className="col-span-5 text-white text-sm font-medium flex items-center gap-2">
                  {event.event}
                  {event.impact === 'high' && (
                    <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-bold text-black" style={{background:'#FF453A'}}>!</span>
                  )}
                </div>
                {/* Forecast */}
                <div className="col-span-2 text-right text-[#94A3B8] text-sm">{event.forecast || '—'}</div>
                {/* Previous */}
                <div className="col-span-2 text-right text-[#64748B] text-sm">{event.previous || '—'}</div>
                {/* Actual */}
                <div className="col-span-1 text-right text-sm">
                  {event.actual
                    ? <span className="text-[#4ADE80] font-semibold">{event.actual}</span>
                    : <span className="text-[#334155]">—</span>
                  }
                </div>
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-center text-[#334155] text-xs">
        Data updates weekly. Wire to Finnhub or Tradingeconomics API for live data.
      </p>
    </div>
  )
}
