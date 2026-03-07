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
import { DailyChecklist } from '@/lib/types'
import { getTodaySessionDate } from '@/lib/session'

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

const GLASS = 'bg-white/[0.04] backdrop-blur-[20px] border border-white/[0.06] rounded-2xl'

const HEATMAP_COLORS = [
  'bg-white/[0.04]',
  'bg-[#1a3a4a]',
  'bg-[#1a5a6a]',
  'bg-[#1a7a8a]',
  'bg-[#4ADE80]/60',
  'bg-[#4ADE80]',
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
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round"
        />
        {pct > 0 && (
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          />
        )}
      </svg>
      <span className="text-2xl font-bold text-white -mt-4">
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

function OnboardingModal({ onComplete }: { onComplete: (rules: ProgressRule[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [values, setValues] = useState<Record<string, string>>({})
  const [custom1, setCustom1] = useState('')
  const [custom2, setCustom2] = useState('')

  const toggle = (type: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const totalSelected = selected.size + (custom1.trim() ? 1 : 0) + (custom2.trim() ? 1 : 0)

  const handleStart = () => {
    if (totalSelected === 0) return
    const rules: ProgressRule[] = []
    ONBOARDING_RULES.forEach(r => {
      if (!selected.has(r.type)) return
      const condition = r.hasInput ? (values[r.type] || r.inputPlaceholder || '') : (r.defaultCondition || '')
      rules.push({ id: crypto.randomUUID(), type: r.type, name: r.name, condition })
    })
    if (custom1.trim()) {
      rules.push({ id: crypto.randomUUID(), type: 'custom', name: custom1.trim(), condition: 'Active' })
    }
    if (custom2.trim()) {
      rules.push({ id: crypto.randomUUID(), type: 'custom', name: custom2.trim(), condition: 'Active' })
    }
    saveRulesToStorage(rules)
    markSetupDone()
    onComplete(rules)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl bg-[#0c1120]/95 backdrop-blur-[30px] border border-white/[0.08] rounded-3xl p-8 my-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4ADE80]/30 to-[#4ADE80]/10 border border-[#4ADE80]/20 flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-[#4ADE80]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Set your trading rules</h2>
          <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
            Choose the rules you want to track every session. You can always edit them later.
          </p>
        </div>

        {/* Rule cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {ONBOARDING_RULES.map(rule => {
            const isSelected = selected.has(rule.type)
            const Icon = rule.icon
            return (
              <motion.div
                key={rule.type}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggle(rule.type)}
                className={`relative cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#4ADE80]/[0.08] border-[#4ADE80]/30 shadow-[0_0_20px_rgba(74,222,128,0.08)]'
                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]'
                }`}
              >
                {/* Checkmark */}
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isSelected ? 'bg-[#4ADE80] scale-100' : 'bg-white/[0.06] scale-90'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-[#050810]" strokeWidth={3} />}
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-[#4ADE80]/20' : 'bg-white/[0.06]'
                  }`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#4ADE80]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`text-sm font-medium mb-0.5 ${isSelected ? 'text-white' : 'text-[#CBD5E1]'}`}>{rule.name}</p>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{rule.description}</p>
                  </div>
                </div>

                {/* Input for rules that need a value */}
                {rule.hasInput && isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="relative">
                      {rule.inputPrefix && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8]">{rule.inputPrefix}</span>
                      )}
                      <input
                        type="text"
                        value={values[rule.type] || ''}
                        onChange={e => setValues(v => ({ ...v, [rule.type]: e.target.value }))}
                        placeholder={rule.inputPlaceholder}
                        className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-xl py-2 text-sm text-white placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#4ADE80]/40 ${
                          rule.inputPrefix ? 'pl-7 pr-3' : 'px-3'
                        }`}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Custom rules */}
        <div className="space-y-3 mb-8">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Custom Rules</p>
          <input
            value={custom1}
            onChange={e => setCustom1(e.target.value)}
            placeholder="Custom rule name (optional)"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#4ADE80]/40"
          />
          <input
            value={custom2}
            onChange={e => setCustom2(e.target.value)}
            placeholder="Custom rule name (optional)"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#4ADE80]/40"
          />
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={totalSelected === 0}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
            totalSelected > 0
              ? 'bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-[#050810] hover:shadow-[0_0_30px_rgba(74,222,128,0.3)] hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-white/[0.06] text-[#94A3B8] cursor-not-allowed'
          }`}
        >
          {totalSelected > 0 ? `Start Tracking (${totalSelected} rule${totalSelected !== 1 ? 's' : ''})` : 'Select at least 1 rule'}
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`w-full max-w-lg ${GLASS} bg-[#0a0f1a] p-6`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Rule Maker</h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {editRules.map(rule => {
            const Icon = RULE_TYPE_ICONS[rule.type]
            return (
              <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Icon className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{rule.name}</p>
                  <p className="text-xs text-[#94A3B8]">{rule.condition}</p>
                </div>
                <button onClick={() => removeRule(rule.id)} className="text-[#FF453A]/60 hover:text-[#FF453A] transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
          {editRules.length === 0 && (
            <p className="text-sm text-[#94A3B8] text-center py-4">No rules yet</p>
          )}
        </div>

        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Add Rule</p>
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as ProgressRule['type'])}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#4ADE80]/40"
          >
            {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="bg-[#0a0f1a]">{v}</option>
            ))}
          </select>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Rule name (optional)"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#4ADE80]/40"
          />
          <input
            value={newCondition}
            onChange={e => setNewCondition(e.target.value)}
            placeholder={newType === 'start_time' ? '09:30' : newType.includes('loss') ? '100' : 'Condition...'}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#4ADE80]/40"
          />
          <button
            onClick={addRule}
            className="flex items-center gap-2 text-sm text-[#4ADE80] bg-[#4ADE80]/10 hover:bg-[#4ADE80]/20 px-4 py-2.5 rounded-xl border border-[#4ADE80]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-[#94A3B8] hover:text-white rounded-xl hover:bg-white/[0.04] transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(editRules)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#4ADE80]/20 hover:bg-[#4ADE80]/30 rounded-xl border border-[#4ADE80]/30 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Rules
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProgressPage() {
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
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
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
          <h1 className="text-xl font-semibold text-white">Progress Tracker</h1>
          <p className="text-sm text-[#94A3B8]">Track your trading discipline</p>
        </div>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Stats */}
        <div className="lg:col-span-3 space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${GLASS} p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Current Streak</span>
            </div>
            <div className="text-3xl font-bold text-white">{streak}</div>
            <div className="text-sm text-[#94A3B8]">{streak === 1 ? 'day' : 'days'}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${GLASS} p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Current Period Score</span>
            </div>
            <SemiCircleGauge value={periodScore} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${GLASS} p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-[#4ADE80]" />
              <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Today&apos;s Progress</span>
            </div>
            <div className="text-3xl font-bold text-white">{todayChecked}/{todayTotal}</div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] mt-3 overflow-hidden">
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
          <h2 className="text-lg font-semibold text-white mb-1">Daily checklist, {formatDate(new Date())}</h2>
          {rules.length > 0 && (
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-4">Automated Rules ({rules.length})</p>
          )}
          <div className="space-y-3">
            {rules.length === 0 && todayTotal === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-[#94A3B8]/40 mx-auto mb-2" />
                <p className="text-sm text-[#94A3B8]">No rules set up yet</p>
                <button onClick={() => setEditOpen(true)} className="mt-3 text-sm text-[#4ADE80] hover:text-[#4ADE80]/80 transition-colors">
                  Add your first rule
                </button>
              </div>
            ) : (
              <>
                {rules.map(rule => {
                  const Icon = RULE_TYPE_ICONS[rule.type]
                  return (
                    <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#94A3B8]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{rule.name}</p>
                        <p className="text-xs text-[#94A3B8]">{getRuleProgress(rule)}</p>
                      </div>
                      <Circle className="w-4 h-4 text-[#94A3B8]/40" />
                    </div>
                  )
                })}
                {todayChecklist?.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      {item.checked ? <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" /> : <Circle className="w-4 h-4 text-[#94A3B8]/40" />}
                    </div>
                    <p className="text-sm text-white flex-1 truncate">{item.text}</p>
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`lg:col-span-5 ${GLASS} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Progress Heatmap</h2>
            <button className="text-xs font-medium text-[#4ADE80] bg-[#4ADE80]/10 px-3 py-1.5 rounded-lg hover:bg-[#4ADE80]/20 transition-colors">Today</button>
          </div>

          {/* Month labels */}
          <div className="relative h-4 mb-1 ml-8">
            {(() => {
              const months: { label: string; col: number }[] = []
              let lastMonth = -1
              heatmapWeeks.forEach((week, wi) => {
                const d = week[0]?.date
                if (d && d.getMonth() !== lastMonth) {
                  lastMonth = d.getMonth()
                  months.push({ label: d.toLocaleString('en-US', { month: 'short' }), col: wi })
                }
              })
              return months.map(m => (
                <span key={m.col} className="text-[10px] text-[#94A3B8] absolute" style={{ left: `${m.col * 16}px` }}>
                  {m.label}
                </span>
              ))
            })()}
          </div>

          <div className="flex gap-[2px]">
            <div className="flex flex-col gap-[2px] mr-1">
              {DAYS.map(d => (
                <div key={d} className="h-[14px] flex items-center">
                  <span className="text-[10px] text-[#94A3B8] w-6">{d}</span>
                </div>
              ))}
            </div>
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => {
                  const colorIdx = day.pct < 0 ? 0 : getColorIndex(day.pct)
                  const tooltip = day.pct < 0 ? 'No active rules' : `${day.checked}/${day.total} rules followed`
                  return (
                    <div
                      key={di}
                      className={`w-[14px] h-[14px] rounded-[3px] ${HEATMAP_COLORS[colorIdx]} cursor-pointer transition-colors hover:ring-1 hover:ring-white/20`}
                      title={`${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${tooltip}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-1 mt-4">
            <span className="text-[10px] text-[#94A3B8] mr-1">Less</span>
            {HEATMAP_COLORS.map((c, i) => (
              <div key={i} className={`w-[12px] h-[12px] rounded-[2px] ${c}`} />
            ))}
            <span className="text-[10px] text-[#94A3B8] ml-1">More</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom: Rules table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`${GLASS} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Current rules</h2>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 rounded-xl border border-white/[0.06] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit rules
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[#94A3B8]">No rules configured. Click &quot;Edit rules&quot; to add some.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider py-3 px-2">Rule</th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider py-3 px-2">Condition</th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider py-3 px-2">Rule Streak</th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider py-3 px-2">Avg Performance</th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider py-3 px-2">Follow Rate</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => {
                  const Icon = RULE_TYPE_ICONS[rule.type]
                  return (
                    <tr key={rule.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-[#94A3B8]" />
                          <span className="text-sm text-white">{rule.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm text-[#94A3B8]">{getConditionDisplay(rule)}</td>
                      <td className="py-3 px-2 text-sm text-white">0 days</td>
                      <td className="py-3 px-2 text-sm text-[#94A3B8]">--</td>
                      <td className="py-3 px-2">
                        <span className={`text-sm font-medium ${getFollowRateColor(0)}`}>--</span>
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
        {editOpen && <RuleEditor rules={rules} onSave={handleSaveRules} onClose={() => setEditOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
