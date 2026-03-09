'use client'
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown } from 'lucide-react'
import ProGate from '@/components/ProGate'
import { useTrades } from '@/components/TradeContext'
import { getMonthlyStats, formatPnl, formatCurrency } from '@/lib/calculations'
import { format, parseISO } from 'date-fns'
import { Trade } from '@/lib/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

export default function CalendarPage() {
  const { trades } = useTrades()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const monthData = useMemo(() => getMonthlyStats(trades, year, month), [trades, year, month])

  const todayStr = format(now, 'yyyy-MM-dd')

  const prev = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  const next = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  // Month summary
  const monthTrades = trades.filter(t => (t.sessionDate || t.date).startsWith(`${year}-${String(month).padStart(2,'0')}`))
  const monthPnl = monthTrades.reduce((s, t) => s + t.netPnl, 0)
  const monthWins = monthTrades.filter(t => t.netPnl > 0).length
  const tradingDays = monthData.filter(d => d.stats && d.stats.tradeCount > 0).length

  // Selected day trades
  const selectedTrades = useMemo(() =>
    selectedDate ? trades.filter(t => (t.sessionDate || t.date) === selectedDate) : [],
    [selectedDate, trades]
  )

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Daily P&L at a glance</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Month summary */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[var(--text-muted)]">{tradingDays} days · {monthTrades.length} trades</span>
            <span className={`font-bold px-3 py-1 rounded-full text-sm ${
              monthPnl >= 0 ? 'bg-[#166534]/20 text-[#4ADE80]' : 'bg-red-50 text-[#EF4444]'
            }`}>
              {formatPnl(monthPnl)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 glass-card p-6">
          {/* Nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prev} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{MONTHS[month - 1]} {year}</h2>
            <button onClick={next} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-[var(--text-secondary)] py-1 uppercase tracking-wide">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Leading empty cells */}
            {Array.from({ length: monthData[0]?.dayOfWeek || 0 }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[72px] rounded-xl" />
            ))}

            {monthData.map(({ date, day, dayOfWeek, stats }) => {
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
              const isToday = date === todayStr
              const isSelected = date === selectedDate
              const hasData = !!stats

              let cellClass = 'cal-cell '
              if (isWeekend) cellClass += 'weekend'
              else if (!hasData) cellClass += 'no-trade'
              else if (stats!.netPnl >= 0) cellClass += 'has-win'
              else cellClass += 'has-loss'
              if (isToday) cellClass += ' today'
              if (isSelected) cellClass += ' ring-2 ring-[#2D8B4E] ring-offset-1'

              return (
                <div
                  key={date}
                  className={cellClass}
                  onClick={() => !isWeekend && setSelectedDate(date === selectedDate ? null : date)}
                >
                  <div className={`text-xs font-bold mb-1 ${
                    isToday ? 'text-[#2D8B4E]' :
                    isWeekend ? 'text-[var(--text-muted)]' :
                    'text-[var(--text-muted)]'
                  }`}>{day}</div>

                  {hasData && (
                    <>
                      <div className={`text-xs font-bold leading-tight ${
                        stats!.netPnl >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'
                      }`}>
                        {formatPnl(stats!.netPnl)}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        {stats!.tradeCount}T · {stats!.winRate.toFixed(0)}%
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#F0F3F7] text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#166534]" />Win day</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#7f1d1d]" />Loss day</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#1E293B]" />No trades</span>
          </div>
        </div>

        {/* Day Detail */}
        <div className="glass-card p-5 flex flex-col">
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] text-base">
                    {format(parseISO(selectedDate), 'EEEE, MMM d')}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{selectedTrades.length} trade{selectedTrades.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setSelectedDate(null)} className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  <X size={15} />
                </button>
              </div>

              {selectedTrades.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-sm">
                  No trades on this day
                </div>
              ) : (
                <>
                  {/* Day summary */}
                  {(() => {
                    const dayPnl = selectedTrades.reduce((s, t) => s + t.netPnl, 0)
                    const dayWins = selectedTrades.filter(t => t.netPnl > 0).length
                    return (
                      <div className={`p-3 rounded-xl mb-4 ${dayPnl >= 0 ? 'bg-[#166534]/20' : 'bg-[#7f1d1d]/20'}`}>
                        <p className={`text-xl font-bold ${dayPnl >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
                          {formatPnl(dayPnl)}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {dayWins}W / {selectedTrades.length - dayWins}L · {(dayWins / selectedTrades.length * 100).toFixed(0)}% WR
                        </p>
                      </div>
                    )
                  })()}

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {selectedTrades.map(t => (
                      <div key={t.id} className={`p-3 rounded-xl border text-sm ${
                        t.netPnl >= 0 ? 'border-[#4ADE80]/20 bg-[var(--bg-card)]' : 'border-[#FF453A]/20 bg-[var(--bg-card)]'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[var(--text-primary)] text-xs bg-[var(--bg-secondary)] px-2 py-0.5 rounded">{t.symbol}</span>
                            <span className={`text-xs font-semibold flex items-center gap-0.5 ${t.side === 'Long' ? 'text-[#2D8B4E]' : 'text-orange-600'}`}>
                              {t.side === 'Long' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {t.side}
                            </span>
                          </div>
                          <span className={`font-bold font-mono ${t.netPnl >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
                            {formatPnl(t.netPnl)}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] flex gap-3">
                          <span>{t.contracts}x</span>
                          <span>{t.entryPrice} → {t.exitPrice}</span>
                          {t.setup && <span className="text-[var(--text-muted)]">{t.setup}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center">
                <TrendingUp size={24} className="text-[var(--text-muted)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] text-sm">Click a day</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Select a trading day to see the breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
