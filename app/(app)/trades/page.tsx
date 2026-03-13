'use client'
import { formatAccountNumber } from '@/lib/utils'
import { useState, useMemo, Fragment } from 'react'
import dynamic from 'next/dynamic'
import {
  Plus, Search, TrendingUp, TrendingDown, ListOrdered,
  ChevronUp, ChevronDown, X, Upload, Briefcase, BarChart2,
  Zap, Clock, Target, AlertTriangle, ArrowUpRight, ArrowDownRight, Trophy, Skull
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTrades } from '@/components/TradeContext'
import { useAccountFilter } from '@/components/AccountFilterContext'
import AccountSelector from '@/components/AccountSelector'
import { formatPnl } from '@/lib/calculations'
import TradeModal from '@/components/TradeModal'
import TradeDetailDrawer from '@/components/TradeDetailDrawer'
import { Trade } from '@/lib/types'

// Dynamically import the chart so it never runs during SSR (needs window/DOM)
const TradeChartDynamic = dynamic(() => import('@/components/TradeChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[232px] text-[var(--text-muted)] text-xs">
      Loading chart…
    </div>
  ),
})

type SortKey = 'date' | 'symbol' | 'side' | 'netPnl' | 'contracts' | 'setup'
type SortDir = 'asc' | 'desc'

export default function TradesPage() {
  const router = useRouter()
  const { trades, addTrade, updateTrade, removeTrade } = useTrades()
  const { selectedId, selected: selectedAccount, accounts } = useAccountFilter()
  const [modal, setModal] = useState<{ open: boolean; trade?: Trade | null }>({ open: false })
  const [search, setSearch] = useState('')
  const [filterSide, setFilterSide] = useState('')
  const [filterSymbol, setFilterSymbol] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [drawerTrade, setDrawerTrade] = useState<Trade | null>(null)

  const toggleChart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedId(prev => (prev === id ? null : id))
  }
  const PER_PAGE = 25

  // Filter by selected prop account
  const accountFilteredTrades = useMemo(
    () => selectedId ? trades.filter(t => t.accountId === selectedId) : trades,
    [trades, selectedId]
  )

  const symbols = useMemo(() => [...new Set(accountFilteredTrades.map(t => t.symbol))].sort(), [accountFilteredTrades])

  const filtered = useMemo(() => {
    let t = [...accountFilteredTrades]
    if (search) {
      const s = search.toLowerCase()
      t = t.filter(tr =>
        tr.symbol.toLowerCase().includes(s) ||
        tr.setup?.toLowerCase().includes(s) ||
        tr.notes?.toLowerCase().includes(s) ||
        tr.date.includes(s)
      )
    }
    if (filterSide) t = t.filter(tr => tr.side === filterSide)
    if (filterSymbol) t = t.filter(tr => tr.symbol === filterSymbol)
    t.sort((a, b) => {
      let va: any = a[sortKey as keyof Trade], vb: any = b[sortKey as keyof Trade]
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return t
  }, [accountFilteredTrades, search, filterSide, filterSymbol, sortKey, sortDir])

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => (
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp size={12} className="text-[#2D8B4E]" />
                          : <ChevronDown size={12} className="text-[#2D8B4E]" />
      : <ChevronDown size={12} className="opacity-30" />
  )

  // Summary stats
  const wins = filtered.filter(t => t.netPnl > 0).length
  const totalPnl = filtered.reduce((s, t) => s + t.netPnl, 0)

  // ── Trade Insights ──
  const tradeInsights = useMemo(() => {
    const closed = filtered.filter(t => t.status === 'closed')
    if (closed.length < 2) return null

    const winTrades = closed.filter(t => t.netPnl > 0)
    const lossTrades = closed.filter(t => t.netPnl < 0)
    const avgWin = winTrades.length > 0 ? winTrades.reduce((s, t) => s + t.netPnl, 0) / winTrades.length : 0
    const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((s, t) => s + t.netPnl, 0) / lossTrades.length) : 0

    // Best and worst trade
    const best = closed.reduce((b, t) => t.netPnl > b.netPnl ? t : b, closed[0])
    const worst = closed.reduce((w, t) => t.netPnl < w.netPnl ? t : w, closed[0])

    // Avg duration
    const durations = closed.map(t => {
      if (!t.entryTime || !t.exitTime) return null
      const [eh, em] = t.entryTime.split(':').map(Number)
      const [xh, xm] = t.exitTime.split(':').map(Number)
      let mins = (xh * 60 + xm) - (eh * 60 + em)
      if (mins < 0) mins += 24 * 60
      return mins
    }).filter((d): d is number => d !== null)
    const avgDuration = durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0

    // Duration of winners vs losers
    const winDurations = closed.filter(t => t.netPnl > 0).map(t => {
      if (!t.entryTime || !t.exitTime) return null
      const [eh, em] = t.entryTime.split(':').map(Number)
      const [xh, xm] = t.exitTime.split(':').map(Number)
      let mins = (xh * 60 + xm) - (eh * 60 + em)
      if (mins < 0) mins += 24 * 60
      return mins
    }).filter((d): d is number => d !== null)
    const lossDurations = closed.filter(t => t.netPnl < 0).map(t => {
      if (!t.entryTime || !t.exitTime) return null
      const [eh, em] = t.entryTime.split(':').map(Number)
      const [xh, xm] = t.exitTime.split(':').map(Number)
      let mins = (xh * 60 + xm) - (eh * 60 + em)
      if (mins < 0) mins += 24 * 60
      return mins
    }).filter((d): d is number => d !== null)
    const avgWinDuration = winDurations.length > 0 ? winDurations.reduce((s, d) => s + d, 0) / winDurations.length : 0
    const avgLossDuration = lossDurations.length > 0 ? lossDurations.reduce((s, d) => s + d, 0) / lossDurations.length : 0

    // Points captured per trade (how much of the move)
    const pointsMoves = closed.map(t => {
      const pointsCaptured = Math.abs(t.exitPrice - t.entryPrice)
      return { trade: t, pointsCaptured }
    })
    const avgPoints = pointsMoves.length > 0 ? pointsMoves.reduce((s, p) => s + p.pointsCaptured, 0) / pointsMoves.length : 0

    // Current streak
    let currentStreak = 0
    let streakType: 'win' | 'loss' | null = null
    for (let i = closed.length - 1; i >= 0; i--) {
      const isWin = closed[i].netPnl > 0
      if (streakType === null) {
        streakType = isWin ? 'win' : 'loss'
        currentStreak = 1
      } else if ((isWin && streakType === 'win') || (!isWin && streakType === 'loss')) {
        currentStreak++
      } else break
    }

    // Largest winner that was followed by a loss (left on table / got greedy)
    const bigWinsFollowedByLoss: { win: Trade; loss: Trade }[] = []
    for (let i = 0; i < closed.length - 1; i++) {
      if (closed[i].netPnl > avgWin * 1.5 && closed[i + 1].netPnl < 0) {
        bigWinsFollowedByLoss.push({ win: closed[i], loss: closed[i + 1] })
      }
    }

    // Quick insights text
    const quickInsights: { text: string; type: 'positive' | 'warning' | 'neutral'; icon: string }[] = []

    if (avgWinDuration > 0 && avgLossDuration > 0) {
      if (avgLossDuration > avgWinDuration * 1.5) {
        quickInsights.push({ text: `You hold losers ${(avgLossDuration / avgWinDuration).toFixed(1)}x longer than winners (${Math.round(avgLossDuration)}m vs ${Math.round(avgWinDuration)}m). Cut losses faster.`, type: 'warning', icon: 'clock' })
      } else if (avgWinDuration > avgLossDuration * 1.3) {
        quickInsights.push({ text: `You let winners run ${(avgWinDuration / avgLossDuration).toFixed(1)}x longer than losers (${Math.round(avgWinDuration)}m vs ${Math.round(avgLossDuration)}m). Good discipline.`, type: 'positive', icon: 'clock' })
      }
    }

    if (bigWinsFollowedByLoss.length >= 2) {
      const totalGivenBack = bigWinsFollowedByLoss.reduce((s, p) => s + Math.abs(p.loss.netPnl), 0)
      quickInsights.push({ text: `${bigWinsFollowedByLoss.length} times you gave back $${totalGivenBack.toFixed(0)} by trading immediately after a big win. Consider stopping after large wins.`, type: 'warning', icon: 'alert' })
    }

    if (avgLoss > 0 && avgWin / avgLoss < 1) {
      quickInsights.push({ text: `Your avg win ($${avgWin.toFixed(0)}) is smaller than your avg loss ($${avgLoss.toFixed(0)}). You need ${(avgLoss / avgWin).toFixed(1)} wins per loss to break even.`, type: 'warning', icon: 'target' })
    } else if (avgLoss > 0 && avgWin / avgLoss >= 2) {
      quickInsights.push({ text: `Your avg win is ${(avgWin / avgLoss).toFixed(1)}x your avg loss. Strong edge — keep this ratio.`, type: 'positive', icon: 'target' })
    }

    return {
      avgWin, avgLoss, best, worst, avgDuration,
      avgWinDuration, avgLossDuration, avgPoints,
      currentStreak, streakType,
      quickInsights,
    }
  }, [filtered])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Trade Log</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {filtered.length} trades · {wins}W {filtered.length - wins}L · Net {' '}
            <span className={totalPnl >= 0 ? 'text-[#2D8B4E] font-semibold' : 'text-[#EF4444] font-semibold'}>
              {formatPnl(totalPnl)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <AccountSelector />
          <button className="btn-secondary" onClick={() => router.push("/import")}>
            <Upload size={16} />
            Import CSV
          </button>
          <button className="btn-primary" onClick={() => setModal({ open: true, trade: null })}>
            <Plus size={16} />
            Log Trade
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              className="input-field pl-9 pr-4"
              placeholder="Search symbol, setup, notes..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="input-field w-36"
            value={filterSide}
            onChange={e => { setFilterSide(e.target.value); setPage(1) }}
          >
            <option value="">All Sides</option>
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>

          <select
            className="input-field w-36"
            value={filterSymbol}
            onChange={e => { setFilterSymbol(e.target.value); setPage(1) }}
          >
            <option value="">All Symbols</option>
            {symbols.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {(filterSide || filterSymbol || search) && (
            <button
              onClick={() => { setSearch(''); setFilterSide(''); setFilterSymbol(''); setPage(1) }}
              className="btn-secondary text-xs"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Trade Insights Strip ── */}
      {tradeInsights && (
        <div className="space-y-3">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <MiniStat label="Avg Win" value={`+$${tradeInsights.avgWin.toFixed(0)}`} color="green" icon={ArrowUpRight} />
            <MiniStat label="Avg Loss" value={`-$${tradeInsights.avgLoss.toFixed(0)}`} color="red" icon={ArrowDownRight} />
            <MiniStat label="Best Trade" value={`+$${tradeInsights.best.netPnl.toFixed(0)}`} sub={tradeInsights.best.symbol} color="green" icon={Trophy} />
            <MiniStat label="Worst Trade" value={`-$${Math.abs(tradeInsights.worst.netPnl).toFixed(0)}`} sub={tradeInsights.worst.symbol} color="red" icon={Skull} />
            <MiniStat label="Avg Duration" value={tradeInsights.avgDuration >= 60 ? `${Math.floor(tradeInsights.avgDuration / 60)}h ${Math.round(tradeInsights.avgDuration % 60)}m` : `${Math.round(tradeInsights.avgDuration)}m`} color="neutral" icon={Clock} />
            <MiniStat label="Avg Points" value={tradeInsights.avgPoints.toFixed(2)} color="neutral" icon={Target} />
            <MiniStat
              label="Streak"
              value={`${tradeInsights.currentStreak} ${tradeInsights.streakType === 'win' ? 'W' : 'L'}`}
              color={tradeInsights.streakType === 'win' ? 'green' : 'red'}
              icon={tradeInsights.streakType === 'win' ? TrendingUp : TrendingDown}
            />
          </div>

          {/* Quick Insights */}
          {tradeInsights.quickInsights.length > 0 && (
            <div className="flex flex-col gap-2">
              {tradeInsights.quickInsights.map((qi, i) => (
                <div key={i} className={`glass-card px-4 py-3 flex items-start gap-3`}
                  style={{ borderLeft: `3px solid ${qi.type === 'positive' ? '#4ADE80' : qi.type === 'warning' ? '#F59E0B' : 'var(--border)'}` }}>
                  {qi.icon === 'clock' && <Clock size={14} className="mt-0.5 flex-shrink-0" style={{ color: qi.type === 'positive' ? '#4ADE80' : '#F59E0B' }} />}
                  {qi.icon === 'alert' && <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#F59E0B' }} />}
                  {qi.icon === 'target' && <Target size={14} className="mt-0.5 flex-shrink-0" style={{ color: qi.type === 'positive' ? '#4ADE80' : '#F59E0B' }} />}
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{qi.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full trade-table">
            <thead>
              <tr>
                {([
                  ['date', 'Date'],
                  ['symbol', 'Symbol'],
                  ['side', 'Side'],
                  ['contracts', 'Qty'],
                  [null, 'Entry'],
                  [null, 'Exit'],
                  ['setup', 'Setup'],
                  [null, 'Duration'],
                  ['netPnl', 'Net P&L'],
                  [null, 'Fees'],
                  [null, 'Account'],
                ] as [SortKey | null, string][]).map(([key, label]) => (
                  <th
                    key={label}
                    onClick={key ? () => toggleSort(key) : undefined}
                    className={key ? 'cursor-pointer hover:bg-[var(--border)] select-none' : ''}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {key && <SortIcon k={key} />}
                    </div>
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-[var(--text-secondary)]">
                    {trades.length === 0 ? (
                      <div className="flex flex-col items-center gap-3"><ListOrdered size={32} className="text-[var(--text-secondary)] opacity-40" /><p className="font-medium text-[var(--text-secondary)]">No trades yet</p><p className="text-xs text-[var(--text-secondary)]">Click &quot;Log Trade&quot; to add your first trade, or import from CSV</p></div>
                    ) : 'No trades match your filters'}
                  </td>
                </tr>
              ) : paginated.map(t => (
                <Fragment key={t.id}>
                  {/* ── Main trade row ── */}
                  <tr
                    className="cursor-pointer hover:bg-[var(--bg-card)] transition-colors"
                    onClick={() => setDrawerTrade(t)}
                  >
                    <td className="text-[var(--text-muted)] font-medium">{t.date}</td>
                    <td>
                      <span className="font-mono font-bold text-xs bg-[var(--bg-secondary)] px-2 py-0.5 rounded-lg text-[var(--text-primary)]">{t.symbol}</span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        t.side === 'Long' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {t.side === 'Long' ? <TrendingUp className="w-3 h-3 flex-shrink-0" /> : <TrendingDown className="w-3 h-3 flex-shrink-0" />}
                        {t.side}
                      </span>
                    </td>
                    <td className="font-mono font-semibold">{t.contracts}</td>
                    <td className="font-mono text-[var(--text-primary)]">{t.entryPrice.toFixed(2)}</td>
                    <td className="font-mono text-[var(--text-primary)]">{t.exitPrice.toFixed(2)}</td>
                    <td>
                      {t.setup ? (
                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-lg">{t.setup}</span>
                      ) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="font-mono text-xs text-[var(--text-secondary)]">
                      {(() => {
                        if (!t.entryTime || !t.exitTime) return '—'
                        const [eh, em] = t.entryTime.split(':').map(Number)
                        const [xh, xm] = t.exitTime.split(':').map(Number)
                        let mins = (xh * 60 + xm) - (eh * 60 + em)
                        if (mins < 0) mins += 24 * 60
                        if (mins >= 60) {
                          const h = Math.floor(mins / 60)
                          const m = mins % 60
                          return m > 0 ? `${h}h ${m}m` : `${h}h`
                        }
                        return `${mins}m`
                      })()}
                    </td>
                    <td>
                      <span className={`font-mono font-bold text-sm ${t.netPnl >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
                        {formatPnl(t.netPnl)}
                      </span>
                    </td>
                    <td className="font-mono text-[var(--text-secondary)] text-xs">${t.fees.toFixed(2)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      {t.accountId ? (() => {
                        const acct = accounts.find(a => a.id === t.accountId)
                        return acct ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#2D8B4E]/10 text-[#4ADE50] flex items-center gap-1 w-fit">
                            <Briefcase size={9} />
                            {formatAccountNumber(acct.accountNumber) || acct.nickname?.slice(0,10) || acct.firmName.slice(0,10)}
                          </span>
                        ) : null
                      })() : <span className="text-[var(--text-muted)] text-xs">—</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleChart(t.id, e)}
                          title="Toggle chart"
                          className={`p-1.5 rounded-lg transition-colors ${
                            expandedId === t.id
                              ? 'bg-[#2D8B4E]/20 text-[#4ADE50]'
                              : 'text-[var(--text-secondary)] hover:text-[#2D8B4E] hover:bg-[var(--bg-secondary)]'
                          }`}
                        >
                          <BarChart2 size={14} />
                        </button>
                        <button
                          onClick={() => setDrawerTrade(t)}
                          className="text-xs text-[var(--text-secondary)] hover:text-[#2D8B4E] font-medium transition-colors px-2 py-1 rounded-lg hover:bg-[var(--bg-secondary)]"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Chart expansion row ── */}
                  <tr>
                    <td colSpan={11} style={{ padding: 0, border: 'none' }}>
                      <div
                        style={{
                          maxHeight: expandedId === t.id ? '360px' : '0px',
                          overflow: 'hidden',
                          transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        className="bg-[var(--bg-secondary)] border-b border-[var(--border)]/60"
                      >
                        {expandedId === t.id && <TradeChartDynamic trade={t} />}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
            <span>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--border)] transition-colors"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      p === page ? 'border-[#4ADE80] text-[#4ADE80] bg-[#4ADE80]/10' : 'border-[var(--border)] hover:bg-[var(--border)]'
                    }`}
                  >{p}</button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--border)] transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {modal.open && (
        <TradeModal
          trade={modal.trade}
          onSave={addTrade}
          onUpdate={updateTrade}
          onDelete={removeTrade}
          onClose={() => setModal({ open: false })}
        />
      )}

      {drawerTrade && (
        <TradeDetailDrawer
          trade={drawerTrade}
          onClose={() => setDrawerTrade(null)}
        />
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MiniStat({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub?: string; color: 'green' | 'red' | 'neutral'; icon: any }) {
  const textColor = color === 'green' ? 'text-[#4ADE80]' : color === 'red' ? 'text-[#FF453A]' : 'text-[var(--text-primary)]'
  const iconColor = color === 'green' ? '#4ADE80' : color === 'red' ? '#FF453A' : 'var(--text-muted)'
  return (
    <div className="glass-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color: iconColor }} />
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-base font-bold ${textColor}`}>{value}</span>
        {sub && <span className="text-[10px] font-mono text-[var(--text-muted)]">{sub}</span>}
      </div>
    </div>
  )
}
