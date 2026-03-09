'use client'
import React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Shield, CheckCircle, AlertTriangle, XCircle,
  TrendingDown, Target, Calendar, Clock, Zap, Edit2, Save, X
} from 'lucide-react'
import * as dl from '@/lib/data-layer'
import { useTrades } from '@/components/TradeContext'
import { PropAccount, DrawdownType } from '@/lib/types'
import { formatPnl } from '@/lib/calculations'

function fmtDrawdownType(t: DrawdownType) {
  const m: Record<DrawdownType, string> = {
    trailing: 'Trailing (follows equity peak)',
    trailing_eod: 'Trailing EOD',
    static_eod: 'Static EOD (checked end-of-day)',
    static_intraday: 'Static Intraday (real-time)',
    static: 'Static Fixed Amount',
  }
  return m[t] ?? t
}

function TrafficLight({ pct, invert = false }: { pct: number; invert?: boolean }) {
  const v = invert ? pct : 1 - pct
  if (v < 0.2) return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10">
      <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
      <span className="text-xs font-semibold text-[#EF4444]">Danger</span>
    </div>
  )
  if (v < 0.5) return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10">
      <span className="w-2 h-2 rounded-full bg-amber-400" />
      <span className="text-xs font-semibold text-amber-500">Caution</span>
    </div>
  )
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-[#2D8B4E]/10">
      <span className="w-2 h-2 rounded-full bg-[#4ADE50]" />
      <span className="text-xs font-semibold text-[#4ADE50]">Safe</span>
    </div>
  )
}

function RuleSection({
  title, icon: Icon, used, limit, invert = false, hideIfNoLimit = false, note
}: {
  title: string
  icon: React.ElementType
  used: number
  limit: number | null
  invert?: boolean
  hideIfNoLimit?: boolean
  note?: string
}) {
  if (hideIfNoLimit && (limit === null || limit === 0)) {
    return (
      <div className="p-5 rounded-xl border border-[#E4E9F0] dark:border-[var(--border)] bg-[#F5F7FA] dark:bg-[var(--bg-primary)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-secondary)] dark:bg-[var(--bg-card)] flex items-center justify-center">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {React.createElement(Icon as any, { size: 16, className: "text-[var(--text-muted)]" })}
            </div>
            <span className="font-semibold text-[var(--text-muted)] dark:text-[var(--text-muted)]">{title}</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] dark:bg-[var(--bg-card)] text-[var(--text-muted)] dark:text-[var(--text-muted)] font-medium">
            No limit
          </span>
        </div>
      </div>
    )
  }

  const pct = limit && limit > 0 ? Math.min(used / limit, 1) : 0
  const color = (() => {
    const v = invert ? pct : 1 - pct
    if (v < 0.2) return '#EF4444'
    if (v < 0.4) return '#F97316'
    if (v < 0.6) return '#F59E0B'
    return '#4ADE50'
  })()

  return (
    <div className="p-5 rounded-xl border border-[#E4E9F0] dark:border-[var(--border)] bg-[#F5F7FA] dark:bg-[var(--bg-primary)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${color}22` }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {React.createElement(Icon as any, { size: 16, style: { color } })}
          </div>
          <span className="font-semibold text-[#1E2D3D] dark:text-[var(--text-primary)] text-sm">{title}</span>
        </div>
        {limit !== null && limit > 0 && <TrafficLight pct={pct} invert={invert} />}
      </div>

      {limit !== null && limit > 0 ? (
        <>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-bold font-mono" style={{ color }}>
                ${used.toFixed(0)}
              </span>
              <span className="text-[var(--text-muted)] dark:text-[var(--text-muted)] font-mono text-sm"> / ${limit.toFixed(0)}</span>
            </div>
            {invert && (
              <span className="text-sm font-semibold font-mono text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                ${(limit - used).toFixed(0)} remaining
              </span>
            )}
          </div>
          <div className="h-3 rounded-full bg-[var(--bg-secondary)] dark:bg-[var(--bg-card)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct * 100}%`, backgroundColor: color }}
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] dark:text-[var(--text-muted)] mt-1.5">
            {(pct * 100).toFixed(1)}% {invert ? 'used' : 'achieved'}
          </p>
        </>
      ) : (
        <p className="text-[var(--text-muted)] dark:text-[var(--text-muted)] text-sm">No limit set</p>
      )}

      {note && (
        <p className="text-[11px] text-[var(--text-muted)] dark:text-[var(--text-muted)] mt-2 pt-2 border-t border-[#E4E9F0] dark:border-[var(--border)]">
          {note}
        </p>
      )}
    </div>
  )
}

export default function RulesPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [account, setAccount] = useState<PropAccount | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<PropAccount>>({})
  const { trades: allTrades } = useTrades()

  useEffect(() => {
    async function load() {
      const a = await dl.getPropAccount(id)
      if (!a) router.push('/accounts')
      else { setAccount(a); setForm(a) }
    }
    load()
  }, [id, router])

  const trades = useMemo(() => allTrades.filter(t => t.accountId === id), [allTrades, id])
  const totalPnl = useMemo(() => trades.reduce((s, t) => s + t.netPnl, 0), [trades])
  const todayStr = new Date().toISOString().split('T')[0]
  const todayPnl = useMemo(
    () => trades.filter(t => t.sessionDate === todayStr).reduce((s, t) => s + t.netPnl, 0),
    [trades, todayStr]
  )
  const drawdownUsed = Math.max(0, -totalPnl)
  const dailyLossUsed = Math.max(0, -todayPnl)
  const daysTradedCount = useMemo(() => new Set(trades.map(t => t.sessionDate)).size, [trades])

  const handleSave = async () => {
    if (!account || !form) return
    const updated = { ...account, ...form } as PropAccount
    await dl.savePropAccount(updated)
    setAccount(updated)
    setEditing(false)
  }

  if (!account) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#4ADE50] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl border border-[#E4E9F0] dark:border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[#1E2D3D] dark:hover:text-[var(--text-primary)] transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#2D8B4E]" />
            <h1 className="page-title">Account Rules</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)] dark:text-[var(--text-muted)] mt-0.5">
            {account.nickname || account.firmName} · {account.firmName}
          </p>
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          className={editing ? 'btn-primary' : 'btn-secondary'}
        >
          {editing ? <><Save size={14} /> Save</> : <><Edit2 size={14} /> Edit Rules</>}
        </button>
        {editing && (
          <button onClick={() => { setEditing(false); setForm(account) }} className="btn-secondary">
            <X size={14} /> Cancel
          </button>
        )}
      </div>

      {editing ? (
        /* Edit Mode */
        <div className="glass-card p-5 space-y-4">
          <h2 className="font-bold text-[#1E2D3D] dark:text-[var(--text-primary)]">Edit Rules</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Max Loss Limit ($)</label>
              <input type="number" className="input-field font-mono" value={form.maxLossLimit || ''}
                onChange={e => setForm(f => ({ ...f, maxLossLimit: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="label">Daily Loss Limit ($) <span className="text-[#9EB0C0] font-normal">(0 = none)</span></label>
              <input type="number" className="input-field font-mono"
                value={form.dailyLossLimit !== null ? form.dailyLossLimit || '' : ''}
                onChange={e => setForm(f => ({ ...f, dailyLossLimit: e.target.value ? parseFloat(e.target.value) : null }))} />
            </div>
            <div>
              <label className="label">Profit Target ($) <span className="text-[#9EB0C0] font-normal">(0 = none)</span></label>
              <input type="number" className="input-field font-mono"
                value={form.profitTarget !== null ? form.profitTarget || '' : ''}
                onChange={e => setForm(f => ({ ...f, profitTarget: e.target.value ? parseFloat(e.target.value) : null }))} />
            </div>
            <div>
              <label className="label">Min Trading Days</label>
              <input type="number" className="input-field font-mono" value={form.minTradingDays || 0}
                onChange={e => setForm(f => ({ ...f, minTradingDays: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="label">Drawdown Type</label>
            <select className="input-field" value={form.drawdownType || 'static_eod'}
              onChange={e => setForm(f => ({ ...f, drawdownType: e.target.value as DrawdownType }))}>
              <option value="static_eod">Static EOD — checked end-of-day</option>
              <option value="trailing">Trailing — follows equity peak intraday</option>
              <option value="trailing_eod">Trailing EOD — trails equity peak, checked end-of-day</option>
              <option value="static_intraday">Static Intraday — real-time fixed limit</option>
              <option value="static">Static Fixed — never moves</option>
            </select>
          </div>
          <div>
            <label className="label">Consistency Rule</label>
            <textarea className="input-field min-h-[80px] resize-none" value={form.consistencyRule || ''}
              onChange={e => setForm(f => ({ ...f, consistencyRule: e.target.value }))}
              placeholder="e.g. No single day can represent more than 30% of total profits" />
          </div>
        </div>
      ) : (
        /* View Mode */
        <>
          {/* Live rule bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RuleSection
              title="Max Drawdown"
              icon={TrendingDown}
              used={drawdownUsed}
              limit={account.maxLossLimit}
              invert
              note={`Drawdown type: ${fmtDrawdownType(account.drawdownType)}`}
            />
            <RuleSection
              title="Daily Loss Limit"
              icon={Calendar}
              used={dailyLossUsed}
              limit={account.dailyLossLimit}
              invert
              hideIfNoLimit
            />
            <RuleSection
              title="Profit Target"
              icon={Target}
              used={Math.max(0, totalPnl)}
              limit={account.profitTarget}
            />
            {account.minTradingDays > 0 && (
              <RuleSection
                title={`Min Trading Days (${daysTradedCount} / ${account.minTradingDays})`}
                icon={Clock}
                used={daysTradedCount}
                limit={account.minTradingDays}
              />
            )}
          </div>

          {/* Drawdown Type Info */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-[#2D8B4E]" />
              <h2 className="section-title">Drawdown Type: {fmtDrawdownType(account.drawdownType)}</h2>
            </div>
            {account.drawdownType === 'trailing' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Trailing Drawdown</p>
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  The drawdown limit moves up as your balance reaches new highs — it never moves down. 
                  Your maximum loss is calculated from your highest-ever balance, not just your starting balance.
                  This means profits can actually reduce your buffer if they create a new high-water mark.
                </p>
              </div>
            )}
            {account.drawdownType === 'static_eod' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/30">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Static EOD Drawdown</p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  The drawdown limit is fixed from your starting balance and only checked at the end of the trading session.
                  Intraday paper losses don't trigger a breach — only your final EOD balance matters.
                </p>
              </div>
            )}
            {account.drawdownType === 'static_intraday' && (
              <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-200 dark:border-purple-500/30">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-1">Static Intraday Drawdown</p>
                <p className="text-xs text-purple-600 dark:text-purple-300">
                  The drawdown limit is fixed but applied in real-time during the trading session.
                  If your account drops below the threshold at any point intraday, you breach the rule.
                </p>
              </div>
            )}
            {account.drawdownType === 'static' && (
              <div className="p-3 bg-[#F5F7FA] dark:bg-[var(--bg-primary)] rounded-xl border border-[#E4E9F0] dark:border-[var(--border)]">
                <p className="text-sm font-semibold text-[#1E2D3D] dark:text-[var(--text-primary)] mb-1">Static Fixed Drawdown</p>
                <p className="text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                  A fixed dollar amount that is the maximum loss allowed from your starting balance.
                  This limit never changes regardless of profits made.
                </p>
              </div>
            )}
          </div>

          {/* Consistency Rule */}
          {account.consistencyRule && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-500" />
                <h2 className="section-title">Consistency Rule</h2>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-300">{account.consistencyRule}</p>
              </div>
              <p className="text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)] mt-3">
                Violating the consistency rule may result in failing the evaluation even if you hit the profit target.
                Trade consistently every day rather than making it all in one session.
              </p>
            </div>
          )}

          {/* Plan Metadata */}
          {(account.evalCost || account.activationFee || account.resetFee || account.daysToPayout) && (
            <div className="glass-card p-5">
              <h2 className="section-title mb-4">Plan Costs</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {account.evalCost && (
                  <div className="p-3 bg-[#F5F7FA] dark:bg-[var(--bg-primary)] rounded-xl">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Eval Cost</p>
                    <p className="font-semibold text-[#1E2D3D] dark:text-[var(--text-primary)]">${account.evalCost}/mo</p>
                  </div>
                )}
                {account.activationFee ? (
                  <div className="p-3 bg-[#F5F7FA] dark:bg-[var(--bg-primary)] rounded-xl">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Activation</p>
                    <p className="font-semibold text-[#1E2D3D] dark:text-[var(--text-primary)]">${account.activationFee}</p>
                  </div>
                ) : null}
                {account.resetFee ? (
                  <div className="p-3 bg-[#F5F7FA] dark:bg-[var(--bg-primary)] rounded-xl">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Reset Fee</p>
                    <p className="font-semibold text-[#1E2D3D] dark:text-[var(--text-primary)]">${account.resetFee}</p>
                  </div>
                ) : null}
                {account.daysToPayout ? (
                  <div className="p-3 bg-[#F5F7FA] dark:bg-[var(--bg-primary)] rounded-xl">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Days to Payout</p>
                    <p className="font-semibold text-[#1E2D3D] dark:text-[var(--text-primary)]">
                      {account.daysToPayout <= 1 ? 'Same day' : `${account.daysToPayout} days`}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
