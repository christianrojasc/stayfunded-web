'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  CheckSquare, Square, ClipboardCheck, RefreshCw,
  Plus, Trash2, Save, AlertCircle, Circle
} from 'lucide-react'
import * as dl from '@/lib/data-layer'
import { ChecklistItem, DailyChecklist } from '@/lib/types'
import { getTodaySessionDate } from '@/lib/session'
import { v4 as uuidv4 } from 'uuid'

const CATEGORY_COLORS: Record<string, string> = {
  mindset: 'text-purple-400 bg-purple-50',
  analysis: 'text-blue-400 bg-blue-50',
  risk: 'text-amber-400 bg-amber-50',
  technical: 'text-[#2D8B4E] bg-green-50/10',
}

const READINESS_LABELS = ['', 'Not ready', 'Getting there', 'Mostly ready', 'Ready', 'Fully focused']
const READINESS_COLORS = ['', '#EF4444', '#F97316', '#F59E0B', '#4ADE50', '#4ADE50']

export default function ChecklistPage() {
  const [sessionDate, setSessionDate] = useState('')
  const [checklist, setChecklist] = useState<DailyChecklist | null>(null)
  const [saved, setSaved] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<ChecklistItem['category']>('mindset')

  useEffect(() => {
    async function load() {
      const sd = getTodaySessionDate()
      setSessionDate(sd)
      const cl = await dl.getChecklist(sd)
      setChecklist(cl)
    }
    load()
  }, [])

  const checkedCount = useMemo(
    () => checklist?.items.filter(i => i.checked).length ?? 0,
    [checklist]
  )
  const totalCount = checklist?.items.length ?? 0
  const readinessScore = checklist?.readiness ?? 0
  const pct = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0

  const toggleItem = (id: string) => {
    if (!checklist) return
    setChecklist(c => c ? {
      ...c,
      items: c.items.map(i => i.id === id ? { ...i, checked: !i.checked } : i),
    } : c)
  }

  const setReadiness = (n: number) => {
    if (!checklist) return
    setChecklist(c => c ? { ...c, readiness: n } : c)
  }

  const handleSave = async () => {
    if (!checklist) return
    await dl.saveChecklist(checklist)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (!checklist) return
    setChecklist(c => c ? { ...c, items: c.items.map(i => ({ ...i, checked: false })), readiness: 0 } : c)
  }

  const addItem = () => {
    if (!newItemText.trim() || !checklist) return
    const item: ChecklistItem = {
      id: uuidv4(),
      text: newItemText.trim(),
      checked: false,
      category: newItemCategory,
    }
    setChecklist(c => c ? { ...c, items: [...c.items, item] } : c)
    setNewItemText('')
  }

  const removeItem = (id: string) => {
    if (!checklist) return
    setChecklist(c => c ? { ...c, items: c.items.filter(i => i.id !== id) } : c)
  }

  if (!checklist) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#4ADE50] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const getReadinessGrade = () => {
    if (pct >= 90) return { label: 'Trade Ready', color: '#4ADE50' }
    if (pct >= 70) return { label: 'Nearly Ready', color: '#F59E0B' }
    if (pct >= 50) return { label: 'Getting There', color: '#F97316' }
    return { label: 'Not Ready', color: '#EF4444' }
  }

  const grade = getReadinessGrade()

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Pre-Session Checklist</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Session: {sessionDate} · Resets at 6 PM EST
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="btn-secondary text-xs"
            title="Reset for new session"
          >
            <RefreshCw size={13} />
            Reset
          </button>
          <button
            onClick={() => setEditMode(e => !e)}
            className={editMode ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
          >
            {editMode ? 'Done Editing' : 'Edit Items'}
          </button>
        </div>
      </div>

      {/* Score Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">Readiness Score</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-light font-mono" style={{ color: grade.color }}>
                {checkedCount}<span className="text-2xl text-[var(--text-muted)]">/{totalCount}</span>
              </span>
              <span className="pb-1 text-sm font-semibold" style={{ color: grade.color }}>{grade.label}</span>
            </div>
          </div>
          {/* Circular progress */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="32" fill="none"
                stroke={grade.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color: grade.color }}>{pct.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: grade.color }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <ClipboardCheck size={16} className="text-[#2D8B4E]" />
            Items
          </h2>
          <span className="text-xs text-[var(--text-muted)]">{checkedCount}/{totalCount} checked</span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {checklist.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                !editMode ? 'hover:bg-[var(--bg-secondary)] cursor-pointer' : ''
              }`}
              onClick={!editMode ? () => toggleItem(item.id) : undefined}
            >
              {item.checked ? (
                <CheckSquare size={20} className="text-[#2D8B4E] flex-shrink-0" />
              ) : (
                <Square size={20} className="text-[var(--text-muted)] flex-shrink-0" />
              )}
              <span className={`flex-1 text-sm transition-colors ${
                item.checked
                  ? 'text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-muted)]'
              }`}>{item.text}</span>
              {item.category && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[item.category] ?? ''}`}>
                  {item.category}
                </span>
              )}
              {editMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id) }}
                  className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[#EF4444] hover:bg-[var(--border)] transition-all"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Item (edit mode) */}
        {editMode && (
          <div className="p-4 border-t border-[var(--border)] space-y-2">
            <div className="flex gap-2">
              <input
                className="input-field flex-1 text-sm"
                placeholder="New checklist item…"
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
              <select
                className="input-field w-32 text-xs"
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value as ChecklistItem['category'])}
              >
                <option value="mindset">Mindset</option>
                <option value="analysis">Analysis</option>
                <option value="risk">Risk</option>
                <option value="technical">Technical</option>
              </select>
              <button onClick={addItem} className="btn-primary text-xs px-3">
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Readiness Rating */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Circle size={16} className="text-[#2D8B4E]" />
          Overall Readiness (1–5)
        </h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setReadiness(n)}
              className={`flex-1 py-3 rounded-xl text-lg font-bold border transition-all ${
                readinessScore >= n
                  ? 'border-[#2D8B4E] text-[#4ADE50]'
                  : 'border-[var(--border)] text-[var(--text-muted)]'
              }`}
              style={readinessScore >= n ? { background: `${READINESS_COLORS[n]}15` } : {}}
            >
              {n}
            </button>
          ))}
        </div>
        {readinessScore > 0 && (
          <p className="text-sm font-semibold mt-3 text-center" style={{ color: READINESS_COLORS[readinessScore] }}>
            {READINESS_LABELS[readinessScore]}
          </p>
        )}
      </div>

      {/* Warnings */}
      {(pct < 70 || (checklist.readiness > 0 && checklist.readiness < 3)) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Caution: Not fully prepared</p>
            <p className="text-xs text-amber-400 mt-1">
              {pct < 70 && `Only ${checkedCount} of ${totalCount} items checked. `}
              {checklist.readiness > 0 && checklist.readiness < 3 && 'Your readiness rating is low. '}
              Consider waiting until you&apos;re better prepared before trading.
            </p>
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="btn-primary">
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Checklist'}
        </button>
        <p className="text-xs text-[var(--text-muted)]">
          Auto-resets at the start of each new trading session (6 PM EST)
        </p>
      </div>
    </div>
  )
}
