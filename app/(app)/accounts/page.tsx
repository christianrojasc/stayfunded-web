'use client'
import { formatAccountNumber } from '@/lib/utils'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Briefcase, TrendingUp, TrendingDown, Search, FileUp,
  X, ChevronRight, Shield, Target, AlertTriangle,
  CheckCircle, Edit2, Trash2, Info, ChevronDown, Check,
  DollarSign, Calendar, Zap, Clock
} from 'lucide-react'
import { PropAccount, PropFirmPreset, PropFirmPlan, PROP_FIRM_PRESETS, DrawdownType } from '@/lib/types'
import * as dl from '@/lib/data-layer'
import { useTrades } from '@/components/TradeContext'
import { useAccountFilter } from '@/components/AccountFilterContext'
import { formatPnl } from '@/lib/calculations'
import { v4 as uuidv4 } from 'uuid'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtK(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function fmtDrawdownType(t: DrawdownType): string {
  const labels: Record<DrawdownType, string> = {
    trailing: 'Trailing',
    trailing_eod: 'Trailing EOD',
    static_eod: 'Static EOD',
    static_intraday: 'Static Intraday',
    static: 'Static',
  }
  return labels[t] ?? t
}

function progressColor(pct: number, invert = false): string {
  // invert = true means higher % is worse (drawdown used)
  const v = invert ? pct : 1 - pct
  if (v < 0.2) return '#EF4444'
  if (v < 0.4) return '#F97316'
  if (v < 0.6) return '#F59E0B'
  return '#4ADE50'
}

// ── Account Health Card ────────────────────────────────────────────────────────

function AccountCard({
  account,
  trades: allTrades,
  onClick,
  onDelete,
  onEdit,
}: {
  account: PropAccount
  trades: import('@/lib/types').Trade[]
  onClick: () => void
  onDelete: (id: string) => void
  onEdit: (account: PropAccount) => void
}) {
  const trades = useMemo(() => allTrades.filter(t => t.accountId === account.id), [allTrades, account.id])

  const totalPnl = useMemo(() => trades.reduce((s, t) => s + t.netPnl, 0), [trades])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayPnl = useMemo(
    () => trades.filter(t => t.sessionDate === todayStr).reduce((s, t) => s + t.netPnl, 0),
    [trades, todayStr]
  )

  const drawdownUsed = Math.max(0, -totalPnl)
  const drawdownPct = account.maxLossLimit > 0 ? drawdownUsed / account.maxLossLimit : 0

  const dailyUsed = Math.max(0, -todayPnl)
  const dailyPct = account.dailyLossLimit && account.dailyLossLimit > 0
    ? dailyUsed / account.dailyLossLimit
    : null

  const profitPct = account.profitTarget && account.profitTarget > 0
    ? Math.max(0, totalPnl) / account.profitTarget
    : null

  const daysTradedCount = useMemo(() => {
    const dates = new Set(trades.map(t => t.sessionDate))
    return dates.size
  }, [trades])

  const drawdownColor = progressColor(drawdownPct, true)
  const profitColor = '#4ADE50'

  const isInDanger = drawdownPct >= 0.8 || (dailyPct !== null && dailyPct >= 0.8)
  const isPassing = profitPct !== null && profitPct >= 1

  return (
    <div
      className="glass-card-hover p-5 cursor-pointer group relative"
      onClick={onClick}
    >
      {/* Danger / Passing indicator */}
      {(isInDanger || isPassing) && (
        <div className={`absolute top-3 right-10 w-2 h-2 rounded-full ${isPassing ? 'bg-[#4ADE50]' : 'bg-[#EF4444]'} animate-pulse`} />
      )}

      {/* Edit + Delete buttons */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button
          onClick={e => { e.stopPropagation(); onEdit(account) }}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#2D8B4E] hover:bg-[var(--border)] transition-all"
          title="Edit account"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(account.id) }}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#EF4444] hover:bg-[var(--border)] transition-all"
          title="Delete account"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2D8B4E22, #4ADE5022)' }}>
          <Briefcase size={18} className="text-[#2D8B4E]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[var(--text-primary)] text-sm truncate">
              {account.nickname || account.firmName}
            </h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
              account.status === 'funded'
                ? 'bg-[#2D8B4E]/10 text-[#4ADE50]'
                : 'bg-amber-500/10 text-amber-500'
            }`}>
              {account.status === 'funded' ? 'Funded' : 'Evaluation'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
            {account.firmName} · {fmtK(account.startingBalance)} · {fmtDrawdownType(account.drawdownType)}
          </p>
        </div>
      </div>

      {/* P&L Row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider mb-0.5">Net P&L</p>
          <p className={`text-lg font-bold font-mono ${totalPnl >= 0 ? 'text-[#4ADE50]' : 'text-[#EF4444]'}`}>
            {formatPnl(totalPnl)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider mb-0.5">Today</p>
          <p className={`text-sm font-semibold font-mono ${todayPnl >= 0 ? 'text-[#4ADE50]' : 'text-[#EF4444]'}`}>
            {formatPnl(todayPnl)}
          </p>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-2.5">
        {/* Max Drawdown */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-[var(--text-muted)]">Max Drawdown</span>
            <span className="font-mono font-semibold" style={{ color: drawdownColor }}>
              {fmtK(drawdownUsed)} / {fmtK(account.maxLossLimit)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(drawdownPct * 100, 100)}%`, backgroundColor: drawdownColor }}
            />
          </div>
        </div>

        {/* Daily Loss (if applicable) */}
        {account.dailyLossLimit !== null && account.dailyLossLimit > 0 && (
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-[var(--text-muted)]">Daily Loss</span>
              <span className="font-mono font-semibold" style={{ color: dailyPct !== null ? progressColor(dailyPct, true) : '#6B7E91' }}>
                {fmtK(dailyUsed)} / {fmtK(account.dailyLossLimit)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((dailyPct || 0) * 100, 100)}%`,
                  backgroundColor: dailyPct !== null ? progressColor(dailyPct, true) : '#6B7E91',
                }}
              />
            </div>
          </div>
        )}

        {/* Profit Target */}
        {account.profitTarget !== null && account.profitTarget > 0 && (
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-[var(--text-muted)]">Profit Target</span>
              <span className="font-mono font-semibold text-[#4ADE50]">
                {fmtK(Math.max(0, totalPnl))} / {fmtK(account.profitTarget)}
                {profitPct !== null && <span className="text-[var(--text-muted)]"> ({(profitPct * 100).toFixed(0)}%)</span>}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[#4ADE50]"
                style={{ width: `${Math.min((profitPct || 0) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {daysTradedCount} day{daysTradedCount !== 1 ? 's' : ''} traded
            {account.minTradingDays > 0 && ` / ${account.minTradingDays} min`}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp size={11} />
            {trades.length} trades
          </span>
        </div>
        <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-[#2D8B4E] transition-colors" />
      </div>
    </div>
  )
}

// ── Firm Search Dropdown ───────────────────────────────────────────────────────

function FirmSearchSelect({
  value,
  onChange,
}: {
  value: PropFirmPreset | null
  onChange: (firm: PropFirmPreset | null) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = useMemo(
    () => PROP_FIRM_PRESETS.filter(f =>
      f.firmName.toLowerCase().includes(query.toLowerCase())
    ),
    [query]
  )

  return (
    <div ref={ref} className={`relative ${open ? 'pb-64' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input-field text-left flex items-center justify-between"
      >
        <span className={value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
          {value ? value.firmName : 'Select prop firm…'}
        </span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl z-[60] max-h-64 flex flex-col"
          style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
          {/* Search */}
          <div className="p-2 border-b border-[rgba(255,255,255,0.06)]">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                autoFocus
                className="input-field pl-8 py-1.5 text-xs"
                placeholder="Search firm…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {filtered.map(firm => (
              <button
                key={firm.firmName}
                type="button"
                onClick={() => { onChange(firm); setOpen(false); setQuery('') }}
                className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{firm.firmName}</p>
                  {firm.description && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{firm.description}</p>
                  )}
                </div>
                {value?.firmName === firm.firmName && (
                  <Check size={14} className="text-[#2D8B4E] flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add Account Modal ─────────────────────────────────────────────────────────

function AddAccountModal({ onClose, onSave, editAccount }: { onClose: () => void; onSave: () => void; editAccount?: PropAccount | null }) {
  const isEdit = !!editAccount
  const matchedFirm = editAccount ? PROP_FIRM_PRESETS.find(f => f.firmName === editAccount.firmName) || null : null
  const [selectedFirm, setSelectedFirm] = useState<PropFirmPreset | null>(matchedFirm)
  const [selectedPlan, setSelectedPlan] = useState<PropFirmPlan | null>(null)
  const [nickname, setNickname] = useState(editAccount?.nickname || '')
  const [accountNumber, setAccountNumber] = useState(editAccount?.accountNumber || '')
  const [status, setStatus] = useState<'evaluation' | 'funded'>(editAccount?.status || 'evaluation')

  // Editable rule overrides
  const [dailyLossLimit, setDailyLossLimit] = useState(editAccount?.dailyLossLimit != null ? String(editAccount.dailyLossLimit) : '')
  const [maxLossLimit, setMaxLossLimit] = useState(editAccount?.maxLossLimit ? String(editAccount.maxLossLimit) : '')
  const [profitTarget, setProfitTarget] = useState(editAccount?.profitTarget != null ? String(editAccount.profitTarget) : '')
  const [minTradingDays, setMinTradingDays] = useState(editAccount?.minTradingDays != null ? String(editAccount.minTradingDays) : '')
  const [consistencyRule, setConsistencyRule] = useState(editAccount?.consistencyRule || '')
  const [drawdownType, setDrawdownType] = useState<DrawdownType>(editAccount?.drawdownType || 'static_eod')

  // Auto-fill from plan
  useEffect(() => {
    if (!selectedPlan) return
    setDailyLossLimit(selectedPlan.dailyLossLimit !== null ? String(selectedPlan.dailyLossLimit) : '')
    setMaxLossLimit(String(selectedPlan.drawdown))
    setProfitTarget(selectedPlan.profitTarget !== null ? String(selectedPlan.profitTarget) : '')
    setMinTradingDays(String(selectedPlan.minTradingDays))
    setConsistencyRule(selectedPlan.consistencyRule)
    setDrawdownType(selectedPlan.drawdownType)
  }, [selectedPlan])

  const handleFirmChange = (firm: PropFirmPreset | null) => {
    setSelectedFirm(firm)
    setSelectedPlan(null)
    if (firm && !nickname) setNickname(firm.firmName)
  }

  const handleSave = async () => {
    if (!isEdit && (!selectedFirm || !selectedPlan)) return
    const acct: PropAccount = {
      id: editAccount?.id || uuidv4(),
      firmName: selectedFirm?.firmName || editAccount?.firmName || '',
      nickname: nickname.trim() || selectedFirm?.firmName || editAccount?.firmName || '',
      accountNumber: accountNumber.trim(),
      startingBalance: selectedPlan ? selectedPlan.size * 1000 : editAccount?.startingBalance || 50000,
      status,
      dailyLossLimit: dailyLossLimit ? parseFloat(dailyLossLimit) : null,
      maxLossLimit: parseFloat(maxLossLimit) || editAccount?.maxLossLimit || 2000,
      drawdownType,
      profitTarget: profitTarget ? parseFloat(profitTarget) : null,
      maxDailyTrades: editAccount?.maxDailyTrades || null,
      minTradingDays: parseInt(minTradingDays) || 0,
      consistencyRule,
      evalCost: selectedPlan?.evalCost ?? editAccount?.evalCost ?? null,
      activationFee: selectedPlan?.activationFee ?? editAccount?.activationFee ?? null,
      daysToPayout: selectedPlan?.daysToPayout ?? editAccount?.daysToPayout ?? 5,
      maxFundedAccounts: selectedPlan?.maxFundedAccounts ?? editAccount?.maxFundedAccounts ?? 5,
      resetFee: selectedPlan?.resetFee ?? editAccount?.resetFee ?? null,
      createdAt: editAccount?.createdAt || new Date().toISOString(),
    }
    await dl.savePropAccount(acct)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0B0F1A] border border-[rgba(255,255,255,0.08)] rounded-none sm:rounded-2xl shadow-2xl w-full max-w-2xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto animate-slide-up"
        style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}>
        <div className="sticky top-0 bg-[#0B0F1A] border-b border-[rgba(255,255,255,0.06)] px-6 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}>
              <Briefcase size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">{isEdit ? 'Edit Account' : 'Add Prop Account'}</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Set up your prop firm evaluation or funded account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#64748B] hover:text-white hover:bg-white/5 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Firm */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}>1</span>
              <label className="text-sm font-semibold text-white uppercase tracking-wider">Prop Firm</label>
            </div>
            <FirmSearchSelect value={selectedFirm} onChange={handleFirmChange} />
            {selectedFirm?.description && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[#2D8B4E]/8 border border-[#2D8B4E]/15">
                <Info size={13} className="flex-shrink-0 mt-0.5 text-[#4ADE80]" />
                <p className="text-xs text-[#94A3B8] leading-relaxed">{selectedFirm.description}</p>
              </div>
            )}
          </div>

          {/* Step 2: Plan */}
          {selectedFirm && (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}>2</span>
                <label className="text-sm font-semibold text-white uppercase tracking-wider">Account Plan</label>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {selectedFirm.plans.map(plan => (
                  <button
                    key={plan.planId}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selectedPlan?.planId === plan.planId
                        ? 'border-[#2D8B4E] bg-[#2D8B4E]/10 shadow-[0_0_20px_rgba(45,139,78,0.1)]'
                        : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[#2D8B4E]/40 hover:bg-[rgba(255,255,255,0.04)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-sm text-white">{plan.label}</span>
                      <div className="flex items-center gap-2">
                        {plan.evalCost !== null && (
                          <span className="text-xs font-medium text-[#94A3B8]">${plan.evalCost}/mo</span>
                        )}
                        {plan.activationFee !== null && (
                          <span className="text-[11px] text-[#64748B]">+${plan.activationFee} activation</span>
                        )}
                        {selectedPlan?.planId === plan.planId && (
                          <div className="w-5 h-5 rounded-full bg-[#2D8B4E] flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {plan.profitTarget !== null && (
                        <span className="text-[10px] bg-[#4ADE80]/10 text-[#4ADE80] px-2.5 py-1 rounded-lg font-semibold">
                          Goal: {fmtK(plan.profitTarget)}
                        </span>
                      )}
                      <span className="text-[10px] bg-[#EF4444]/10 text-[#EF4444] px-2.5 py-1 rounded-lg font-semibold">
                        DD: {fmtK(plan.drawdown)}
                      </span>
                      <span className="text-[10px] bg-white/5 text-[#94A3B8] px-2.5 py-1 rounded-lg font-medium">
                        {fmtDrawdownType(plan.drawdownType)}
                      </span>
                      {plan.minTradingDays > 0 && (
                        <span className="text-[10px] bg-white/5 text-[#94A3B8] px-2.5 py-1 rounded-lg font-medium">
                          Min {plan.minTradingDays}d
                        </span>
                      )}
                      {plan.daysToPayout <= 1 && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg font-semibold">
                          ⚡ Same-day payout
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {selectedPlan && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}>3</span>
                  <label className="text-sm font-semibold text-white uppercase tracking-wider">Account Details</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nickname</label>
                    <input
                      className="input-field"
                      placeholder="e.g. Apex 50K #1"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Account Number</label>
                    <input
                      className="input-field font-mono"
                      placeholder="e.g. APEX12345"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Status</label>
                  <div className="flex gap-2">
                    {(['evaluation', 'funded'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                          status === s
                            ? s === 'funded'
                              ? 'bg-[#2D8B4E]/10 border-[#2D8B4E] text-[#4ADE50]'
                              : 'bg-amber-500/10 border-amber-500 text-amber-500'
                            : 'border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 4: Rules (pre-filled, editable) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}>4</span>
                  <label className="text-sm font-semibold text-white uppercase tracking-wider">Rules (auto-filled)</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Max Loss Limit ($)</label>
                    <input
                      type="number"
                      className="input-field font-mono"
                      value={maxLossLimit}
                      onChange={e => setMaxLossLimit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Daily Loss Limit ($)</label>
                    <input
                      type="number"
                      className="input-field font-mono"
                      placeholder="0 = none"
                      value={dailyLossLimit}
                      onChange={e => setDailyLossLimit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Profit Target ($)</label>
                    <input
                      type="number"
                      className="input-field font-mono"
                      placeholder="0 = none"
                      value={profitTarget}
                      onChange={e => setProfitTarget(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Min Trading Days</label>
                    <input
                      type="number"
                      className="input-field font-mono"
                      value={minTradingDays}
                      onChange={e => setMinTradingDays(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Drawdown Type</label>
                  <select
                    className="input-field"
                    value={drawdownType}
                    onChange={e => setDrawdownType(e.target.value as DrawdownType)}
                  >
                    <option value="static_eod">Static EOD</option>
                    <option value="trailing">Trailing</option>
                    <option value="static_intraday">Static Intraday</option>
                    <option value="static">Static (Fixed)</option>
                  </select>
                </div>
                {consistencyRule && (
                  <div className="p-3.5 bg-amber-500/8 border border-amber-500/15 rounded-xl">
                    <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Consistency Rule
                    </p>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{consistencyRule}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0B0F1A] border-t border-[rgba(255,255,255,0.06)] px-6 py-4 flex justify-end gap-3 z-10">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#94A3B8] bg-white/5 hover:bg-white/10 border border-[rgba(255,255,255,0.06)] transition-all">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!selectedFirm || !selectedPlan}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            style={{ background: !selectedFirm || !selectedPlan ? '#2D8B4E' : 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}
          >
            <Plus size={14} />
            {isEdit ? 'Save Changes' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const router = useRouter()
  const { refresh } = useAccountFilter()
  const { trades } = useTrades()
  const [accounts, setAccounts] = useState<PropAccount[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingAccount, setEditingAccount] = useState<PropAccount | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const load = async () => setAccounts(await dl.getPropAccounts())

  useEffect(() => { load() }, [])

  const handleSave = () => { load(); refresh() }

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await dl.deletePropAccount(id)
      await load()
      refresh()
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const totalPnl = useMemo(() => {
    return trades.reduce((s, t) => s + t.netPnl, 0)
  }, [trades])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Prop Accounts</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} · Track your funded & evaluation accounts
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={15} />
          Add Account
        </button>
      </div>

      {/* Summary bar (if accounts exist) */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Accounts', value: accounts.length, sub: `${accounts.filter(a => a.status === 'funded').length} funded` },
            { label: 'Combined P&L', value: formatPnl(totalPnl), sub: 'across all accounts', pnl: true, val: totalPnl },
            { label: 'Evaluations', value: accounts.filter(a => a.status === 'evaluation').length, sub: 'in progress' },
            { label: 'Funded', value: accounts.filter(a => a.status === 'funded').length, sub: 'active funded' },
          ].map(({ label, value, sub, pnl, val }) => (
            <div key={label} className="glass-card p-4">
              <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-xl font-bold ${pnl ? (val! >= 0 ? 'text-[#4ADE50]' : 'text-[#EF4444]') : 'text-[var(--text-primary)]'}`}>
                {typeof value === 'number' && !pnl ? value : value}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #2D8B4E22, #4ADE5022)' }}>
            <Briefcase size={28} className="text-[#2D8B4E]" />
          </div>
          <h2 className="font-bold text-[var(--text-primary)] text-lg mb-2">No prop accounts yet</h2>
          <p className="text-sm text-[var(--text-muted)] mb-5 max-w-sm mx-auto">
            Add your prop firm evaluation or funded accounts to track rules, drawdown, and profit targets.
          </p>

          {/* CSV hint */}
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-6 mx-auto"
            style={{background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.15)'}}>
            <FileUp size={13} className="text-[#4ADE80] flex-shrink-0" />
            <p className="text-xs text-[#4ADE80]">
              Importing a CSV will auto-create your account — no manual setup needed.
            </p>
          </div>

          <button onClick={() => setShowAdd(true)} className="btn-primary mx-auto">
            <Plus size={15} />
            Add Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map(account => (
            <div key={account.id} className="relative">
              {deleteConfirm === account.id && (
                <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--bg-card) 92%, var(--red) 8%)' }}>
                  <AlertTriangle size={24} className="text-[#EF4444]" />
                  <p className="font-semibold text-[#EF4444] text-sm text-center">Delete this account?</p>
                  <p className="text-xs text-[var(--text-muted)] text-center">Click delete again to confirm. Trades remain.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
                    <button onClick={() => handleDelete(account.id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
                  </div>
                </div>
              )}
              <AccountCard
                account={account}
                trades={trades}
                onClick={() => router.push(`/accounts/${account.id}`)}
                onDelete={handleDelete}
                onEdit={(acct) => setEditingAccount(acct)}
              />
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddAccountModal onClose={() => setShowAdd(false)} onSave={handleSave} />
      )}

      {editingAccount && (
        <AddAccountModal
          editAccount={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
