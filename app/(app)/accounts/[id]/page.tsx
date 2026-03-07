'use client'
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Shield, TrendingUp, TrendingDown, Calendar,
  AlertTriangle, CheckCircle, XCircle, Target, Zap,
  Edit2, Clock, DollarSign, BarChart2
} from 'lucide-react'
import * as dl from '@/lib/data-layer'
import { useTrades } from '@/components/TradeContext'
import { PropAccount, DrawdownType } from '@/lib/types'
import { formatPnl } from '@/lib/calculations'
import Link from 'next/link'

function fmtDrawdownType(t: DrawdownType): string {
  const m: Record<DrawdownType, string> = {
    trailing: 'Trailing Drawdown',
    static_eod: 'Static EOD',
    static_intraday: 'Static Intraday',
    static: 'Static (Fixed)',
  }
  return m[t] ?? t
}

function RuleBar({
  label, used, limit, prefix = '$', invert = false, hideIfNull = false
}: {
  label: string
  used: number
  limit: number | null
  prefix?: string
  invert?: boolean
  hideIfNull?: boolean
}) {
  if (hideIfNull && (limit === null || limit === 0)) return null

  const pct = limit && limit > 0 ? Math.min(used / limit, 1) : 0

  const color = (() => {
    const v = invert ? pct : 1 - pct
    if (v < 0.2) return '#EF4444'
    if (v < 0.4) return '#F97316'
    if (v < 0.6) return '#F59E0B'
    return '#4ADE50'
  })()

  const trafficLight = (() => {
    const v = invert ? pct : 1 - pct
    if (v < 0.2) return 'danger'
    if (v < 0.5) return 'caution'
    return 'safe'
  })()

  const dotColor = { safe: 'bg-[#4ADE50]', caution: 'bg-amber-400', danger: 'bg-[#EF4444]' }[trafficLight]

  return (
    <div className="p-4 bg-[#F5F7FA] dark:bg-[#0d1117] rounded-xl border border-[#E4E9F0] dark:border-[#21262d]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-sm font-semibold text-[#1E2D3D] dark:text-[#e6edf3]">{label}</span>
        </div>
        <span className="text-xs font-mono font-semibold text-[#6B7E91] dark:text-[#8b949e]">
          {limit !== null
            ? `${prefix}${used.toFixed(0)} / ${prefix}${limit.toFixed(0)}`
            : 'No limit'
          }
        </span>
      </div>
      {limit !== null && limit > 0 && (
        <div className="h-2 rounded-full bg-[#E4E9F0] dark:bg-[#21262d] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct * 100}%`, backgroundColor: color }}
          />
        </div>
      )}
      {limit !== null && limit > 0 && (
        <div className="flex justify-between text-[11px] mt-1">
          <span className="text-[#6B7E91] dark:text-[#8b949e]">
            {(pct * 100).toFixed(0)}% used
          </span>
          {!invert && limit > 0 && (
            <span className="font-medium" style={{ color }}>
              {prefix}{(limit - used).toFixed(0)} remaining
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function AccountDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [account, setAccount] = useState<PropAccount | null>(null)
  const { trades: allTrades } = useTrades()

  useEffect(() => {
    async function load() {
      const a = await dl.getPropAccount(id)
      if (!a) router.push('/accounts')
      else setAccount(a)
    }
    load()
  }, [id, router])

  const trades = useMemo(
    () => allTrades.filter(t => t.accountId === id),
    [allTrades, id]
  )

  const totalPnl = useMemo(() => trades.reduce((s, t) => s + t.netPnl, 0), [trades])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayPnl = useMemo(
    () => trades.filter(t => t.sessionDate === todayStr).reduce((s, t) => s + t.netPnl, 0),
    [trades, todayStr]
  )

  const drawdownUsed = Math.max(0, -totalPnl)
  const daysTradedCount = useMemo(() => new Set(trades.map(t => t.sessionDate)).size, [trades])
  const recentTrades = useMemo(() => [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10), [trades])

  if (!account) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#4ADE50] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const profitPct = account.profitTarget && account.profitTarget > 0
    ? Math.max(0, totalPnl) / account.profitTarget
    : null

  const drawdownPct = account.maxLossLimit > 0 ? drawdownUsed / account.maxLossLimit : 0
  const isPassingTarget = profitPct !== null && profitPct >= 1
  const isInDanger = drawdownPct >= 0.8

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl border border-[#E4E9F0] dark:border-[#21262d] bg-white dark:bg-[#161b22] text-[#6B7E91] hover:text-[#1E2D3D] dark:hover:text-white hover:bg-[#F5F7FA] transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">{account.nickname || account.firmName}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              account.status === 'funded'
                ? 'bg-[#2D8B4E]/10 text-[#4ADE50]'
                : 'bg-amber-500/10 text-amber-500'
            }`}>
              {account.status === 'funded' ? 'Funded' : 'Evaluation'}
            </span>
            {isPassingTarget && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4ADE50]/10 text-[#4ADE50] flex items-center gap-1">
                <CheckCircle size={10} /> Target Reached!
              </span>
            )}
            {isInDanger && !isPassingTarget && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-[#EF4444] flex items-center gap-1">
                <AlertTriangle size={10} /> Danger Zone
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B7E91] dark:text-[#8b949e] mt-0.5">
            {account.firmName} · ${(account.startingBalance / 1000).toFixed(0)}K · {fmtDrawdownType(account.drawdownType)}
            {account.accountNumber && ` · ${account.accountNumber}`}
          </p>
        </div>
        <Link href={`/accounts/${id}/rules`} className="btn-secondary">
          <Shield size={14} />
          View Rules
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-[#6B7E91] dark:text-[#8b949e] font-medium uppercase tracking-wider mb-1">Net P&L</p>
          <p className={`text-2xl font-bold font-mono ${totalPnl >= 0 ? 'text-[#4ADE50]' : 'text-[#EF4444]'}`}>
            {formatPnl(totalPnl)}
          </p>
          <p className="text-xs text-[#6B7E91] dark:text-[#8b949e] mt-1">{trades.length} total trades</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-[#6B7E91] dark:text-[#8b949e] font-medium uppercase tracking-wider mb-1">Today</p>
          <p className={`text-2xl font-bold font-mono ${todayPnl >= 0 ? 'text-[#4ADE50]' : 'text-[#EF4444]'}`}>
            {formatPnl(todayPnl)}
          </p>
          <p className="text-xs text-[#6B7E91] dark:text-[#8b949e] mt-1">current session</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-[#6B7E91] dark:text-[#8b949e] font-medium uppercase tracking-wider mb-1">Days Traded</p>
          <p className="text-2xl font-bold text-[#1E2D3D] dark:text-[#e6edf3]">
            {daysTradedCount}
            {account.minTradingDays > 0 && (
              <span className="text-lg text-[#6B7E91]"> / {account.minTradingDays}</span>
            )}
          </p>
          <p className="text-xs text-[#6B7E91] dark:text-[#8b949e] mt-1">
            {account.minTradingDays > 0 ? `${account.minTradingDays} min required` : 'no minimum'}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-[#6B7E91] dark:text-[#8b949e] font-medium uppercase tracking-wider mb-1">
            {account.profitTarget ? 'To Target' : 'Drawdown Used'}
          </p>
          {account.profitTarget ? (
            <>
              <p className="text-2xl font-bold text-[#4ADE50]">
                {profitPct !== null ? `${(profitPct * 100).toFixed(0)}%` : '—'}
              </p>
              <p className="text-xs text-[#6B7E91] dark:text-[#8b949e] mt-1">
                {formatPnl(Math.max(0, totalPnl))} / ${account.profitTarget.toFixed(0)}
              </p>
            </>
          ) : (
            <>
              <p className={`text-2xl font-bold ${drawdownPct >= 0.8 ? 'text-[#EF4444]' : drawdownPct >= 0.5 ? 'text-amber-400' : 'text-[#1E2D3D] dark:text-[#e6edf3]'}`}>
                {(drawdownPct * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-[#6B7E91] dark:text-[#8b949e] mt-1">
                ${drawdownUsed.toFixed(0)} / ${account.maxLossLimit.toFixed(0)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Rules Health */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#2D8B4E]" />
            <h2 className="section-title">Account Health</h2>
          </div>
          <Link href={`/accounts/${id}/rules`} className="text-xs font-semibold text-[#2D8B4E] hover:text-[#4ADE50] transition-colors">
            Full rules →
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <RuleBar
            label="Max Drawdown"
            used={drawdownUsed}
            limit={account.maxLossLimit}
            invert
          />
          <RuleBar
            label="Daily Loss Limit"
            used={Math.max(0, -todayPnl)}
            limit={account.dailyLossLimit}
            invert
            hideIfNull
          />
          <RuleBar
            label="Profit Target"
            used={Math.max(0, totalPnl)}
            limit={account.profitTarget}
          />
          {account.minTradingDays > 0 && (
            <RuleBar
              label={`Min Trading Days (${daysTradedCount} / ${account.minTradingDays})`}
              used={daysTradedCount}
              limit={account.minTradingDays}
              prefix=""
            />
          )}
        </div>
        {account.consistencyRule && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5 flex items-center gap-1.5">
              <AlertTriangle size={11} /> Consistency Rule
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-300">{account.consistencyRule}</p>
          </div>
        )}
      </div>

      {/* Plan Details */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <DollarSign size={16} className="text-[#2D8B4E]" />
          Plan Details
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Account Size', value: `$${(account.startingBalance / 1000).toFixed(0)}K` },
            { label: 'Drawdown Type', value: fmtDrawdownType(account.drawdownType) },
            { label: 'Eval Cost', value: account.evalCost ? `$${account.evalCost}/mo` : account.activationFee ? `$${account.activationFee} activation` : 'N/A' },
            { label: 'Days to Payout', value: account.daysToPayout ? `${account.daysToPayout}d` : 'N/A' },
            { label: 'Max Funded Accts', value: account.maxFundedAccounts ? `${account.maxFundedAccounts}` : 'N/A' },
            { label: 'Reset Fee', value: account.resetFee ? `$${account.resetFee}` : 'N/A' },
            { label: 'Min Trading Days', value: account.minTradingDays > 0 ? `${account.minTradingDays} days` : 'None' },
            { label: 'Status', value: account.status === 'funded' ? 'Funded' : 'Evaluation' },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 bg-[#F5F7FA] dark:bg-[#0d1117] rounded-xl">
              <p className="text-[10px] text-[#6B7E91] dark:text-[#8b949e] font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm font-semibold text-[#1E2D3D] dark:text-[#e6edf3]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#F0F3F7] dark:border-[#21262d]">
          <h2 className="section-title flex items-center gap-2">
            <BarChart2 size={16} className="text-[#2D8B4E]" />
            Trade History
          </h2>
          <Link href="/trades" className="text-xs font-semibold text-[#2D8B4E] hover:text-[#4ADE50] transition-colors">
            View all →
          </Link>
        </div>
        {recentTrades.length === 0 ? (
          <div className="p-12 text-center text-[#9EB0C0] dark:text-[#6e7681]">
            <p className="font-medium mb-1">No trades for this account</p>
            <p className="text-xs">Import trades and link them to this account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full trade-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Net P&L</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map(t => (
                  <tr key={t.id}>
                    <td className="text-[#6B7E91] dark:text-[#8b949e]">{t.date}</td>
                    <td><span className="font-mono font-bold text-xs bg-[#F5F7FA] dark:bg-[#0d1117] px-2 py-0.5 rounded-lg">{t.symbol}</span></td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.side === 'Long' ? 'bg-green-50 text-[#2D8B4E]' : 'bg-orange-50 text-orange-600'}`}>
                        {t.side}
                      </span>
                    </td>
                    <td className="font-mono">{t.contracts}</td>
                    <td className="font-mono">{t.entryPrice.toFixed(2)}</td>
                    <td className="font-mono">{t.exitPrice.toFixed(2)}</td>
                    <td className={`font-mono font-bold ${t.netPnl >= 0 ? 'text-[#4ADE50]' : 'text-[#EF4444]'}`}>
                      {formatPnl(t.netPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
