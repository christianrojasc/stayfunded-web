'use client'
import { formatAccountNumber } from '@/lib/utils'
import { useState, useMemo, Fragment } from 'react'
import dynamic from 'next/dynamic'
import {
  Plus, Search, TrendingUp, TrendingDown,
  ChevronUp, ChevronDown, X, Upload, Briefcase, BarChart2
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
    <div className="flex items-center justify-center h-[232px] text-[#475569] text-xs">
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
  }, [trades, search, filterSide, filterSymbol, sortKey, sortDir])

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

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Trade Log</h1>
          <p className="text-sm text-[#6B7E91] dark:text-[#94A3B8] mt-0.5">
            {filtered.length} trades · {wins}W {filtered.length - wins}L · Net {' '}
            <span className={totalPnl >= 0 ? 'text-[#2D8B4E] font-semibold' : 'text-[#EF4444] font-semibold'}>
              {formatPnl(totalPnl)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AccountSelector />
          <button className="btn-secondary" onClick={() => router.push('/import')}>
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
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9EB0C0] dark:text-[#64748B]" />
            <input
              className="input-field pl-9 pr-4"
              placeholder="Search symbol, setup, notes..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9EB0C0] dark:text-[#64748B] hover:text-[#1E2D3D] dark:text-[#F1F5F9]">
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
                  ['netPnl', 'Net P&L'],
                  [null, 'Fees'],
                  [null, 'Account'],
                ] as [SortKey | null, string][]).map(([key, label]) => (
                  <th
                    key={label}
                    onClick={key ? () => toggleSort(key) : undefined}
                    className={key ? 'cursor-pointer hover:bg-[#EEEEF5] select-none' : ''}
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
                  <td colSpan={11} className="text-center py-12 text-[#9EB0C0] dark:text-[#64748B]">
                    {trades.length === 0 ? (
                      <div className="space-y-2">
                        <p className="font-medium">No trades yet</p>
                        <p className="text-xs">Click "Log Trade" to add your first trade, or import from CSV</p>
                      </div>
                    ) : 'No trades match your filters'}
                  </td>
                </tr>
              ) : paginated.map(t => (
                <Fragment key={t.id}>
                  {/* ── Main trade row ── */}
                  <tr
                    className="cursor-pointer hover:bg-[#F5F7FA] dark:hover:bg-[#0F172A]/60 transition-colors"
                    onClick={() => setDrawerTrade(t)}
                  >
                    <td className="text-[#6B7E91] dark:text-[#94A3B8] font-medium">{t.date}</td>
                    <td>
                      <span className="font-mono font-bold text-xs bg-[#F5F7FA] dark:bg-[#0F172A] px-2 py-0.5 rounded-lg text-[#1E2D3D] dark:text-[#F1F5F9]">{t.symbol}</span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        t.side === 'Long' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {t.side === 'Long' ? <TrendingUp className="inline w-3 h-3 mr-0.5" /> : <TrendingDown className="inline w-3 h-3 mr-0.5" />}
                        {t.side}
                      </span>
                    </td>
                    <td className="font-mono font-semibold">{t.contracts}</td>
                    <td className="font-mono text-[#1E2D3D] dark:text-[#F1F5F9]">{t.entryPrice.toFixed(2)}</td>
                    <td className="font-mono text-[#1E2D3D] dark:text-[#F1F5F9]">{t.exitPrice.toFixed(2)}</td>
                    <td>
                      {t.setup ? (
                        <span className="text-xs text-[#6B7E91] dark:text-[#94A3B8] bg-[#F5F7FA] dark:bg-[#0F172A] px-2 py-0.5 rounded-lg">{t.setup}</span>
                      ) : <span className="text-[#C8D4E0]">—</span>}
                    </td>
                    <td>
                      <span className={`font-mono font-bold text-sm ${t.netPnl >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
                        {formatPnl(t.netPnl)}
                      </span>
                    </td>
                    <td className="font-mono text-[#9EB0C0] dark:text-[#64748B] text-xs">${t.fees.toFixed(2)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      {t.accountId ? (() => {
                        const acct = accounts.find(a => a.id === t.accountId)
                        return acct ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#2D8B4E]/10 text-[#4ADE50] flex items-center gap-1 w-fit">
                            <Briefcase size={9} />
                            {formatAccountNumber(acct.accountNumber) || acct.nickname?.slice(0,10) || acct.firmName.slice(0,10)}
                          </span>
                        ) : null
                      })() : <span className="text-[#C8D4E0] dark:text-[#30363d] text-xs">—</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleChart(t.id, e)}
                          title="Toggle chart"
                          className={`p-1.5 rounded-lg transition-colors ${
                            expandedId === t.id
                              ? 'bg-[#2D8B4E]/20 text-[#4ADE50]'
                              : 'text-[#9EB0C0] dark:text-[#64748B] hover:text-[#2D8B4E] hover:bg-green-50 dark:hover:bg-[#0F172A]'
                          }`}
                        >
                          <BarChart2 size={14} />
                        </button>
                        <button
                          onClick={() => setDrawerTrade(t)}
                          className="text-xs text-[#9EB0C0] dark:text-[#64748B] hover:text-[#2D8B4E] font-medium transition-colors px-2 py-1 rounded-lg hover:bg-green-50"
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
                        className="bg-[#0B1628] border-b border-[#1E293B]/60"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F0F3F7] text-xs text-[#9EB0C0] dark:text-[#64748B]">
            <span>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-[#E4E9F0] dark:border-[#1E293B] disabled:opacity-40 hover:bg-[#F5F7FA] dark:bg-[#0F172A] transition-colors"
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
                      p === page ? 'border-[#2D8B4E] text-[#2D8B4E] bg-green-50' : 'border-[#E4E9F0] dark:border-[#1E293B] hover:bg-[#F5F7FA] dark:bg-[#0F172A]'
                    }`}
                  >{p}</button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#E4E9F0] dark:border-[#1E293B] disabled:opacity-40 hover:bg-[#F5F7FA] dark:bg-[#0F172A] transition-colors"
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
