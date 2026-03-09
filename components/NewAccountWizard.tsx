'use client'
import { useState, useEffect } from 'react'
import {
  X, Building2, CheckCircle, ChevronDown, Info,
  Sparkles, AlertTriangle,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import {
  PropAccount, AccountStatus, DrawdownType,
  PROP_FIRM_PRESETS, PropFirmPreset, PropFirmPlan,
} from '@/lib/types'
import * as dl from '@/lib/data-layer'
import { useAuth } from '@/components/AuthContext'
import UpgradeModal from '@/components/UpgradeModal'

interface Props {
  detectedFirm: string | null
  detectedAccountNumber: string | null
  onCreated: (account: PropAccount) => void
  onSkip: () => void
  onClose: () => void
}

const DRAWDOWN_LABELS: Record<DrawdownType, string> = {
  trailing: 'Trailing',
  trailing_eod: 'Trailing EOD',
  static_eod: 'Static (EOD)',
  static_intraday: 'Static (Intraday)',
  static: 'Static',
}

export default function NewAccountWizard({
  detectedFirm,
  detectedAccountNumber,
  onCreated,
  onSkip,
  onClose,
}: Props) {
  // Resolve the detected firm preset
  const initialPreset =
    PROP_FIRM_PRESETS.find(p => p.firmName === detectedFirm) ??
    PROP_FIRM_PRESETS.find(p => p.firmName === 'Custom / Other') ??
    PROP_FIRM_PRESETS[0]

  const initialPlan = initialPreset.plans[0] ?? null

  // ── Form state ────────────────────────────────────────────────────────────
  const [firmPreset, setFirmPreset]         = useState<PropFirmPreset>(initialPreset)
  const [selectedPlan, setSelectedPlan]     = useState<PropFirmPlan | null>(initialPlan)
  const [nickname, setNickname]             = useState(detectedAccountNumber ?? '')
  const [accountNumber, setAccountNumber]   = useState(detectedAccountNumber ?? '')
  const [status, setStatus]                 = useState<AccountStatus>('evaluation')
  const [startingBalance, setStartingBalance] = useState(
    initialPlan ? initialPlan.size * 1000 : 50000
  )
  const [dailyLossLimit, setDailyLossLimit] = useState<string>(
    initialPlan?.dailyLossLimit != null ? String(initialPlan.dailyLossLimit) : ''
  )
  const [maxLossLimit, setMaxLossLimit]     = useState<string>(
    initialPlan ? String(initialPlan.drawdown) : ''
  )
  const [drawdownType, setDrawdownType]     = useState<DrawdownType>(
    initialPlan?.drawdownType ?? 'static_eod'
  )
  const [profitTarget, setProfitTarget]     = useState<string>(
    initialPlan?.profitTarget != null ? String(initialPlan.profitTarget) : ''
  )
  const [saving, setSaving]                 = useState(false)
  const [saved, setSaved]                   = useState(false)
  const [accountLimitHit, setAccountLimitHit] = useState(false)
  const { user } = useAuth()

  // ── Sync fields when plan changes ─────────────────────────────────────────
  function applyPlan(plan: PropFirmPlan | null) {
    if (!plan) return
    setSelectedPlan(plan)
    setStartingBalance(plan.size * 1000)
    setDailyLossLimit(plan.dailyLossLimit != null ? String(plan.dailyLossLimit) : '')
    setMaxLossLimit(String(plan.drawdown))
    setDrawdownType(plan.drawdownType)
    setProfitTarget(plan.profitTarget != null ? String(plan.profitTarget) : '')
  }

  function handleFirmChange(firmName: string) {
    const preset = PROP_FIRM_PRESETS.find(p => p.firmName === firmName) ?? PROP_FIRM_PRESETS[0]
    setFirmPreset(preset)
    applyPlan(preset.plans[0] ?? null)
  }

  function handlePlanChange(planId: string) {
    const plan = firmPreset.plans.find(p => p.planId === planId) ?? null
    applyPlan(plan)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleCreate() {
    // Enforce free plan account limit (max 3)
    if (user?.user_metadata?.plan !== 'pro') {
      const existing = await dl.getPropAccounts()
      if (existing.length >= 3) {
        setAccountLimitHit(true)
        return
      }
    }
    setSaving(true)
    const now = new Date().toISOString()

    const account: PropAccount = {
      id: uuidv4(),
      firmName: firmPreset.firmName,
      nickname: nickname.trim() || accountNumber.trim() || firmPreset.firmName,
      accountNumber: accountNumber.trim(),
      startingBalance,
      status,
      dailyLossLimit: dailyLossLimit !== '' ? parseFloat(dailyLossLimit) : null,
      maxLossLimit: parseFloat(maxLossLimit) || 0,
      drawdownType,
      profitTarget: profitTarget !== '' ? parseFloat(profitTarget) : null,
      maxDailyTrades: null,
      minTradingDays: selectedPlan?.minTradingDays ?? 5,
      consistencyRule: selectedPlan?.consistencyRule ?? '',
      evalCost: selectedPlan?.evalCost ?? null,
      activationFee: selectedPlan?.activationFee ?? null,
      daysToPayout: selectedPlan?.daysToPayout ?? 14,
      maxFundedAccounts: selectedPlan?.maxFundedAccounts ?? 1,
      resetFee: selectedPlan?.resetFee ?? null,
      createdAt: now,
    }

    await dl.savePropAccount(account)
    setSaved(true)
    setSaving(false)

    setTimeout(() => {
      onCreated(account)
    }, 600)
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="px-6 pt-6 pb-4"
          style={{ background: 'linear-gradient(135deg, rgba(45,139,78,0.18) 0%, rgba(74,222,80,0.08) 100%)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}
              >
                <Building2 size={20} className="text-[var(--text-primary)]" />
              </div>
              <div>
                <h2 className="text-[var(--text-primary)] font-bold text-lg leading-tight">
                  New Account Detected
                </h2>
                <p className="text-xs text-[var(--text-muted)] dark:text-[#94A3B8] mt-0.5">
                  Set up this account before importing trades
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Detected info pill */}
          {detectedAccountNumber && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2D8B4E]/10 border border-[#2D8B4E]/20">
              <Sparkles size={13} className="text-[#4ADE50] flex-shrink-0" />
              <span className="text-xs text-[#2D8B4E] dark:text-[#4ADE50] font-medium">
                Detected:&nbsp;<span className="font-mono">{detectedAccountNumber}</span>
                {detectedFirm && <> &mdash; {detectedFirm}</>}
              </span>
            </div>
          )}
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">

          {/* Firm + Plan row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5">
                Prop Firm
              </label>
              <div className="relative">
                <select
                  className="input-field w-full text-sm appearance-none pr-8"
                  value={firmPreset.firmName}
                  onChange={e => handleFirmChange(e.target.value)}
                >
                  {PROP_FIRM_PRESETS.map(p => (
                    <option key={p.firmName} value={p.firmName}>{p.firmName}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5">
                Plan
              </label>
              <div className="relative">
                <select
                  className="input-field w-full text-sm appearance-none pr-8"
                  value={selectedPlan?.planId ?? ''}
                  onChange={e => handlePlanChange(e.target.value)}
                >
                  {firmPreset.plans.map(p => (
                    <option key={p.planId} value={p.planId}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)]" />

          {/* Nickname + Account number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5">
                Nickname
              </label>
              <input
                type="text"
                className="input-field w-full text-sm"
                placeholder="e.g. Main Eval"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                className="input-field w-full text-sm font-mono"
                placeholder="e.g. APEX12345"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5">
              Status
            </label>
            <div className="flex gap-2">
              {(['evaluation', 'funded'] as AccountStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    status === s
                      ? 'border-[#2D8B4E] text-[#2D8B4E] bg-[#2D8B4E]/10'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[#2D8B4E]/40'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)]" />

          {/* Risk params grid */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Info size={12} className="text-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)] dark:text-[var(--text-secondary)]">
                Pre-filled from plan — adjust as needed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5">
                  Starting Balance ($)
                </label>
                <input
                  type="number"
                  className="input-field w-full text-sm"
                  value={startingBalance}
                  onChange={e => setStartingBalance(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5">
                  Max Drawdown / Loss ($)
                </label>
                <input
                  type="number"
                  className="input-field w-full text-sm"
                  value={maxLossLimit}
                  onChange={e => setMaxLossLimit(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5">
                  Daily Loss Limit ($)
                  <span className="ml-1 text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  className="input-field w-full text-sm"
                  placeholder="None"
                  value={dailyLossLimit}
                  onChange={e => setDailyLossLimit(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5">
                  Profit Target ($)
                  <span className="ml-1 text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  className="input-field w-full text-sm"
                  placeholder="None"
                  value={profitTarget}
                  onChange={e => setProfitTarget(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5">
                  Drawdown Type
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      ['trailing', 'Trailing'],
                      ['static_eod', 'Static EOD'],
                      ['static_intraday', 'Static Intraday'],
                      ['static', 'Static'],
                    ] as [DrawdownType, string][]
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setDrawdownType(val)}
                      className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                        drawdownType === val
                          ? 'border-[#2D8B4E] text-[#2D8B4E] bg-[#2D8B4E]/10'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[#2D8B4E]/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Upgrade modal (replaces amber warning) ──────────────── */}
        <UpgradeModal open={accountLimitHit} onClose={() => setAccountLimitHit(false)} />

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div
          className="px-6 py-4 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onSkip}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-muted)] dark:hover:text-[#94A3B8] transition-colors font-medium"
          >
            Skip — import without linking
          </button>

          <button
            onClick={handleCreate}
            disabled={saving || saved || accountLimitHit}
            className="btn-primary disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle size={15} className="text-[var(--text-primary)]" />
                Account Created!
              </>
            ) : saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Building2 size={15} />
                Create Account &amp; Import
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
