'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Gauge, Target, Clock, DollarSign, TrendingDown,
  Pencil, Plus, Trash2, X, Save, ChevronRight, AlertTriangle,
  CheckCircle2, Circle, Activity, ShieldAlert, BarChart2, Timer,
  Check
} from 'lucide-react'
import * as dl from '@/lib/data-layer'
import WeeklyReportCard from '@/components/WeeklyReportCard'
import { DailyChecklist, Trade } from '@/lib/types'
import { getTodaySessionDate } from '@/lib/session'
import ProGate from '@/components/ProGate'
import { useTrades } from '@/components/TradeContext'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProgressRule {
  id: string
  type: 'start_time' | 'max_loss_trade' | 'max_loss_day' | 'max_trades' | 'no_revenge' | 'profit_target' | 'custom'
  name: string
  condition: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const RULE_TYPE_LABELS: Record<ProgressRule['type'], string> = {
  start_time: 'Start day by time',
  max_loss_trade: 'Net max loss/trade',
  max_loss_day: 'Net max loss/day',
  max_trades: 'Max trades/day',
  no_revenge: 'No revenge trading',
  profit_target: 'Profit target',
  custom: 'Custom',
}

const RULE_TYPE_ICONS: Record<ProgressRule['type'], typeof Clock> = {
  start_time: Clock,
  max_loss_trade: TrendingDown,
  max_loss_day: ShieldAlert,
  max_trades: BarChart2,
  no_revenge: Timer,
  profit_target: Target,
  custom: Activity,
}

const GLASS = 'glass-card'

const HEATMAP_COLORS = [
  'bg-[var(--border)]',
  'bg-[#14532d]/60',
  'bg-[#166534]/80',
  'bg-[#15803d]',
  'bg-[#22c55e]',
  'bg-[#4ade80]',
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Helpers ────────────────────────────────────────────────────────────────────

function getRulesFromStorage(): ProgressRule[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('sf_rules') || '[]') } catch { return [] }
}

function saveRulesToStorage(rules: ProgressRule[]) {
  localStorage.setItem('sf_rules', JSON.stringify(rules))
}

function isSetupDone(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('sf_rules_setup_done') === 'true'
}

function markSetupDone() {
  localStorage.setItem('sf_rules_setup_done', 'true')
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function sessionDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getColorIndex(pct: number): number {
  if (pct <= 0) return 0
  if (pct <= 25) return 1
  if (pct <= 50) return 2
  if (pct <= 75) return 3
  if (pct < 100) return 4
  return 5
}

function getFollowRateColor(pct: number): string {
  if (pct >= 80) return 'text-[#4ADE80]'
  if (pct >= 50) return 'text-orange-400'
  return 'text-[#FF453A]'
}

// ── Semi-circle Gauge ──────────────────────────────────────────────────────────

function SemiCircleGauge({ value }: { value: number | null }) {
  const pct = value ?? 0
  const angle = (pct / 100) * 180
  const radius = 60
  const cx = 70
  const cy = 70
  const endAngle = Math.PI - (angle * Math.PI) / 180
  const endX = cx + radius * Math.cos(endAngle)
  const endY = cy - radius * Math.sin(endAngle)
  const largeArc = angle > 180 ? 1 : 0
  const color = pct >= 80 ? '#4ADE80' : pct >= 50 ? '#F59E0B' : '#FF453A'

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round"
        />
        {pct > 0 && (
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          />
        )}
      </svg>
      <span className="text-2xl font-bold text-[var(--text-primary)] -mt-4">
        {value !== null ? `${Math.round(pct)}%` : '--'}
      </span>
    </div>
  )
}

// ── Onboarding Modal ───────────────────────────────────────────────────────────

interface OnboardingRule {
  type: ProgressRule['type']
  name: string
  description: string
  icon: typeof Clock
  hasInput: boolean
  inputPlaceholder?: string
  inputPrefix?: string
  defaultCondition?: string
}

const ONBOARDING_RULES: OnboardingRule[] = [
  { type: 'start_time', name: 'Start day by time', description: 'Only trade after 9:30 AM EST', icon: Clock, hasInput: false, defaultCondition: '09:30' },
  { type: 'max_loss_trade', name: 'Max loss per trade', description: 'Stop if any single trade loses more than $X', icon: TrendingDown, hasInput: true, inputPlaceholder: '100', inputPrefix: '$' },
  { type: 'max_loss_day', name: 'Max loss per day', description: 'Stop trading if daily loss exceeds $X', icon: ShieldAlert, hasInput: true, inputPlaceholder: '500', inputPrefix: '$' },
  { type: 'max_trades', name: 'Max trades per day', description: 'No more than X trades per session', icon: BarChart2, hasInput: true, inputPlaceholder: '5' },
  { type: 'no_revenge', name: 'No revenge trading', description: 'Wait 15 min after a losing trade before re-entering', icon: Timer, hasInput: false, defaultCondition: '15 min cooldown' },
  { type: 'profit_target', name: 'Profit target', description: 'Stop trading after reaching $X profit', icon: Target, hasInput: true, inputPlaceholder: '500', inputPrefix: '$' },
]

function OnboardingModal({ onComplete, onClose, existingRules }: { onComplete: (rules: ProgressRule[]) => void; onClose?: () => void; existingRules?: ProgressRule[] }) {
  // Pre-populate from existing rules if editing
  const initSelected = existingRules?.filter(r => r.type !== 'custom').map(r => r.type) || []
  const initValues: Record<string, string> = {}
  existingRules?.forEach(r => { if (r.type !== 'custom' && r.condition) initValues[r.type] = r.condition })
  const customRules = existingRules?.filter(r => r.type === 'custom') || []

  const [selected, setSelected] = useState<string[]>(initSelected)
  const [values, setValues] = useState<Record<string, string>>(initValues)
  const [custom1, setCustom1] = useState(customRules[0]?.name || '')
  const [custom2, setCustom2] = useState(customRules[1]?.name || '')

  const toggle = (type: string) => {
    setSelected(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const totalSelected = selected.length + (custom1.trim() ? 1 : 0) + (custom2.trim() ? 1 : 0)

  const handleStart = () => {
    if (totalSelected === 0) return
    const rules: ProgressRule[] = []
    ONBOARDING_RULES.forEach(r => {
      if (!selected.includes(r.type)) return
      const condition = r.hasInput ? (values[r.type] || r.inputPlaceholder || '') : (r.defaultCondition || '')
      rules.push({ id: `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`, type: r.type, name: r.name, condition })
    })
    if (custom1.trim()) {
      rules.push({ id: `rule-${Date.now()}-1`, type: 'custom', name: custom1.trim(), condition: 'Active' })
    }
    if (custom2.trim()) {
      rules.push({ id: `rule-${Date.now()}-2`, type: 'custom', name: custom2.trim(), condition: 'Active' })
    }
    console.log('handleStart rules:', rules)
    saveRulesToStorage(rules)
    markSetupDone()
    onComplete(rules)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md overflow-y-auto" style={{WebkitOverflowScrolling:"touch"}}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl bg-[var(--bg-primary)] border border-[var(--border)] rounded-3xl p-8 mx-auto my-8"
      >
        {/* Header */}
        <div className="text-center mb-8 relative">
          {onClose && (
            <button onClick={onClose} className="absolute top-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-all">
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4ADE80]/30 to-[#4ADE80]/10 border border-[#4ADE80]/20 flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-[#4ADE80]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{existingRules ? 'Edit your trading rules' : 'Set your trading rules'}</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Choose the rules you want to track every session. You can always edit them later.
          </p>
        </div>

        {/* Rule cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {ONBOARDING_RULES.map(rule => {
            const isSelected = selected.includes(rule.type)
            const Icon = rule.icon
            return (
              <div
                key={rule.type}
                onClick={() => toggle(rule.type)}
                className={`relative cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#4ADE80]/[0.08] border-[#4ADE80]/30 shadow-[0_0_20px_rgba(74,222,128,0.08)]'
                    : 'bg-[var(--border)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--border)]'
                }`}
              >
                {/* Checkmark */}
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isSelected ? 'bg-[#4ADE80] scale-100' : 'bg-[var(--border)] scale-90'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-[#050810]" strokeWidth={3} />}
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-[#4ADE80]/20' : 'bg-[var(--border)]'
                  }`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#4ADE80]' : 'text-[var(--text-muted)]'}`} />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`text-sm font-medium mb-0.5 ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{rule.name}</p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{rule.description}</p>
                  </div>
                </div>

                {/* Input for rules that need a value */}
                {rule.hasInput && isSelected && (
                  <div
                    className="mt-3"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="relative">
                      {rule.inputPrefix && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">{rule.inputPrefix}</span>
                      )}
                      <input
                        type="text"
                        value={values[rule.type] || ''}
                        onChange={e => setValues(v => ({ ...v, [rule.type]: e.target.value }))}
                        placeholder={rule.inputPlaceholder}
                        className={`w-full bg-[var(--border)] border border-[var(--border)] rounded-xl py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/40 focus:outline-none focus:border-[#4ADE80]/40 ${
                          rule.inputPrefix ? 'pl-7 pr-3' : 'px-3'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Custom rules */}
        <div className="space-y-3 mb-8">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Custom Rules</p>
          <input
            value={custom1}
            onChange={e => setCustom1(e.target.value)}
            placeholder="Custom rule name (optional)"
            className="w-full bg-[var(--border)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/40 focus:outline-none focus:border-[#4ADE80]/40"
          />
          <input
            value={custom2}
            onChange={e => setCustom2(e.target.value)}
            placeholder="Custom rule name (optional)"
            className="w-full bg-[var(--border)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]/40 focus:outline-none focus:border-[#4ADE80]/40"
          />
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={totalSelected === 0}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
            totalSelected > 0
              ? 'bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-[#050810] hover:shadow-[0_0_30px_rgba(74,222,128,0.3)] hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
          }`}
        >
          {totalSelected > 0 ? `${existingRules ? 'Save' : 'Start Tracking'} (${totalSelected} rule${totalSelected !== 1 ? 's' : ''})` : 'Select at least 1 rule'}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Rule Editor Modal ──────────────────────────────────────────────────────────

function RuleEditor({
  rules,
  onSave,
  onClose,
}: {
  rules: ProgressRule[]
  onSave: (rules: ProgressRule[]) => void
  onClose: () => void
}) {
  const [editRules, setEditRules] = useState<ProgressRule[]>([...rules])
  const [newType, setNewType] = useState<ProgressRule['type']>('start_time')
  const [newCondition, setNewCondition] = useState('')
  const [newName, setNewName] = useState('')

  const addRule = () => {
    if (!newCondition.trim()) return
    const name = newName.trim() || RULE_TYPE_LABELS[newType]
    const rule: ProgressRule = {
      id: crypto.randomUUID(),
      type: newType,
      name,
      condition: newCondition.trim(),
    }
    setEditRules(prev => [...prev, rule])
    setNewCondition('')
    setNewName('')
  }

  const removeRule = (id: string) => {
    setEditRules(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backdropFilter:'blur(16px)', background:'rgba(0,0,0,0.7)'}}>
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{background:'var(--bg-primary)', border:'1px solid var(--border)'}}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#4ADE80]/40 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Rule Maker</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Define your trading discipline rules</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing rules */}
        {editRules.length > 0 && (
          <div className="px-7 pb-4 space-y-2 max-h-48 overflow-y-auto">
            {editRules.map(rule => {
              const Icon = RULE_TYPE_ICONS[rule.type]
              return (
                <div key={rule.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{background:'var(--bg-secondary)', border:'1px solid var(--border)'}}>
                  <div className="w-7 h-7 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#4ADE80]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{rule.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{rule.condition}</p>
                  </div>
                  <button onClick={() => removeRule(rule.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-[#FF453A]/40 hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
        {editRules.length === 0 && (
          <div className="px-7 pb-4">
            <div className="py-6 rounded-2xl text-center" style={{background:'var(--bg-secondary)', border:'1px solid var(--border)'}}>
              <p className="text-sm text-[var(--text-secondary)]">No rules yet — add one below</p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="mx-7 border-t border-[var(--border)] mb-5" />

        {/* Add rule section */}
        <div className="px-7 pb-6 space-y-3">
          <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Add Rule</p>

          {/* Rule type — pill selector */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setNewType(k as ProgressRule['type'])}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={newType === k
                  ? {background:'rgba(74,222,128,0.15)', border:'1px solid rgba(74,222,128,0.4)', color:'#4ADE80'}
                  : {background:'var(--bg-card)', border:'1px solid var(--border)', color:'#64748B'}
                }
              >
                {v}
              </button>
            ))}
          </div>

          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Rule name (optional)"
            className="w-full rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[#475569] focus:outline-none transition-all"
            style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}
          />
          <input
            value={newCondition}
            onChange={e => setNewCondition(e.target.value)}
            placeholder={newType === 'start_time' ? 'e.g. 09:30' : newType.includes('loss') ? 'e.g. $100' : 'Condition...'}
            className="w-full rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[#475569] focus:outline-none transition-all"
            style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}
          />
          <button
            onClick={addRule}
            className="flex items-center gap-2 text-sm font-semibold text-[#4ADE80] px-5 py-2.5 rounded-2xl transition-all hover:opacity-90"
            style={{background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)'}}
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-5" style={{borderTop:'1px solid var(--border)'}}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--border)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editRules)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-black rounded-xl transition-all hover:shadow-[0_0_20px_rgba(74,222,128,0.25)]"
            style={{background:'linear-gradient(135deg, #4ADE80, #22C55E)'}}
          >
            <Save className="w-4 h-4" />
            Save Rules
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

// ── Rule Evaluation Engine ─────────────────────────────────────────────────────
function evaluateRuleForDay(rule: ProgressRule, dayTrades: Trade[]): boolean {
  if (dayTrades.length === 0) return true // No trades = no violation

  const condition = rule.condition?.replace(/[$,]/g, '') || ''
  const numVal = parseFloat(condition)

  switch (rule.type) {
    case 'start_time': {
      // Check if first trade was after the specified time
      const limit = condition.replace(/[^0-9:]/g, '') // e.g. "09:30"
      if (!limit) return true
      const firstTrade = dayTrades.reduce((earliest, t) => {
        if (!t.entryTime) return earliest
        if (!earliest || t.entryTime < earliest) return t.entryTime
        return earliest
      }, '' as string)
      if (!firstTrade) return true // No time data
      return firstTrade >= limit
    }
    case 'max_loss_trade': {
      // No single trade should lose more than $X
      if (isNaN(numVal)) return true
      return dayTrades.every(t => t.netPnl >= -numVal)
    }
    case 'max_loss_day': {
      // Total daily loss shouldn't exceed $X
      if (isNaN(numVal)) return true
      const totalPnl = dayTrades.reduce((s, t) => s + t.netPnl, 0)
      return totalPnl >= -numVal
    }
    case 'max_trades': {
      // No more than X trades per day
      if (isNaN(numVal)) return true
      return dayTrades.length <= numVal
    }
    case 'no_revenge': {
      // After a losing trade, must wait before re-entering
      // Simple check: no two consecutive losing trades
      const sorted = [...dayTrades].sort((a, b) => (a.entryTime || '').localeCompare(b.entryTime || ''))
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i - 1].netPnl < 0 && sorted[i].netPnl < 0) return false
      }
      return true
    }
    case 'profit_target': {
      // Stop trading after reaching $X profit (check if traded past target)
      if (isNaN(numVal)) return true
      const sorted = [...dayTrades].sort((a, b) => (a.entryTime || '').localeCompare(b.entryTime || ''))
      let running = 0
      for (let i = 0; i < sorted.length; i++) {
        running += sorted[i].netPnl
        if (running >= numVal && i < sorted.length - 1) return false // Kept trading after target
      }
      return true
    }
    default:
      return true // Custom rules can't be auto-evaluated
  }
}

function evaluateRules(rules: ProgressRule[], trades: Trade[]): Map<string, { streak: number; followRate: number; avgPnlFollowed: number; avgPnlBroken: number; daysChecked: number }> {
  // Group trades by session date
  const byDay = new Map<string, Trade[]>()
  trades.forEach(t => {
    const sd = t.sessionDate || t.date
    if (!byDay.has(sd)) byDay.set(sd, [])
    byDay.get(sd)!.push(t)
  })

  // Get sorted trading days (most recent first)
  const tradingDays = [...byDay.keys()].sort().reverse()

  const results = new Map<string, { streak: number; followRate: number; avgPnlFollowed: number; avgPnlBroken: number; daysChecked: number }>()

  for (const rule of rules) {
    let streak = 0
    let followed = 0
    let broken = 0
    let pnlFollowed = 0
    let pnlBroken = 0
    let streakActive = true

    for (const day of tradingDays) {
      const dayTrades = byDay.get(day)!
      const passed = evaluateRuleForDay(rule, dayTrades)
      const dayPnl = dayTrades.reduce((s, t) => s + t.netPnl, 0)

      if (passed) {
        followed++
        pnlFollowed += dayPnl
        if (streakActive) streak++
      } else {
        broken++
        pnlBroken += dayPnl
        streakActive = false
      }
    }

    const total = followed + broken
    results.set(rule.id, {
      streak,
      followRate: total > 0 ? (followed / total) * 100 : 0,
      avgPnlFollowed: followed > 0 ? pnlFollowed / followed : 0,
      avgPnlBroken: broken > 0 ? pnlBroken / broken : 0,
      daysChecked: total,
    })
  }

  return results
}

export default function ProgressPage() {
  const { trades } = useTrades()
  const [rules, setRules] = useState<ProgressRule[]>([])
  const [todayChecklist, setTodayChecklist] = useState<DailyChecklist | null>(null)
  const [allChecklists, setAllChecklists] = useState<DailyChecklist[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load rules from localStorage instantly — no async DB calls needed
    const storedRules = getRulesFromStorage()
    setRules(storedRules)
    if (!isSetupDone() && storedRules.length === 0) {
      setShowOnboarding(true)
    }
    setLoading(false)
  }, [])

  // Evaluate rules against real trade data
  const ruleStats = useMemo(() => evaluateRules(rules, trades), [rules, trades])

  const todayChecked = todayChecklist?.items.filter(i => i.checked).length ?? 0
  const todayTotal = todayChecklist?.items.length ?? 0
  const todayPct = todayTotal > 0 ? (todayChecked / todayTotal) * 100 : 0

  const streak = useMemo(() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 90; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = sessionDateStr(d)
      const cl = allChecklists.find(c => c.sessionDate === dateStr)
      if (!cl || !cl.savedAt) break
      const all = cl.items.length > 0 && cl.items.every(item => item.checked)
      if (all) count++
      else break
    }
    return count
  }, [allChecklists])

  const periodScore = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const monthLists = allChecklists.filter(c => {
      const [y, m] = c.sessionDate.split('-').map(Number)
      return y === year && m === month + 1 && c.savedAt
    })
    if (monthLists.length === 0) return null
    let total = 0, checked = 0
    monthLists.forEach(c => {
      total += c.items.length
      checked += c.items.filter(i => i.checked).length
    })
    return total > 0 ? (checked / total) * 100 : null
  }, [allChecklists])

  const heatmapData = useMemo(() => {
    const today = new Date()
    const data: { date: Date; pct: number; checked: number; total: number }[] = []
    const startDay = new Date(today)
    startDay.setDate(startDay.getDate() - 90 + (7 - startDay.getDay()))
    for (let i = 0; i < 91; i++) {
      const d = new Date(startDay)
      d.setDate(d.getDate() + i)
      if (d > today) { data.push({ date: d, pct: -1, checked: 0, total: 0 }); continue }
      const dateStr = sessionDateStr(d)
      const cl = allChecklists.find(c => c.sessionDate === dateStr)
      if (cl && cl.savedAt && cl.items.length > 0) {
        const checked = cl.items.filter(it => it.checked).length
        data.push({ date: d, pct: (checked / cl.items.length) * 100, checked, total: cl.items.length })
      } else {
        data.push({ date: d, pct: -1, checked: 0, total: 0 })
      }
    }
    return data
  }, [allChecklists])

  const heatmapWeeks = useMemo(() => {
    const weeks: typeof heatmapData[] = []
    for (let i = 0; i < heatmapData.length; i += 7) {
      weeks.push(heatmapData.slice(i, i + 7))
    }
    return weeks
  }, [heatmapData])

  const getConditionDisplay = (rule: ProgressRule) => {
    switch (rule.type) {
      case 'start_time': return `Before ${rule.condition}`
      case 'max_loss_trade': return `Max $${rule.condition}/trade`
      case 'max_loss_day': return `Max $${rule.condition}/day`
      case 'max_trades': return `Max ${rule.condition} trades`
      case 'no_revenge': return rule.condition
      case 'profit_target': return `Target $${rule.condition}`
      default: return rule.condition
    }
  }

  const getRuleProgress = (rule: ProgressRule) => {
    switch (rule.type) {
      case 'start_time': return `None / ${rule.condition}`
      case 'max_loss_trade': return `$0 / $${rule.condition}`
      case 'max_loss_day': return `$0 / $${rule.condition}`
      case 'max_trades': return `0 / ${rule.condition}`
      case 'profit_target': return `$0 / $${rule.condition}`
      default: return '0/0'
    }
  }

  const handleSaveRules = (newRules: ProgressRule[]) => {
    setRules(newRules)
    saveRulesToStorage(newRules)
    setEditOpen(false)
  }

  const handleOnboardingComplete = (newRules: ProgressRule[]) => {
    setRules(newRules)
    saveRulesToStorage(newRules)
    markSetupDone()
    setShowOnboarding(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ProGate feature="progress" mode="block">
    <div className="space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#4ADE80]/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-[#4ADE80]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Progress Tracker</h1>
          <p className="text-sm text-[var(--text-muted)]">Track your trading discipline</p>
        </div>
      </div>

      {/* Weekly Report Card */}
      <WeeklyReportCard />

      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Stats */}
        <div className="lg:col-span-3 space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${GLASS} p-4 sm:p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Current Streak</span>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{streak}</div>
            <div className="text-sm text-[var(--text-muted)]">{streak === 1 ? 'day' : 'days'}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${GLASS} p-4 sm:p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Current Period Score</span>
            </div>
            <SemiCircleGauge value={periodScore} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${GLASS} p-4 sm:p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-[#4ADE80]" />
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Today&apos;s Progress</span>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{todayChecked}/{todayTotal}</div>
            <div className="w-full h-2 rounded-full bg-[var(--border)] mt-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${todayPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-[#4ADE80]"
              />
            </div>
          </motion.div>
        </div>

        {/* Center: Daily Checklist */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`lg:col-span-4 ${GLASS} p-6`}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Daily checklist, {formatDate(new Date())}</h2>
          {rules.length > 0 && (
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">Automated Rules ({rules.length})</p>
          )}
          <div className="space-y-3">
            {rules.length === 0 && todayTotal === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto mb-2" />
                <p className="text-sm text-[var(--text-muted)]">No rules set up yet</p>
                <button onClick={() => setEditOpen(true)} className="mt-3 text-sm text-[#4ADE80] hover:text-[#4ADE80]/80 transition-colors">
                  Add your first rule
                </button>
              </div>
            ) : (
              <>
                {rules.map(rule => {
                  const Icon = RULE_TYPE_ICONS[rule.type]
                  return (
                    <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                      <div className="w-8 h-8 rounded-lg bg-[var(--border)] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{rule.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{getRuleProgress(rule)}</p>
                      </div>
                      <Circle className="w-4 h-4 text-[var(--text-muted)]/40" />
                    </div>
                  )
                })}
                {todayChecklist?.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                    <div className="w-8 h-8 rounded-lg bg-[var(--border)] flex items-center justify-center flex-shrink-0">
                      {item.checked ? <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" /> : <Circle className="w-4 h-4 text-[var(--text-muted)]/40" />}
                    </div>
                    <p className="text-sm text-[var(--text-primary)] flex-1 truncate">{item.text}</p>
                  </div>
                ))}
              </>
            )}
          </div>
          <button className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium text-[#4ADE80] bg-[#4ADE80]/10 hover:bg-[#4ADE80]/20 border border-[#4ADE80]/20 transition-colors flex items-center justify-center gap-2">
            View this day <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Right: Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`lg:col-span-5 ${GLASS} p-6 flex flex-col gap-5`}>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Consistency Heatmap</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Rule follow-through · last 13 weeks</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
              <span>Less</span>
              {['bg-[var(--border)]','bg-[#14532d]','bg-[#166534]','bg-[#16a34a]','bg-[#22c55e]','bg-[#4ade80]'].map((col, i) => (
                <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${col}`} />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* Month labels row */}
          <div className="flex">
            <div className="w-7 shrink-0" />
            <div className="relative flex-1 h-4">
              {(() => {
                const months: { label: string; pct: number }[] = []
                let lastMonth = -1
                heatmapWeeks.forEach((week, wi) => {
                  const d = week[0]?.date
                  if (d && d.getMonth() !== lastMonth) {
                    lastMonth = d.getMonth()
                    months.push({ label: d.toLocaleString('en-US', { month: 'short' }), pct: (wi / heatmapWeeks.length) * 100 })
                  }
                })
                return months.map((m, i) => (
                  <span key={i} className="absolute text-[11px] font-medium text-[var(--text-muted)]" style={{ left: `${m.pct}%` }}>{m.label}</span>
                ))
              })()}
            </div>
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 w-7 shrink-0">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="h-[18px] flex items-center justify-end pr-1.5">
                  <span className="text-[10px] text-[#374151]">{i % 2 === 1 ? d : ''}</span>
                </div>
              ))}
            </div>
            {/* Cells */}
            <div className="flex gap-1 flex-1">
              {heatmapWeeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1 flex-1">
                  {week.map((day, di) => {
                    const pct = day.pct
                    const isEmpty = pct < 0
                    const isToday = day.date.toDateString() === new Date().toDateString()
                    const bg = isEmpty ? 'var(--bg-card)'
                      : pct < 25 ? '#14532d'
                      : pct < 50 ? '#166534'
                      : pct < 75 ? '#16a34a'
                      : pct < 90 ? '#22c55e'
                      : '#4ade80'
                    const tooltip = isEmpty ? 'No data' : `${day.checked}/${day.total} rules · ${Math.round(pct)}%`
                    return (
                      <div
                        key={di}
                        title={`${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${tooltip}`}
                        className={`h-[18px] rounded-[4px] cursor-pointer transition-all duration-150 hover:opacity-80 hover:scale-105 ${isToday ? 'ring-1 ring-white/40' : ''}`}
                        style={{ background: bg }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--border)]">
            {[
              { value: streak, label: 'Day streak' },
              { value: allChecklists.length, label: 'Days tracked' },
              { value: allChecklists.filter(c => (c.items?.filter(i => i.checked).length ?? 0) === (c.items?.length ?? 0) && (c.items?.length ?? 0) > 0).length, label: 'Perfect days' },
            ].map((s, i) => (
              <div key={i} className="text-center py-2 rounded-2xl" style={{background:'var(--bg-secondary)'}}>
                <p className="text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom: Rules table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`${GLASS} p-4 sm:p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Current rules</h2>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--border)] hover:bg-[var(--border)] px-3 py-2 rounded-xl border border-[var(--border)] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit rules
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--text-muted)]">No rules configured. Click &quot;Edit rules&quot; to add some.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider py-3 px-2">Rule</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider py-3 px-2">Condition</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider py-3 px-2">Rule Streak</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider py-3 px-2">Avg Performance</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider py-3 px-2">Follow Rate</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => {
                  const Icon = RULE_TYPE_ICONS[rule.type]
                  const stats = ruleStats.get(rule.id)
                  const followRate = stats?.followRate ?? 0
                  const streak = stats?.streak ?? 0
                  const avgFollowed = stats?.avgPnlFollowed ?? 0
                  const avgBroken = stats?.avgPnlBroken ?? 0
                  const daysChecked = stats?.daysChecked ?? 0
                  const avgDisplay = daysChecked > 0
                    ? `${avgFollowed >= 0 ? '+' : ''}$${avgFollowed.toFixed(0)} / ${avgBroken >= 0 ? '+' : ''}$${avgBroken.toFixed(0)}`
                    : '--'
                  return (
                    <tr key={rule.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${followRate >= 80 ? 'bg-[#4ADE80]/10' : followRate >= 50 ? 'bg-yellow-500/10' : daysChecked > 0 ? 'bg-[#FF453A]/10' : 'bg-[var(--border)]'}`}>
                            <Icon className={`w-4 h-4 ${followRate >= 80 ? 'text-[#4ADE80]' : followRate >= 50 ? 'text-yellow-500' : daysChecked > 0 ? 'text-[#FF453A]' : 'text-[var(--text-muted)]'}`} />
                          </div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">{rule.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-sm text-[var(--text-secondary)]">{getConditionDisplay(rule)}</td>
                      <td className="py-4 px-3">
                        <span className={`text-sm font-semibold ${streak > 0 ? 'text-[#4ADE80]' : 'text-[var(--text-primary)]'}`}>
                          {streak} {streak === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        {daysChecked > 0 ? (
                          <div className="text-xs">
                            <span className="text-[#4ADE80] font-medium">Followed: {avgFollowed >= 0 ? '+' : ''}${avgFollowed.toFixed(0)}</span>
                            <span className="text-[var(--text-muted)] mx-1">/</span>
                            <span className="text-[#FF453A] font-medium">Broke: {avgBroken >= 0 ? '+' : ''}${avgBroken.toFixed(0)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-[var(--text-muted)]">--</span>
                        )}
                      </td>
                      <td className="py-4 px-3">
                        {daysChecked > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${followRate}%`, background: followRate >= 80 ? '#4ADE80' : followRate >= 50 ? '#EAB308' : '#FF453A' }} />
                            </div>
                            <span className={`text-sm font-bold ${followRate >= 80 ? 'text-[#4ADE80]' : followRate >= 50 ? 'text-yellow-500' : 'text-[#FF453A]'}`}>
                              {followRate.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-[var(--text-muted)]">--</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Edit Rules Modal */}
      <AnimatePresence>
        {editOpen && <OnboardingModal existingRules={rules} onComplete={(newRules) => { handleSaveRules(newRules); setEditOpen(false) }} onClose={() => setEditOpen(false)} />}
      </AnimatePresence>
    </div>
    </ProGate>
  )
}
