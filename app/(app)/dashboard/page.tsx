'use client'
import { useMemo, useEffect } from 'react'
import {
  DollarSign, TrendingUp, Target, Scale, Award, Flame,
  BarChart2, ArrowUpRight, Activity, Moon, Sun, Shield,
  AlertTriangle, CheckCircle
} from 'lucide-react'
import { useTrades } from '@/components/TradeContext'
import { useSubscription } from '@/hooks/useSubscription'
import { useState } from 'react'
import UpgradeModal from '@/components/UpgradeModal'
import { Sparkles, X } from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'
import { useAccountFilter } from '@/components/AccountFilterContext'
import { calcDailyStats, calcCumulativePnl, calcDrawdown, calcAnalytics, formatCurrency, formatPnl, calcDailyGrade } from '@/lib/calculations'
import KPICard from '@/components/KPICard'
import CumPnlChart from '@/components/charts/CumPnlChart'
import DailyPnlChart from '@/components/charts/DailyPnlChart'
import DrawdownChart from '@/components/charts/DrawdownChart'
import SessionClock from '@/components/SessionClock'
import SessionAlert from '@/components/SessionAlert'
import AccountSelector from '@/components/AccountSelector'
import TradingGrowthCurve from '@/components/TradingGrowthCurve'
import { format } from 'date-fns'
import Link from 'next/link'

function AccountHealthCard() {
  const { selected, accounts } = useAccountFilter()
  const { trades } = useTrades()

  const accountTrades = useMemo(
    () => selected ? trades.filter(t => t.accountId === selected.id) : trades,
    [trades, selected]
  )

  const totalPnl = useMemo(() => accountTrades.reduce((s, t) => s + t.netPnl, 0), [accountTrades])

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayPnl = useMemo(
    () => accountTrades.filter(t => t.sessionDate === todayStr).reduce((s, t) => s + t.netPnl, 0),
    [accountTrades, todayStr]
  )

  if (!selected) return null

  const drawdownUsed = Math.max(0, -totalPnl)
  const dailyLossUsed = Math.max(0, -todayPnl)
  const daysTradedCount = new Set(accountTrades.map(t => t.sessionDate)).size

  const drawdownPct = selected.maxLossLimit > 0 ? drawdownUsed / selected.maxLossLimit : 0
  const dailyPct = selected.dailyLossLimit && selected.dailyLossLimit > 0
    ? dailyLossUsed / selected.dailyLossLimit : null
  const profitPct = selected.profitTarget && selected.profitTarget > 0
    ? Math.max(0, totalPnl) / selected.profitTarget : null

  const barColor = (pct: number, inv = false) => {
    const v = inv ? pct : 1 - pct
    if (v < 0.2) return '#FF453A'
    if (v < 0.4) return '#F97316'
    if (v < 0.6) return '#F59E0B'
    return '#4ADE50'
  }

  const isInDanger = drawdownPct >= 0.8 || (dailyPct !== null && dailyPct >= 0.8)
  const isPassing = profitPct !== null && profitPct >= 1

  return (
    <div className={`glass-card p-5 border-l-4 ${
      isPassing ? 'border-l-[#4ADE50]' : isInDanger ? 'border-l-[#FF453A]' : 'border-l-[#2D8B4E]'
    }`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#4ADE80]" />
          <h2 className="section-title">Account Health — {selected.nickname || selected.firmName}</h2>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            selected.status === 'funded'
              ? 'bg-[#2D8B4E]/10 text-[#4ADE50]'
              : 'bg-amber-500/10 text-amber-500'
          }`}>
            {selected.status === 'funded' ? 'Funded' : 'Evaluation'}
          </span>
          {isPassing && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4ADE50]/10 text-[#4ADE50] flex items-center gap-1">
              <CheckCircle size={9} /> Target Reached!
            </span>
          )}
          {isInDanger && !isPassing && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-[#FF453A] flex items-center gap-1">
              <AlertTriangle size={9} /> Danger Zone
            </span>
          )}
        </div>
        <Link href={`/accounts/${selected.id}/rules`} className="text-xs font-semibold text-[#4ADE80] hover:text-[#4ADE50] transition-colors">
          View Rules →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Max Drawdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[rgba(255,255,255,0.45)] font-medium">Max Drawdown</span>
            <span className="font-mono font-semibold" style={{ color: barColor(drawdownPct, true) }}>
              ${drawdownUsed.toFixed(0)} / ${selected.maxLossLimit.toFixed(0)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(drawdownPct * 100, 100)}%`, backgroundColor: barColor(drawdownPct, true) }} />
          </div>
          <p className="text-[11px]" style={{ color: barColor(drawdownPct, true) }}>
            ${(selected.maxLossLimit - drawdownUsed).toFixed(0)} remaining
          </p>
        </div>

        {/* Daily Loss */}
        {selected.dailyLossLimit !== null && selected.dailyLossLimit > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[rgba(255,255,255,0.45)] font-medium">Daily Loss</span>
              <span className="font-mono font-semibold" style={{ color: dailyPct !== null ? barColor(dailyPct, true) : '#6B7E91' }}>
                ${dailyLossUsed.toFixed(0)} / ${selected.dailyLossLimit.toFixed(0)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((dailyPct || 0) * 100, 100)}%`,
                  backgroundColor: dailyPct !== null ? barColor(dailyPct, true) : '#6B7E91'
                }} />
            </div>
            <p className="text-[11px] text-[rgba(255,255,255,0.45)]">
              {dailyPct !== null ? `${(dailyPct * 100).toFixed(0)}% used today` : '—'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 flex flex-col justify-center">
            <p className="text-xs font-medium text-[rgba(255,255,255,0.45)]">Daily Loss</p>
            <p className="text-sm font-semibold text-[#4ADE50]">No limit</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.45)]">This firm has no daily loss rule</p>
          </div>
        )}

        {/* Profit Target */}
        {selected.profitTarget !== null && selected.profitTarget > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[rgba(255,255,255,0.45)] font-medium">Profit Target</span>
              <span className="font-mono font-semibold text-[#4ADE50]">
                {profitPct !== null ? `${(profitPct * 100).toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500 bg-[#4ADE50]"
                style={{ width: `${Math.min((profitPct || 0) * 100, 100)}%` }} />
            </div>
            <p className="text-[11px] text-[rgba(255,255,255,0.45)]">
              ${Math.max(0, totalPnl).toFixed(0)} / ${selected.profitTarget.toFixed(0)} goal
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 flex flex-col justify-center">
            <p className="text-xs font-medium text-[rgba(255,255,255,0.45)]">Profit Target</p>
            <p className="text-sm font-semibold text-[rgba(255,255,255,0.9)]">Funded</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.45)]">No profit target required</p>
          </div>
        )}

        {/* Days Traded */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[rgba(255,255,255,0.45)] font-medium">Days Traded</span>
            <span className="font-mono font-semibold text-[rgba(255,255,255,0.9)]">
              {daysTradedCount}
              {selected.minTradingDays > 0 && ` / ${selected.minTradingDays}`}
            </span>
          </div>
          {selected.minTradingDays > 0 ? (
            <>
              <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500 bg-[#4ADE50]"
                  style={{ width: `${Math.min((daysTradedCount / selected.minTradingDays) * 100, 100)}%` }} />
              </div>
              <p className="text-[11px] text-[rgba(255,255,255,0.45)]">
                {Math.max(0, selected.minTradingDays - daysTradedCount)} more days needed
              </p>
            </>
          ) : (
            <>
              <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)]" />
              <p className="text-[11px] text-[rgba(255,255,255,0.45)]">No minimum required</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function WeeklyGradeCard() {
  const [grade, setGrade] = useState<{ grade: string; color: string } | null>(null)

  useEffect(() => {
    try {
      const rulesRaw = localStorage.getItem('sf_rules')
      if (!rulesRaw) return
      const rules = JSON.parse(rulesRaw) as { id: string }[]
      if (rules.length === 0) return

      const today = new Date()
      let totalPct = 0
      let daysWithData = 0

      for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const raw = localStorage.getItem(`sf_journal_rules_${dateStr}`)
        if (!raw) continue
        const compliance = JSON.parse(raw) as Record<string, boolean>
        if (Object.keys(compliance).length === 0) continue
        const followed = rules.filter(r => compliance[r.id] === true).length
        totalPct += (followed / rules.length) * 100
        daysWithData++
      }

      if (daysWithData > 0) {
        setGrade(calcDailyGrade(totalPct / daysWithData))
      }
    } catch { /* empty */ }
  }, [])

  if (!grade) return null

  return (
    <Link href="/journal" className="glass-card p-4 flex items-center gap-3 hover:bg-white/[0.05] transition-all cursor-pointer">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${grade.color}15` }}>
        <span className="text-lg font-black" style={{ color: grade.color }}>{grade.grade}</span>
      </div>
      <div>
        <p className="text-xs text-[rgba(255,255,255,0.45)]">Weekly Grade</p>
        <p className="text-sm font-bold" style={{ color: grade.color }}>{grade.grade}</p>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { trades, loaded } = useTrades()
  const { theme, toggle: toggleTheme } = useTheme()
  const { selectedId, accounts } = useAccountFilter()
  const { isPro } = useSubscription()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const filteredTrades = useMemo(
    () => selectedId ? trades.filter(t => t.accountId === selectedId) : trades,
    [trades, selectedId]
  )

  const { daily, cumulative, drawdown, analytics, recentTrades } = useMemo(() => {
    const d = calcDailyStats(filteredTrades)
    return {
      daily: d,
      cumulative: calcCumulativePnl(d),
      drawdown: calcDrawdown(d),
      analytics: calcAnalytics(filteredTrades),
      recentTrades: [...filteredTrades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    }
  }, [filteredTrades])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#4ADE50] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const today = format(new Date(), 'EEEE, MMMM d')
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayStats = daily.find(d => d.date === todayStr)

  return (
    <div className="space-y-6 animate-fade-in">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      {/* Upgrade banner */}
      {!isPro && !bannerDismissed && (
        <div className="relative flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-[#4ADE80]/15" style={{background:'linear-gradient(135deg, rgba(74,222,128,0.06) 0%, rgba(34,197,94,0.03) 100%)'}}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#4ADE80]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">You're on the Free plan</p>
              <p className="text-xs text-[#64748B] mt-0.5">Unlock unlimited accounts, charts, reports and AI insights.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => setUpgradeOpen(true)} className="px-5 py-2 rounded-2xl bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap">
              Upgrade to Pro
            </button>
            <button onClick={() => setBannerDismissed(true)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#64748B] hover:text-white hover:bg-white/10 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-sm text-[rgba(255,255,255,0.45)]">{today}</p>
            <span className="text-[rgba(255,255,255,0.15)]">·</span>
            <SessionClock />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AccountSelector />
          {todayStats && (
            <div className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
              todayStats.netPnl >= 0
                ? 'bg-[rgba(74,222,128,0.1)] text-[#4ADE80] border-[rgba(74,222,128,0.15)]'
                : 'bg-[rgba(255,69,58,0.1)] text-[#FF453A]  border-red-100 '
            }`}>
              Today: {formatPnl(todayStats.netPnl)}
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-[#E4E9F0]  bg-white dark:bg-[#161b22] text-[#6B7E91] hover:text-[#1E2D3D] dark:hover:text-white hover:bg-[#F5F7FA] dark:hover:bg-[#1c2129] transition-all"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <Link href="/trades" className="btn-primary">
            <ArrowUpRight size={15} />
            Add Trade
          </Link>
        </div>
      </div>

      {/* Session Alert */}
      <SessionAlert />

      {/* Account Health (only when specific account selected) */}
      <AccountHealthCard />

      {/* Trading Growth Curve */}
      <TradingGrowthCurve />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Net P&L"
          value={formatCurrency(analytics.netPnl)}
          subValue={`${analytics.totalTrades} trades · ${formatCurrency(analytics.totalFees)} fees`}
          variant={analytics.netPnl >= 0 ? 'green' : 'red'}
          icon={<DollarSign size={18} />}
          large
        />
        <KPICard
          title="Win Rate"
          value={`${analytics.winRate.toFixed(1)}%`}
          subValue={`${analytics.winCount}W · ${analytics.lossCount}L`}
          variant={analytics.winRate >= 55 ? 'green' : analytics.winRate >= 45 ? 'neutral' : 'red'}
          icon={<Target size={18} />}
          trendLabel={`${analytics.totalTrades} closed trades`}
        />
        <KPICard
          title="Profit Factor"
          value={analytics.profitFactor >= 999 ? '∞' : analytics.profitFactor.toFixed(2)}
          subValue={`Gross: ${formatCurrency(analytics.grossProfit)}`}
          variant={analytics.profitFactor >= 1.5 ? 'green' : analytics.profitFactor >= 1 ? 'neutral' : 'red'}
          icon={<Scale size={18} />}
          trendLabel="gross profit / loss"
        />
        <KPICard
          title="Avg Win / Loss"
          value={`${formatCurrency(analytics.avgWin, true)} / ${formatCurrency(analytics.avgLoss, true)}`}
          valueNode={
            <span className="font-bold text-2xl">
              <span className="text-[#4ADE80]">{formatCurrency(analytics.avgWin, true)}</span>
              <span className="text-[#8b949e]"> / </span>
              <span className="text-[#FF453A]">{formatCurrency(analytics.avgLoss, true)}</span>
            </span>
          }
          subValue={`R:R ${analytics.avgRR.toFixed(2)}`}
          variant={analytics.avgRR >= 1 ? 'green' : 'neutral'}
          icon={<TrendingUp size={18} />}
          trendLabel="per trade average"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Max Drawdown"
          value={formatCurrency(analytics.maxDrawdown)}
          subValue={`${analytics.maxDrawdownPct.toFixed(2)}% from peak`}
          variant="red"
          icon={<Activity size={18} />}
        />
        <KPICard
          title="Streak"
          value={analytics.currentStreak > 0 ? `${analytics.currentStreak}W`
            : analytics.currentStreak < 0 ? `${Math.abs(analytics.currentStreak)}L` : '—'}
          subValue={`Best: ${analytics.longestWinStreak}W  Worst: ${analytics.longestLossStreak}L`}
          variant={analytics.currentStreak > 0 ? 'green' : analytics.currentStreak < 0 ? 'red' : 'neutral'}
          icon={<Flame size={18} />}
        />
        <KPICard
          title="Consistency"
          value={`${analytics.consistency.toFixed(0)}%`}
          subValue={`${daily.filter(d => d.netPnl > 0).length} profitable days`}
          variant={analytics.consistency >= 60 ? 'green' : 'neutral'}
          icon={<BarChart2 size={18} />}
        />
        <KPICard
          title="Trader Score"
          value={`${analytics.score}/100`}
          subValue="Based on 5 key metrics"
          variant={analytics.score >= 70 ? 'green' : analytics.score >= 50 ? 'neutral' : 'red'}
          icon={<Award size={18} />}
        />
      </div>

      {/* Weekly Grade */}
      <WeeklyGradeCard />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Cumulative P&L</h2>
              <p className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">Running total over time</p>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              analytics.netPnl >= 0 ? 'bg-green-50 text-[#4ADE80]' : 'bg-[rgba(255,69,58,0.1)] text-[#FF453A]'
            }`}>{formatPnl(analytics.netPnl)}</span>
          </div>
          <div className="h-56"><CumPnlChart data={cumulative} /></div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Daily P&L</h2>
              <p className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">Last 20 sessions</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[rgba(255,255,255,0.35)]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4ADE50]" />Win</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF453A]" />Loss</span>
            </div>
          </div>
          <div className="h-56"><DailyPnlChart data={daily} /></div>
        </div>
      </div>

      {/* Drawdown + Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Drawdown</h2>
              <p className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">% from equity peak</p>
            </div>
            <span className="text-sm font-bold text-[#FF453A] px-3 py-1 bg-red-50 rounded-full">
              -{analytics.maxDrawdownPct.toFixed(2)}%
            </span>
          </div>
          <div className="h-48"><DrawdownChart data={drawdown} /></div>
        </div>

        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.06)]">
            <div>
              <h2 className="section-title">Recent Trades</h2>
              <p className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">Latest activity</p>
            </div>
            <Link href="/trades" className="text-xs font-semibold text-[#4ADE80] hover:text-[#4ADE50] transition-colors flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
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
                {recentTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-[rgba(255,255,255,0.35)] py-8">
                      No trades yet. <Link href="/trades" className="text-[#4ADE80] hover:underline">Add your first trade</Link>
                    </td>
                  </tr>
                ) : recentTrades.map((t, idx) => (
                  <tr key={t.id} className={idx % 2 === 1 ? "bg-white/[0.02]" : ""}>
                    <td className="font-medium text-[rgba(255,255,255,0.45)]">{t.date}</td>
                    <td><span className="font-mono font-bold text-[rgba(255,255,255,0.9)] text-xs bg-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded-lg">{t.symbol}</span></td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        t.side === 'Long' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                      }`}>{t.side}</span>
                    </td>
                    <td className="font-mono text-sm">{t.contracts}</td>
                    <td className="font-mono text-sm">{t.entryPrice.toFixed(2)}</td>
                    <td className="font-mono text-sm">{t.exitPrice.toFixed(2)}</td>
                    <td className={`font-mono font-bold text-sm ${t.netPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#FF453A]'}`}>
                      {formatPnl(t.netPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
