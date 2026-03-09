'use client'
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown } from 'lucide-react'
import { useTrades } from '@/components/TradeContext'
import { getMonthlyStats, formatPnl } from '@/lib/calculations'
import { format, parseISO } from 'date-fns'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

export default function CalendarPage() {
  const { trades } = useTrades()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
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
  const tradingDays = monthData.filter(d => d.stats && d.stats.tradeCount > 0).length

  // Selected day trades
  const selectedTrades = useMemo(() =>
    selectedDate ? trades.filter(t => (t.sessionDate || t.date) === selectedDate) : [],
    [selectedDate, trades]
  )

  // Build weekly rows with totals
  const weeks = useMemo(() => {
    const leadingEmpties = monthData[0]?.dayOfWeek || 0
    const cells: (typeof monthData[0] | null)[] = [
      ...Array.from({ length: leadingEmpties }, () => null),
      ...monthData,
    ]
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null)

    const result: { cells: (typeof monthData[0] | null)[]; weekPnl: number; weekTrades: number }[] = []
    for (let i = 0; i < cells.length; i += 7) {
      const weekCells = cells.slice(i, i + 7)
      let weekPnl = 0
      let weekTradeCount = 0
      for (const c of weekCells) {
        if (c?.stats) {
          weekPnl += c.stats.netPnl
          weekTradeCount += c.stats.tradeCount
        }
      }
      result.push({ cells: weekCells, weekPnl, weekTrades: weekTradeCount })
    }
    return result
  }, [monthData])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Daily P&L at a glance</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[var(--text-muted)]">{tradingDays} days · {monthTrades.length} trades</span>
          <span className={`font-bold px-3 py-1 rounded-full text-sm ${
            monthPnl >= 0 ? 'bg-[#166534]/20 text-[#4ADE80]' : 'bg-[#7f1d1d]/20 text-[#EF4444]'
          }`}>
            {formatPnl(monthPnl)}
          </span>
        </div>
      </div>

      {/* Calendar — full width */}
      <div className="glass-card p-6">
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

        {/* Day headers + Weekly Total header */}
        <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 120px' }}>
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-[var(--text-secondary)] py-1 uppercase tracking-wide">{d}</div>
          ))}
          <div className="text-center text-xs font-semibold text-[var(--text-secondary)] py-1 uppercase tracking-wide">Weekly</div>
        </div>

        {/* Rows with weekly totals */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 120px' }}>
            {week.cells.map((cell, ci) => {
              if (!cell) return <div key={`empty-${wi}-${ci}`} className="min-h-[80px] rounded-xl" />

              const { date, day, dayOfWeek, stats } = cell
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
                  style={{ minHeight: 80 }}
                  onClick={() => !isWeekend && setSelectedDate(date === selectedDate ? null : date)}
                >
                  <div className={`text-xs font-bold mb-1 ${
                    isToday ? 'text-[#2D8B4E]' :
                    'text-[var(--text-muted)]'
                  }`}>{day}</div>

                  {hasData && (
                    <>
                      <div className={`text-sm font-bold leading-tight ${
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

            {/* Weekly total cell */}
            <div className={`rounded-xl flex flex-col items-center justify-center min-h-[80px] border ${
              week.weekTrades === 0
                ? 'border-[var(--border)] bg-[var(--bg-secondary)]/50'
                : week.weekPnl >= 0
                  ? 'border-[#4ADE80]/20 bg-[#166534]/10'
                  : 'border-[#EF4444]/20 bg-[#7f1d1d]/10'
            }`}>
              {week.weekTrades > 0 ? (
                <>
                  <span className={`text-sm font-bold font-mono ${
                    week.weekPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#EF4444]'
                  }`}>
                    {formatPnl(week.weekPnl)}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {week.weekTrades} trades
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-[var(--text-muted)]">—</span>
              )}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#166534]" />Win day</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#7f1d1d]" />Loss day</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#1E293B]" />No trades</span>
        </div>
      </div>

      {/* Day Detail — below calendar */}
      {selectedDate && (
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-lg">
                {format(parseISO(selectedDate), 'EEEE, MMM d')}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">{selectedTrades.length} trade{selectedTrades.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setSelectedDate(null)} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              <X size={16} />
            </button>
          </div>

          {selectedTrades.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm py-8 text-center">No trades on this day</p>
          ) : (
            <>
              {/* Day summary bar */}
              {(() => {
                const dayPnl = selectedTrades.reduce((s, t) => s + t.netPnl, 0)
                const dayWins = selectedTrades.filter(t => t.netPnl > 0).length
                return (
                  <div className={`p-4 rounded-xl mb-5 flex items-center justify-between ${dayPnl >= 0 ? 'bg-[#166534]/20' : 'bg-[#7f1d1d]/20'}`}>
                    <div>
                      <p className={`text-2xl font-bold ${dayPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>
                        {formatPnl(dayPnl)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {dayWins}W / {selectedTrades.length - dayWins}L · {(dayWins / selectedTrades.length * 100).toFixed(0)}% Win Rate
                      </p>
                    </div>
                  </div>
                )
              })()}

              {/* Trades grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {selectedTrades.map(t => (
                  <div key={t.id} className={`p-4 rounded-xl border text-sm ${
                    t.netPnl >= 0 ? 'border-[#4ADE80]/20 bg-[var(--bg-card)]' : 'border-[#FF453A]/20 bg-[var(--bg-card)]'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
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
        </div>
      )}
    </div>
  )
}
