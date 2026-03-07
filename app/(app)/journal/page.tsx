'use client'
import { useState, useMemo } from 'react'
import {
  Plus, Search, X, Save, Trash2, ChevronDown, ChevronRight,
  Smile, Frown, Meh, TrendingUp, TrendingDown, Minus, BookOpen
} from 'lucide-react'
import { useNotes } from '@/hooks/useNotes'
import { useTrades } from '@/components/TradeContext'
import { DailyNote } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { formatPnl, calcDailyStats } from '@/lib/calculations'

const MOODS = [
  { val: 'great', icon: <Smile size={16} className="text-[#2D8B4E]" />, label: 'Great', color: 'text-[#4ADE80] bg-[#4ADE80]/10 border-[#4ADE80]/20' },
  { val: 'good',  icon: <Smile size={16} className="text-blue-500" />,   label: 'Good',  color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { val: 'neutral', icon: <Meh size={16} className="text-amber-500" />,  label: 'Neutral', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { val: 'bad',   icon: <Frown size={16} className="text-orange-500" />, label: 'Bad',   color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { val: 'terrible', icon: <Frown size={16} className="text-[#EF4444]" />, label: 'Terrible', color: 'text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/20' },
]

const BIAS = [
  { val: 'bullish',  icon: <TrendingUp size={14} />,  label: 'Bullish',  color: 'text-[#4ADE80] bg-[#4ADE80]/10 border-[#4ADE80]/20' },
  { val: 'neutral',  icon: <Minus size={14} />,       label: 'Neutral',  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { val: 'bearish',  icon: <TrendingDown size={14} />, label: 'Bearish', color: 'text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/20' },
]

export default function JournalPage() {
  const { notes, addNote, updateNote, removeNote } = useNotes()
  const { trades } = useTrades()
  const daily = useMemo(() => calcDailyStats(trades), [trades])

  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    title: '',
    content: '',
    mood: '' as DailyNote['mood'] | '',
    marketBias: '' as DailyNote['marketBias'] | '',
    preMarket: '',
    postMarket: '',
  })

  const resetForm = () => setForm({
    date: format(new Date(), 'yyyy-MM-dd'),
    title: '', content: '', mood: '', marketBias: '', preMarket: '', postMarket: '',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const sorted = useMemo(() => {
    return [...notes]
      .filter(n => !search || n.content.toLowerCase().includes(search.toLowerCase()) || n.title?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [notes, search])

  const dailyMap = useMemo(() => new Map(daily.map(d => [d.date, d])), [daily])

  const handleSave = () => {
    if (!form.content.trim() && !form.preMarket && !form.postMarket) return
    const data = {
      date: form.date,
      sessionDate: form.date,
      title: form.title || undefined,
      content: form.content,
      mood: (form.mood || undefined) as DailyNote['mood'] | undefined,
      marketBias: (form.marketBias || undefined) as DailyNote['marketBias'] | undefined,
      preMarket: form.preMarket || undefined,
      postMarket: form.postMarket || undefined,
    }
    if (editId) {
      updateNote(editId, data)
      setEditId(null)
    } else {
      addNote(data)
      setShowNew(false)
    }
    resetForm()
  }

  const startEdit = (n: DailyNote) => {
    setForm({
      date: n.date,
      title: n.title || '',
      content: n.content,
      mood: n.mood || '',
      marketBias: n.marketBias || '',
      preMarket: n.preMarket || '',
      postMarket: n.postMarket || '',
    })
    setEditId(n.id)
    setShowNew(false)
  }

  const toggleExpand = (id: string) => {
    setExpanded(s => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const NoteForm = () => (
    <div className="glass-card p-6 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">{editId ? 'Edit Entry' : 'New Journal Entry'}</h3>
        <button onClick={() => { setShowNew(false); setEditId(null); resetForm() }} className="p-1.5 rounded-xl hover:bg-[#F5F7FA] dark:bg-[#0F172A] text-[#9EB0C0] dark:text-[#64748B]">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input-field" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <label className="label">Title (optional)</label>
          <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Choppy session, revenge traded" />
        </div>
      </div>

      {/* Mood */}
      <div>
        <label className="label">Mood</label>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(m => (
            <button
              key={m.val}
              type="button"
              onClick={() => set('mood', form.mood === m.val ? '' : m.val)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                form.mood === m.val ? m.color : 'border-white/[0.08] text-[#64748B] hover:border-white/[0.15]'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Market bias */}
      <div>
        <label className="label">Market Bias</label>
        <div className="flex gap-2">
          {BIAS.map(b => (
            <button
              key={b.val}
              type="button"
              onClick={() => set('marketBias', form.marketBias === b.val ? '' : b.val)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                form.marketBias === b.val ? b.color : 'border-white/[0.08] text-[#64748B] hover:border-white/[0.15]'
              }`}
            >
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pre-market */}
      <div>
        <label className="label">Pre-Market Notes</label>
        <textarea
          className="input-field resize-none"
          rows={2}
          value={form.preMarket}
          onChange={e => set('preMarket', e.target.value)}
          placeholder="Market outlook, key levels, planned trades..."
        />
      </div>

      {/* Content */}
      <div>
        <label className="label">Journal Entry</label>
        <textarea
          className="input-field resize-none"
          rows={4}
          value={form.content}
          onChange={e => set('content', e.target.value)}
          placeholder="What happened today? Setups you took, mistakes, lessons learned..."
        />
      </div>

      {/* Post-market */}
      <div>
        <label className="label">Post-Market Review</label>
        <textarea
          className="input-field resize-none"
          rows={2}
          value={form.postMarket}
          onChange={e => set('postMarket', e.target.value)}
          placeholder="What went well? What to improve tomorrow?"
        />
      </div>

      <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
        <button onClick={handleSave} className="btn-primary">
          <Save size={14} /> Save Entry
        </button>
        <button onClick={() => { setShowNew(false); setEditId(null); resetForm() }} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Journal</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{notes.length} entries</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowNew(true); setEditId(null); resetForm() }}>
          <Plus size={16} />
          New Entry
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9EB0C0] dark:text-[#64748B]" />
        <input
          className="input-field pl-9"
          placeholder="Search journal entries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* New form */}
      {showNew && !editId && <NoteForm />}

      {/* Entries */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <BookOpen size={32} className="text-[#64748B]" />
            </div>
            <div>
              <p className="font-bold text-white">No journal entries yet</p>
              <p className="text-sm text-[#9EB0C0] dark:text-[#64748B] mt-1">Start documenting your trading journey to grow faster</p>
            </div>
            <button className="btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={14} /> Write First Entry
            </button>
          </div>
        ) : sorted.map(note => {
          const dayStats = dailyMap.get(note.date)
          const mood = MOODS.find(m => m.val === note.mood)
          const bias = BIAS.find(b => b.val === note.marketBias)
          const isOpen = expanded.has(note.id)

          if (editId === note.id) return <NoteForm key={note.id} />

          return (
            <div key={note.id} className="glass-card overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => toggleExpand(note.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-white text-sm">
                      {(() => { try { return format(parseISO(note.date), 'EEEE, MMM d yyyy') } catch { return note.date } })()}
                    </span>
                    {mood && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${mood.color}`}>
                        {mood.icon} {mood.label}
                      </span>
                    )}
                    {bias && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${bias.color}`}>
                        {bias.icon} {bias.label}
                      </span>
                    )}
                  </div>
                  {note.title && <p className="text-xs font-semibold text-[#2D8B4E] mb-0.5">{note.title}</p>}
                  {!isOpen && (
                    <p className="text-xs text-[#9EB0C0] dark:text-[#64748B] truncate">{note.content || note.preMarket || '...'}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {dayStats && (
                    <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                      dayStats.netPnl >= 0 ? 'bg-[#4ADE80]/10 text-[#4ADE80]' : 'bg-[#FF453A]/10 text-[#FF453A]'
                    }`}>
                      {formatPnl(dayStats.netPnl)}
                    </span>
                  )}
                  {isOpen ? <ChevronDown size={16} className="text-[#9EB0C0] dark:text-[#64748B]" /> : <ChevronRight size={16} className="text-[#9EB0C0] dark:text-[#64748B]" />}
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06]">
                  {dayStats && (
                    <div className={`flex items-center gap-4 p-3 rounded-xl mt-3 text-xs ${
                      dayStats.netPnl >= 0 ? 'bg-[#4ADE80]/[0.06]' : 'bg-[#FF453A]/[0.06]'
                    }`}>
                      <span className={`font-bold text-base ${dayStats.netPnl >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
                        {formatPnl(dayStats.netPnl)}
                      </span>
                      <span className="text-[#6B7E91] dark:text-[#94A3B8]">{dayStats.tradeCount} trades · {dayStats.winRate.toFixed(0)}% WR</span>
                    </div>
                  )}
                  {note.preMarket && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9EB0C0] dark:text-[#64748B] mb-1">Pre-Market</p>
                      <p className="text-sm text-[#1E2D3D] dark:text-[#F1F5F9] whitespace-pre-wrap">{note.preMarket}</p>
                    </div>
                  )}
                  {note.content && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9EB0C0] dark:text-[#64748B] mb-1">Journal</p>
                      <p className="text-sm text-[#1E2D3D] dark:text-[#F1F5F9] whitespace-pre-wrap">{note.content}</p>
                    </div>
                  )}
                  {note.postMarket && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9EB0C0] dark:text-[#64748B] mb-1">Post-Market Review</p>
                      <p className="text-sm text-[#1E2D3D] dark:text-[#F1F5F9] whitespace-pre-wrap">{note.postMarket}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                    <button onClick={() => startEdit(note)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                    <button onClick={() => removeNote(note.id)} className="btn-danger text-xs py-1.5 px-3">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
