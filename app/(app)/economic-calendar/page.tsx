'use client'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

const GLASS = 'glass-card'
const CARD_BG = 'var(--bg-card)'

interface EconEvent {
  date: string   // YYYY-MM-DD
  event: string
  time: string   // HH:MM EST
  impact: 'high' | 'medium' | 'low'
  actual?: string
  forecast?: string
  previous?: string
}

const EVENTS: EconEvent[] = [
  // Week of Mar 10
  { date: '2026-03-10', event: 'Fed Chair Powell Speech', time: '10:00', impact: 'high', forecast: '—', previous: '—' },
  { date: '2026-03-11', event: 'NFIB Small Business Index', time: '06:00', impact: 'low', forecast: '102.5', previous: '102.8' },
  { date: '2026-03-11', event: 'JOLTS Job Openings', time: '10:00', impact: 'medium', forecast: '7.75M', previous: '7.6M' },
  { date: '2026-03-12', event: 'CPI (YoY)', time: '08:30', impact: 'high', forecast: '2.9%', previous: '3.0%' },
  { date: '2026-03-12', event: 'Core CPI (YoY)', time: '08:30', impact: 'high', forecast: '3.2%', previous: '3.3%' },
  { date: '2026-03-12', event: 'CPI (MoM)', time: '08:30', impact: 'high', forecast: '0.3%', previous: '0.5%' },
  { date: '2026-03-13', event: 'Initial Jobless Claims', time: '08:30', impact: 'medium', forecast: '225K', previous: '221K' },
  { date: '2026-03-13', event: 'PPI (MoM)', time: '08:30', impact: 'high', forecast: '0.3%', previous: '0.4%' },
  { date: '2026-03-13', event: 'Core PPI (YoY)', time: '08:30', impact: 'medium', forecast: '3.5%', previous: '3.6%' },
  { date: '2026-03-14', event: 'Michigan Consumer Sentiment', time: '10:00', impact: 'medium', forecast: '63.5', previous: '64.7' },
  { date: '2026-03-14', event: 'Import Price Index (MoM)', time: '08:30', impact: 'low', forecast: '0.2%', previous: '0.3%' },
  // Week of Mar 17
  { date: '2026-03-17', event: 'NY Empire State Mfg Index', time: '08:30', impact: 'low', forecast: '-5.0', previous: '-20.0' },
  { date: '2026-03-18', event: 'Retail Sales (MoM)', time: '08:30', impact: 'high', forecast: '0.6%', previous: '-0.9%' },
  { date: '2026-03-18', event: 'Core Retail Sales (MoM)', time: '08:30', impact: 'high', forecast: '0.4%', previous: '-0.8%' },
  { date: '2026-03-18', event: 'Industrial Production (MoM)', time: '09:15', impact: 'medium', forecast: '0.2%', previous: '0.5%' },
  { date: '2026-03-19', event: 'FOMC Rate Decision', time: '14:00', impact: 'high', forecast: '4.25-4.50%', previous: '4.25-4.50%' },
  { date: '2026-03-19', event: 'Fed Projections (Dot Plot)', time: '14:00', impact: 'high', forecast: '—', previous: '—' },
  { date: '2026-03-19', event: 'Crude Oil Inventories', time: '10:30', impact: 'medium', forecast: '-1.0M', previous: '3.6M' },
  { date: '2026-03-20', event: 'Initial Jobless Claims', time: '08:30', impact: 'medium', forecast: '224K', previous: '221K' },
  { date: '2026-03-20', event: 'Philadelphia Fed Mfg Index', time: '08:30', impact: 'medium', forecast: '8.5', previous: '18.1' },
  { date: '2026-03-20', event: 'Existing Home Sales', time: '10:00', impact: 'low', forecast: '3.95M', previous: '4.08M' },
  { date: '2026-03-21', event: 'Flash Services PMI', time: '09:45', impact: 'medium', forecast: '51.0', previous: '49.7' },
  { date: '2026-03-21', event: 'Flash Mfg PMI', time: '09:45', impact: 'medium', forecast: '52.0', previous: '52.7' },
]

const impactConfig = {
  high:   { dot: 'bg-[#FF453A]', text: 'text-[#FF453A]', badge: '#FF453A' },
  medium: { dot: 'bg-amber-400', text: 'text-amber-400', badge: '#F59E0B' },
  low:    { dot: 'bg-[#475569]', text: 'text-[var(--text-muted)]', badge: '#475569' },
}

const FILTERS = ['All', 'High', 'Medium', 'Low'] as const
type Filter = typeof FILTERS[number]

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function EconomicCalendarPage() {
  const [filter, setFilter] = useState<Filter>('All')

  const filtered = EVENTS.filter(e => {
    if (filter === 'High') return e.impact === 'high'
    if (filter === 'Medium') return e.impact === 'medium'
    if (filter === 'Low') return e.impact === 'low'
    return true
  })

  // Group by date
  const grouped = filtered.reduce<Record<string, EconEvent[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort()
  const highCount = EVENTS.filter(e => e.impact === 'high').length

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Economic Calendar</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">High-impact US macro events affecting futures markets · EST</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{background:CARD_BG, border:'1px solid var(--border)'}}>
          <AlertCircle className="w-4 h-4 text-[#FF453A]" />
          <span className="text-[var(--text-primary)] text-sm font-semibold">{highCount} high-impact</span>
          <span className="text-[var(--text-secondary)] text-sm">events</span>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? 'bg-[#4ADE80] text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={filter !== f ? {background:CARD_BG, border:'1px solid var(--border)'} : {}}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF453A]" />High</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Med</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#475569]" />Low</span>
        </div>
      </div>

      {/* Events grouped by date */}
      <div className="space-y-4">
        {dates.map(date => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[var(--text-primary)] font-bold text-sm">{formatDate(date)}</span>
              <span className="text-[#334155] text-xs">{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[var(--text-muted)] text-xs">{grouped[date].filter(e => e.impact === 'high').length} high</span>
            </div>

            {/* Events for this date */}
            <div className={`${GLASS} overflow-hidden`} style={{background:CARD_BG}}>
              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[var(--border)] text-[10px] font-semibold text-[#334155] uppercase tracking-wider">
                <div className="col-span-1">Impact</div>
                <div className="col-span-1">Time</div>
                <div className="col-span-5">Event</div>
                <div className="col-span-2 text-right">Forecast</div>
                <div className="col-span-2 text-right">Previous</div>
                <div className="col-span-1 text-right">Actual</div>
              </div>

              {grouped[date].map((event, i) => {
                const cfg = impactConfig[event.impact]
                return (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card)] transition-colors"
                  >
                    <div className="col-span-1 flex items-center">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-[var(--text-secondary)] text-sm font-mono">{event.time}</div>
                    <div className="col-span-9 sm:col-span-5 text-[var(--text-primary)] text-sm font-medium flex items-center gap-2 flex-wrap">
                      {event.event}
                      {event.impact === 'high' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-black" style={{background:'#FF453A'}}>!</span>
                      )}
                    </div>
                    <div className="hidden sm:block col-span-2 text-right text-[var(--text-secondary)] text-sm">{event.forecast || '—'}</div>
                    <div className="hidden sm:block col-span-2 text-right text-[var(--text-secondary)] text-sm">{event.previous || '—'}</div>
                    <div className="hidden sm:block col-span-1 text-right text-sm">
                      {event.actual
                        ? <span className="text-[#4ADE80] font-semibold">{event.actual}</span>
                        : <span className="text-[#1E293B]">—</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[#1E293B] text-xs pb-4">
        All times Eastern (EST) · Data updated weekly
      </p>
    </div>
  )
}
