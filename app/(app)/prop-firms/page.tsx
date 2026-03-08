'use client'
import { useState, useMemo } from 'react'
import {
  Scale, Search, X, SlidersHorizontal, ArrowUpDown,
  TrendingDown, Target, DollarSign, Clock, Calendar,
  CheckCircle2, AlertCircle, Plus, GitCompare, Star,
  Award, Zap, ChevronDown, ChevronUp, Info, Check
} from 'lucide-react'
import { PROP_FIRM_PRESETS, PropFirmPreset, PropFirmPlan, PropAccount, DrawdownType } from '@/lib/types'
import * as dl from '@/lib/data-layer'
import { v4 as uuidv4 } from 'uuid'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number | null | undefined, prefix = '$'): string {
  if (n == null) return '—'
  if (n >= 1000) return `${prefix}${(n / 1000).toFixed(1)}K`
  return `${prefix}${n.toFixed(0)}`
}

function fmtDrawdown(t: DrawdownType): string {
  const m: Record<DrawdownType, string> = {
    trailing: 'Trailing',
    static_eod: 'Static EOD',
    static_intraday: 'Static Intraday',
    static: 'Static',
  }
  return m[t] ?? t
}

function drawdownColor(t: DrawdownType): { bg: string; text: string; dot: string } {
  switch (t) {
    case 'trailing':        return { bg: 'bg-orange-500/10 dark:bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' }
    case 'static_eod':      return { bg: 'bg-blue-500/10 dark:bg-blue-500/15',   text: 'text-blue-600 dark:text-blue-400',   dot: 'bg-blue-500' }
    case 'static_intraday': return { bg: 'bg-purple-500/10 dark:bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' }
    case 'static':          return { bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',   text: 'text-cyan-600 dark:text-cyan-400',   dot: 'bg-cyan-500' }
    default:                return { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-500' }
  }
}

// ── Flattened plan row ─────────────────────────────────────────────────────────

interface PlanRow {
  firmName: string
  description: string
  plan: PropFirmPlan
  planKey: string // `${firmName}__${planId}` — unique
}

function flattenPresets(): PlanRow[] {
  const rows: PlanRow[] = []
  for (const firm of PROP_FIRM_PRESETS) {
    for (const plan of firm.plans) {
      rows.push({
        firmName: firm.firmName,
        description: firm.description ?? '',
        plan,
        planKey: `${firm.firmName}__${plan.planId}`,
      })
    }
  }
  return rows
}

const ALL_PLANS = flattenPresets()

// ── Compute "best value" badges ────────────────────────────────────────────────

function computeBadges(rows: PlanRow[]): Map<string, string[]> {
  const badges = new Map<string, string[]>()

  // Group by account size for comparisons
  const bySizes = new Map<number, PlanRow[]>()
  for (const r of rows) {
    const s = r.plan.size
    if (!bySizes.has(s)) bySizes.set(s, [])
    bySizes.get(s)!.push(r)
  }

  for (const [, group] of bySizes) {
    if (group.length < 2) continue

    // Cheapest eval cost within a size
    const withCost = group.filter(r => r.plan.evalCost != null)
    if (withCost.length > 0) {
      const minCost = Math.min(...withCost.map(r => r.plan.evalCost!))
      const cheapest = withCost.filter(r => r.plan.evalCost === minCost)
      for (const r of cheapest) {
        const b = badges.get(r.planKey) ?? []
        b.push('Best Value')
        badges.set(r.planKey, b)
      }
    }

    // Fastest payout
    const minDays = Math.min(...group.map(r => r.plan.daysToPayout))
    const fastest = group.filter(r => r.plan.daysToPayout === minDays)
    for (const r of fastest) {
      const b = badges.get(r.planKey) ?? []
      if (!b.includes('Best Value')) {
        b.push('Fast Payout')
        badges.set(r.planKey, b)
      }
    }
  }

  // "Most Accounts" (maxFundedAccounts)
  const maxAccounts = Math.max(...rows.map(r => r.plan.maxFundedAccounts))
  for (const r of rows.filter(r => r.plan.maxFundedAccounts === maxAccounts)) {
    const b = badges.get(r.planKey) ?? []
    b.push('Max Scaling')
    badges.set(r.planKey, b)
  }

  return badges
}

const GLOBAL_BADGES = computeBadges(ALL_PLANS)

// ── Color value in compare mode ────────────────────────────────────────────────

type Direction = 'lower-is-better' | 'higher-is-better'

function compareClass(value: number | null, values: (number | null)[], dir: Direction): string {
  const nums = values.filter((v): v is number => v != null)
  if (nums.length < 2 || value == null) return ''
  const best = dir === 'lower-is-better' ? Math.min(...nums) : Math.max(...nums)
  const worst = dir === 'lower-is-better' ? Math.max(...nums) : Math.min(...nums)
  if (value === best) return 'text-emerald-500 dark:text-emerald-400 font-bold'
  if (value === worst) return 'text-red-500 dark:text-red-400 font-semibold'
  return ''
}

// ── Add Account ────────────────────────────────────────────────────────────────

function addAccount(firmName: string, plan: PropFirmPlan): PropAccount {
  const account: PropAccount = {
    id: uuidv4(),
    firmName,
    nickname: `${firmName} ${plan.label}`,
    accountNumber: '',
    startingBalance: plan.size * 1000,
    status: 'evaluation',
    dailyLossLimit: plan.dailyLossLimit,
    maxLossLimit: plan.drawdown,
    drawdownType: plan.drawdownType,
    profitTarget: plan.profitTarget,
    maxDailyTrades: null,
    minTradingDays: plan.minTradingDays,
    consistencyRule: plan.consistencyRule,
    evalCost: plan.evalCost,
    activationFee: plan.activationFee,
    daysToPayout: plan.daysToPayout,
    maxFundedAccounts: plan.maxFundedAccounts,
    resetFee: plan.resetFee,
    createdAt: new Date().toISOString(),
  }
  // Fire-and-forget: save to Supabase/localStorage in background
  dl.savePropAccount(account)
  return account
}

// ── Badge chip ─────────────────────────────────────────────────────────────────

function BadgeChip({ badge }: { badge: string }) {
  const styles: Record<string, string> = {
    'Best Value': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
    'Fast Payout': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25',
    'Max Scaling': 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25',
  }
  const icons: Record<string, React.ReactNode> = {
    'Best Value': <Award size={10} />,
    'Fast Payout': <Zap size={10} />,
    'Max Scaling': <Star size={10} />,
  }
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[badge] ?? 'bg-gray-100 text-gray-600'}`}>
      {icons[badge]}
      {badge}
    </span>
  )
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({
  row,
  selected,
  onToggleSelect,
  onAddAccount,
  compareValues,
  inCompareMode,
}: {
  row: PlanRow
  selected: boolean
  onToggleSelect: () => void
  onAddAccount: () => void
  compareValues?: {
    evalCost: (number | null)[]
    drawdown: number[]
    profitTarget: (number | null)[]
    daysToPayout: number[]
  }
  inCompareMode: boolean
}) {
  const badges = GLOBAL_BADGES.get(row.planKey) ?? []
  const ddColor = drawdownColor(row.plan.drawdownType)
  const [added, setAdded] = useState(false)

  const cvClass = (val: number | null, arr: (number | null)[], dir: Direction) => {
    if (!inCompareMode || !compareValues) return ''
    return compareClass(val, arr, dir)
  }

  function handleAdd() {
    onAddAccount()
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 flex flex-col ${
        selected
          ? 'border-emerald-500/60 ring-2 ring-emerald-500/25 bg-white dark:bg-[#0f1a0f]'
          : 'border-[#E4E9F0] dark:border-[#1a2035] bg-white dark:bg-[#0b0f19] hover:border-[#C8D4E0] dark:hover:border-[#2a3050]'
      }`}
      style={{ boxShadow: selected ? '0 0 0 3px rgba(45,139,78,0.12), 0 4px 24px rgba(45,139,78,0.08)' : '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#F0F3F7] dark:border-[#1a2035]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#6B7E91] dark:text-[#4d5566] uppercase tracking-wider mb-0.5 truncate">{row.firmName}</p>
            <h3 className="text-sm font-bold text-[#1E2D3D] dark:text-[#e6edf3] truncate">{row.plan.label}</h3>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {inCompareMode && (
              <button
                onClick={onToggleSelect}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  selected
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-[#C8D4E0] dark:border-[#2a3050] text-transparent hover:border-emerald-400'
                }`}
              >
                <Check size={12} />
              </button>
            )}
            <span className="text-lg font-bold text-[#1E2D3D] dark:text-[#e6edf3]">
              ${row.plan.size}K
            </span>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badges.map(b => <BadgeChip key={b} badge={b} />)}
          </div>
        )}
      </div>

      {/* Metrics grid */}
      <div className="p-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {/* Eval Cost */}
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold flex items-center gap-1">
              <DollarSign size={10} /> Eval Cost
            </p>
            <p className={`text-sm font-bold ${cvClass(row.plan.evalCost, compareValues?.evalCost ?? [], 'lower-is-better') || 'text-[#1E2D3D] dark:text-[#e6edf3]'}`}>
              {row.plan.evalCost != null ? `$${row.plan.evalCost}/mo` : row.plan.activationFee != null ? `$${row.plan.activationFee} once` : 'Free'}
            </p>
          </div>

          {/* Days to Payout */}
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold flex items-center gap-1">
              <Zap size={10} /> Payout
            </p>
            <p className={`text-sm font-bold ${cvClass(row.plan.daysToPayout, compareValues?.daysToPayout ?? [], 'lower-is-better') || 'text-[#1E2D3D] dark:text-[#e6edf3]'}`}>
              {row.plan.daysToPayout === 1 ? 'Same-day' : `${row.plan.daysToPayout}d`}
            </p>
          </div>

          {/* Max Drawdown */}
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold flex items-center gap-1">
              <TrendingDown size={10} /> Max DD
            </p>
            <p className={`text-sm font-bold ${cvClass(row.plan.drawdown, compareValues?.drawdown ?? [], 'higher-is-better') || 'text-[#1E2D3D] dark:text-[#e6edf3]'}`}>
              {fmt$(row.plan.drawdown)}
            </p>
          </div>

          {/* Profit Target */}
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold flex items-center gap-1">
              <Target size={10} /> Target
            </p>
            <p className={`text-sm font-bold ${cvClass(row.plan.profitTarget, compareValues?.profitTarget ?? [], 'lower-is-better') || 'text-[#1E2D3D] dark:text-[#e6edf3]'}`}>
              {fmt$(row.plan.profitTarget)}
            </p>
          </div>

          {/* Daily Loss */}
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold flex items-center gap-1">
              <AlertCircle size={10} /> Daily Loss
            </p>
            <p className="text-sm font-bold text-[#1E2D3D] dark:text-[#e6edf3]">
              {row.plan.dailyLossLimit != null ? fmt$(row.plan.dailyLossLimit) : 'None'}
            </p>
          </div>

          {/* Min Days */}
          <div className="space-y-0.5">
            <p className="text-[10px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold flex items-center gap-1">
              <Calendar size={10} /> Min Days
            </p>
            <p className="text-sm font-bold text-[#1E2D3D] dark:text-[#e6edf3]">
              {row.plan.minTradingDays === 0 ? 'None' : `${row.plan.minTradingDays}d`}
            </p>
          </div>
        </div>

        {/* Drawdown type badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${ddColor.bg} ${ddColor.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ddColor.dot}`} />
            {fmtDrawdown(row.plan.drawdownType)}
          </span>
          {row.plan.consistencyRule && (
            <div className="group relative">
              <Info size={13} className="text-[#9EB0C0] dark:text-[#3a4252] cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 w-56 px-3 py-2 bg-[#1a2332] text-white text-[11px] rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 leading-relaxed shadow-2xl transition-opacity">
                <p className="font-semibold mb-1 text-emerald-400">Consistency Rule</p>
                {row.plan.consistencyRule}
              </div>
            </div>
          )}
        </div>

        {/* Consistency rule text (if present and not in collapsed mode) */}
        {row.plan.consistencyRule && (
          <p className="mt-2 text-[11px] text-[#9EB0C0] dark:text-[#3a4252] leading-relaxed line-clamp-2">
            {row.plan.consistencyRule}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAdd}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            added
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-[#1e7a3e] to-[#2D8B4E] hover:from-[#22903f] hover:to-[#33a05a] text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20'
          }`}
        >
          {added ? <CheckCircle2 size={15} /> : <Plus size={15} />}
          {added ? 'Added!' : 'Add Account'}
        </button>
      </div>
    </div>
  )
}

// ── Compare Panel ─────────────────────────────────────────────────────────────

function ComparePanel({
  rows,
  onRemove,
  onClear,
}: {
  rows: PlanRow[]
  onRemove: (key: string) => void
  onClear: () => void
}) {
  if (rows.length === 0) return null

  const evalCosts = rows.map(r => r.plan.evalCost)
  const drawdowns = rows.map(r => r.plan.drawdown)
  const profitTargets = rows.map(r => r.plan.profitTarget)
  const daysToPayouts = rows.map(r => r.plan.daysToPayout)

  const cvClass = (val: number | null, arr: (number | null)[], dir: Direction) =>
    compareClass(val, arr, dir)

  const metrics: Array<{
    label: string
    icon: React.ReactNode
    getValue: (r: PlanRow) => string
    getClass: (r: PlanRow) => string
  }> = [
    {
      label: 'Account Size',
      icon: <DollarSign size={13} />,
      getValue: r => `$${r.plan.size}K`,
      getClass: () => '',
    },
    {
      label: 'Eval Cost',
      icon: <DollarSign size={13} />,
      getValue: r => r.plan.evalCost != null ? `$${r.plan.evalCost}/mo` : r.plan.activationFee != null ? `$${r.plan.activationFee} once` : 'Free',
      getClass: r => cvClass(r.plan.evalCost, evalCosts, 'lower-is-better'),
    },
    {
      label: 'Max Drawdown',
      icon: <TrendingDown size={13} />,
      getValue: r => fmt$(r.plan.drawdown),
      getClass: r => cvClass(r.plan.drawdown, drawdowns, 'higher-is-better'),
    },
    {
      label: 'Profit Target',
      icon: <Target size={13} />,
      getValue: r => fmt$(r.plan.profitTarget),
      getClass: r => cvClass(r.plan.profitTarget, profitTargets, 'lower-is-better'),
    },
    {
      label: 'Daily Loss Limit',
      icon: <AlertCircle size={13} />,
      getValue: r => r.plan.dailyLossLimit != null ? fmt$(r.plan.dailyLossLimit) : 'None',
      getClass: () => '',
    },
    {
      label: 'Drawdown Type',
      icon: <Scale size={13} />,
      getValue: r => fmtDrawdown(r.plan.drawdownType),
      getClass: () => '',
    },
    {
      label: 'Days to Payout',
      icon: <Zap size={13} />,
      getValue: r => r.plan.daysToPayout === 1 ? 'Same-day' : `${r.plan.daysToPayout} days`,
      getClass: r => cvClass(r.plan.daysToPayout, daysToPayouts, 'lower-is-better'),
    },
    {
      label: 'Min Trading Days',
      icon: <Calendar size={13} />,
      getValue: r => r.plan.minTradingDays === 0 ? 'None' : `${r.plan.minTradingDays} days`,
      getClass: () => '',
    },
    {
      label: 'Max Funded Accounts',
      icon: <Award size={13} />,
      getValue: r => `${r.plan.maxFundedAccounts}`,
      getClass: r => cvClass(r.plan.maxFundedAccounts, rows.map(x => x.plan.maxFundedAccounts), 'higher-is-better'),
    },
    {
      label: 'Reset Fee',
      icon: <DollarSign size={13} />,
      getValue: r => fmt$(r.plan.resetFee),
      getClass: r => cvClass(r.plan.resetFee, rows.map(x => x.plan.resetFee), 'lower-is-better'),
    },
  ]

  return (
    <div className="mb-8 rounded-2xl border border-[#E4E9F0] dark:border-[#1a2035] bg-white dark:bg-[#0b0f19] overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F0F3F7] dark:border-[#1a2035] bg-gradient-to-r from-emerald-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <GitCompare size={16} className="text-emerald-500" />
          <span className="font-semibold text-sm text-[#1E2D3D] dark:text-[#e6edf3]">
            Comparing {rows.length} plans
          </span>
          <span className="text-xs text-[#6B7E91] dark:text-[#4d5566]">
            — <span className="text-emerald-500">green</span> = best, <span className="text-red-500">red</span> = worst
          </span>
        </div>
        <button onClick={onClear} className="text-xs text-[#6B7E91] dark:text-[#4d5566] hover:text-red-500 transition-colors flex items-center gap-1">
          <X size={13} /> Clear
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F0F3F7] dark:border-[#1a2035]">
              <th className="text-left px-5 py-2.5 text-[11px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold w-36">Metric</th>
              {rows.map(r => (
                <th key={r.planKey} className="text-center px-4 py-2.5 min-w-[140px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[#6B7E91] dark:text-[#4d5566] font-medium">{r.firmName}</span>
                    <span className="text-[#1E2D3D] dark:text-[#e6edf3] font-bold text-sm">{r.plan.label}</span>
                    <button
                      onClick={() => onRemove(r.planKey)}
                      className="text-[#9EB0C0] hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => (
              <tr key={m.label} className="border-b border-[#F0F3F7]/50 dark:border-[#1a2035]/50 hover:bg-[#F8FAFC] dark:hover:bg-[#0f1219]">
                <td className="px-5 py-2.5 text-[#6B7E91] dark:text-[#4d5566] text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    {m.icon} {m.label}
                  </span>
                </td>
                {rows.map(r => (
                  <td key={r.planKey} className={`px-4 py-2.5 text-center text-sm ${m.getClass(r) || 'text-[#1E2D3D] dark:text-[#e6edf3]'}`}>
                    {m.getValue(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type SortKey = 'evalCost' | 'drawdown' | 'profitTarget' | 'daysToPayout' | 'size'
type SortDir = 'asc' | 'desc'

export default function PropFirmsPage() {
  const [search, setSearch] = useState('')
  const [filterSize, setFilterSize] = useState<number | 'all'>('all')
  const [filterDDType, setFilterDDType] = useState<DrawdownType | 'all'>('all')
  const [filterMaxCost, setFilterMaxCost] = useState<number | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('evalCost')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [compareMode, setCompareMode] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Derived: plans shown in compare panel
  const comparePlans = useMemo(
    () => ALL_PLANS.filter(r => selectedKeys.has(r.planKey)),
    [selectedKeys]
  )

  // Filtered + sorted plans
  const filteredPlans = useMemo(() => {
    let rows = ALL_PLANS

    // search
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        r.firmName.toLowerCase().includes(q) ||
        r.plan.label.toLowerCase().includes(q)
      )
    }

    // size filter
    if (filterSize !== 'all') {
      rows = rows.filter(r => r.plan.size === filterSize)
    }

    // drawdown type filter
    if (filterDDType !== 'all') {
      rows = rows.filter(r => r.plan.drawdownType === filterDDType)
    }

    // max cost
    if (filterMaxCost !== 'all') {
      rows = rows.filter(r => {
        const cost = r.plan.evalCost ?? r.plan.activationFee ?? 0
        return cost <= filterMaxCost
      })
    }

    // sort
    rows = [...rows].sort((a, b) => {
      let av: number, bv: number
      switch (sortKey) {
        case 'evalCost':
          av = a.plan.evalCost ?? a.plan.activationFee ?? 9999
          bv = b.plan.evalCost ?? b.plan.activationFee ?? 9999
          break
        case 'drawdown':
          av = a.plan.drawdown
          bv = b.plan.drawdown
          break
        case 'profitTarget':
          av = a.plan.profitTarget ?? 9999
          bv = b.plan.profitTarget ?? 9999
          break
        case 'daysToPayout':
          av = a.plan.daysToPayout
          bv = b.plan.daysToPayout
          break
        case 'size':
          av = a.plan.size
          bv = b.plan.size
          break
        default:
          av = 0; bv = 0
      }
      return sortDir === 'asc' ? av - bv : bv - av
    })

    return rows
  }, [search, filterSize, filterDDType, filterMaxCost, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function toggleSelect(key: string) {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        if (next.size >= 4) return prev // max 4
        next.add(key)
      }
      return next
    })
  }

  const compareValues = {
    evalCost: comparePlans.map(r => r.plan.evalCost),
    drawdown: comparePlans.map(r => r.plan.drawdown),
    profitTarget: comparePlans.map(r => r.plan.profitTarget),
    daysToPayout: comparePlans.map(r => r.plan.daysToPayout),
  }

  const SIZES = [25, 50, 75, 100, 150, 200, 250, 300]
  const DD_TYPES: DrawdownType[] = ['trailing', 'static_eod', 'static_intraday', 'static']
  const MAX_COSTS = [50, 100, 150, 200, 300, 500]

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0f1219]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Page header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e7a3e 0%, #2D8B4E 100%)', boxShadow: '0 4px 12px rgba(45,139,78,0.3)' }}>
              <Scale size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1E2D3D] dark:text-[#e6edf3]">Prop Firms</h1>
          </div>
          <p className="text-sm text-[#6B7E91] dark:text-[#4d5566] ml-12">
            Compare {ALL_PLANS.length} plans across {PROP_FIRM_PRESETS.length} firms · Click "Add Account" to track a plan
          </p>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9EB0C0] dark:text-[#3a4252]" />
            <input
              type="text"
              placeholder="Search firm or plan…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E4E9F0] dark:border-[#1a2035] bg-white dark:bg-[#0b0f19] text-sm text-[#1E2D3D] dark:text-[#e6edf3] placeholder-[#9EB0C0] dark:placeholder-[#3a4252] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9EB0C0] hover:text-[#1E2D3D] dark:hover:text-[#e6edf3]">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-[#E4E9F0] dark:border-[#1a2035] bg-white dark:bg-[#0b0f19] text-[#6B7E91] dark:text-[#4d5566] hover:border-[#C8D4E0] dark:hover:border-[#2a3050]'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {(filterSize !== 'all' || filterDDType !== 'all' || filterMaxCost !== 'all') && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Compare mode toggle */}
          <button
            onClick={() => {
              setCompareMode(m => !m)
              if (compareMode) setSelectedKeys(new Set())
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              compareMode
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-[#E4E9F0] dark:border-[#1a2035] bg-white dark:bg-[#0b0f19] text-[#6B7E91] dark:text-[#4d5566] hover:border-[#C8D4E0] dark:hover:border-[#2a3050]'
            }`}
          >
            <GitCompare size={15} />
            Compare
            {selectedKeys.size > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {selectedKeys.size}
              </span>
            )}
          </button>
        </div>

        {/* ── Filter bar ── */}
        {showFilters && (
          <div className="mb-4 p-4 rounded-2xl border border-[#E4E9F0] dark:border-[#1a2035] bg-white dark:bg-[#0b0f19]">
            <div className="flex flex-wrap gap-4">
              {/* Account size */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold">Account Size</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterSize('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterSize === 'all' ? 'bg-emerald-500 text-white' : 'bg-[#F5F7FA] dark:bg-[#1a2035] text-[#6B7E91] dark:text-[#4d5566] hover:bg-[#EFF2F5]'}`}
                  >All</button>
                  {SIZES.map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterSize(s === filterSize ? 'all' : s)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterSize === s ? 'bg-emerald-500 text-white' : 'bg-[#F5F7FA] dark:bg-[#1a2035] text-[#6B7E91] dark:text-[#4d5566] hover:bg-[#EFF2F5]'}`}
                    >${s}K</button>
                  ))}
                </div>
              </div>

              {/* Drawdown type */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold">Drawdown Type</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterDDType('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterDDType === 'all' ? 'bg-emerald-500 text-white' : 'bg-[#F5F7FA] dark:bg-[#1a2035] text-[#6B7E91] dark:text-[#4d5566] hover:bg-[#EFF2F5]'}`}
                  >All</button>
                  {DD_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setFilterDDType(t === filterDDType ? 'all' : t)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterDDType === t ? 'bg-emerald-500 text-white' : 'bg-[#F5F7FA] dark:bg-[#1a2035] text-[#6B7E91] dark:text-[#4d5566] hover:bg-[#EFF2F5]'}`}
                    >{fmtDrawdown(t)}</button>
                  ))}
                </div>
              </div>

              {/* Max cost */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold">Max Monthly Cost</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterMaxCost('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterMaxCost === 'all' ? 'bg-emerald-500 text-white' : 'bg-[#F5F7FA] dark:bg-[#1a2035] text-[#6B7E91] dark:text-[#4d5566] hover:bg-[#EFF2F5]'}`}
                  >Any</button>
                  {MAX_COSTS.map(c => (
                    <button
                      key={c}
                      onClick={() => setFilterMaxCost(c === filterMaxCost ? 'all' : c)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterMaxCost === c ? 'bg-emerald-500 text-white' : 'bg-[#F5F7FA] dark:bg-[#1a2035] text-[#6B7E91] dark:text-[#4d5566] hover:bg-[#EFF2F5]'}`}
                    >≤${c}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Sort bar ── */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[11px] text-[#9EB0C0] dark:text-[#3a4252] uppercase tracking-wide font-semibold">Sort by:</span>
          {([
            { key: 'evalCost', label: 'Cost' },
            { key: 'drawdown', label: 'Drawdown' },
            { key: 'profitTarget', label: 'Target' },
            { key: 'daysToPayout', label: 'Payout' },
            { key: 'size', label: 'Size' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortKey === key
                  ? 'bg-[#1E2D3D] dark:bg-[#e6edf3] text-white dark:text-[#0b0f19]'
                  : 'bg-[#F5F7FA] dark:bg-[#1a2035] text-[#6B7E91] dark:text-[#4d5566] hover:bg-[#EFF2F5] dark:hover:bg-[#2a3050]'
              }`}
            >
              {label}
              {sortKey === key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
            </button>
          ))}
          <span className="ml-auto text-xs text-[#9EB0C0] dark:text-[#3a4252]">
            {filteredPlans.length} of {ALL_PLANS.length} plans
          </span>
        </div>

        {/* ── Compare panel ── */}
        {compareMode && selectedKeys.size > 0 && (
          <ComparePanel
            rows={comparePlans}
            onRemove={key => setSelectedKeys(prev => { const n = new Set(prev); n.delete(key); return n })}
            onClear={() => setSelectedKeys(new Set())}
          />
        )}

        {/* ── Compare mode hint ── */}
        {compareMode && selectedKeys.size === 0 && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <GitCompare size={15} />
            Select 2–4 plans to compare them side by side
          </div>
        )}

        {/* ── Card grid ── */}
        {filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map(row => (
              <PlanCard
                key={row.planKey}
                row={row}
                selected={selectedKeys.has(row.planKey)}
                onToggleSelect={() => toggleSelect(row.planKey)}
                onAddAccount={() => addAccount(row.firmName, row.plan)}
                compareValues={compareMode && selectedKeys.has(row.planKey) ? compareValues : undefined}
                inCompareMode={compareMode && selectedKeys.has(row.planKey)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Scale size={40} className="mx-auto mb-3 text-[#C8D4E0] dark:text-[#1a2035]" />
            <p className="text-[#6B7E91] dark:text-[#4d5566] font-medium">No plans match your filters</p>
            <button
              onClick={() => { setSearch(''); setFilterSize('all'); setFilterDDType('all'); setFilterMaxCost('all') }}
              className="mt-3 text-sm text-emerald-500 hover:text-emerald-600 font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
