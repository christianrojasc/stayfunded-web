'use client'
import { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import { Trade } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'

const SYMBOLS = ['ES', 'NQ', 'YM', 'RTY', 'CL', 'GC', 'SI', '6E', '6J', 'ZB', 'ZN', 'ZC', 'ZS',
                 'MES', 'MNQ', 'MYM', 'M2K', 'MCL', 'MGC']

interface Props {
  trade?: Trade | null
  onSave: (data: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdate: (id: string, data: Partial<Trade>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function getFuturesSessionDate(dateStr: string, time?: string): string {
  try {
    const hour = time ? parseInt(time.split(':')[0]) : 0
    const d = new Date(dateStr + 'T12:00:00')
    if (hour >= 18) d.setDate(d.getDate() + 1)
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  } catch { return dateStr }
}

export default function TradeModal({ trade, onSave, onUpdate, onDelete, onClose }: Props) {
  const isEdit = !!trade

  const [form, setForm] = useState({
    date: trade?.date || format(new Date(), 'yyyy-MM-dd'),
    entryTime: trade?.entryTime || '',
    exitTime: trade?.exitTime || '',
    symbol: trade?.symbol || 'ES',
    side: trade?.side || 'Long' as Trade['side'],
    contracts: trade?.contracts || 1,
    entryPrice: trade?.entryPrice || '',
    exitPrice: trade?.exitPrice || '',
    fees: trade?.fees || '',
    setup: trade?.setup || '',
    notes: trade?.notes || '',
    stopLoss: trade?.stopLoss || '',
    takeProfit: trade?.takeProfit || '',
  })

  const entryNum = parseFloat(String(form.entryPrice)) || 0
  const exitNum = parseFloat(String(form.exitPrice)) || 0
  const feesNum = parseFloat(String(form.fees)) || 0
  const contracts = parseInt(String(form.contracts)) || 1

  // Approximate point value
  const POINT_VALUES: Record<string, number> = {
    ES: 50, MES: 5, NQ: 20, MNQ: 2, YM: 5, MYM: 0.5,
    RTY: 50, M2K: 5, CL: 1000, MCL: 100, GC: 100, MGC: 10,
    '6E': 125000, '6J': 12500000, ZB: 1000, ZN: 1000,
    ZC: 50, ZS: 50, ZW: 50, SI: 5000,
  }
  const pv = POINT_VALUES[form.symbol] || 50
  const rawPnl = (form.side === 'Long' ? exitNum - entryNum : entryNum - exitNum) * contracts * pv
  const netPnl = rawPnl - feesNum

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.symbol || !entryNum || !exitNum) return

    const sessionDate = getFuturesSessionDate(form.date, form.entryTime)
    const data: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> = {
      date: form.date,
      sessionDate,
      symbol: form.symbol,
      side: form.side,
      contracts,
      entryPrice: entryNum,
      exitPrice: exitNum,
      pnl: parseFloat(rawPnl.toFixed(2)),
      fees: feesNum,
      netPnl: parseFloat(netPnl.toFixed(2)),
      setup: form.setup || undefined,
      notes: form.notes || undefined,
      entryTime: form.entryTime || undefined,
      exitTime: form.exitTime || undefined,
      stopLoss: form.stopLoss ? parseFloat(String(form.stopLoss)) : undefined,
      takeProfit: form.takeProfit ? parseFloat(String(form.takeProfit)) : undefined,
      tags: [],
      status: 'closed',
    }

    if (isEdit && trade) {
      onUpdate(trade.id, data)
    } else {
      onSave(data)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#F0F3F7]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{isEdit ? 'Edit Trade' : 'Log Trade'}</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Fill in your trade details</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: Date + Times */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Entry Time</label>
              <input type="time" className="input-field" value={form.entryTime} onChange={e => set('entryTime', e.target.value)} />
            </div>
            <div>
              <label className="label">Exit Time</label>
              <input type="time" className="input-field" value={form.exitTime} onChange={e => set('exitTime', e.target.value)} />
            </div>
          </div>

          {/* Row 2: Symbol + Side + Contracts */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Symbol</label>
              <select className="input-field" value={form.symbol} onChange={e => set('symbol', e.target.value)}>
                {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Side</label>
              <div className="flex gap-2 mt-1">
                {(['Long', 'Short'] as const).map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => set('side', s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      form.side === s
                        ? s === 'Long'
                          ? 'bg-green-50 border-green-200 text-[#2D8B4E]'
                          : 'bg-orange-50 border-orange-200 text-orange-600'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Contracts</label>
              <input type="number" min="1" className="input-field" value={form.contracts} onChange={e => set('contracts', e.target.value)} required />
            </div>
          </div>

          {/* Row 3: Entry + Exit + Fees */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Entry Price</label>
              <input type="number" step="0.01" className="input-field font-mono" value={form.entryPrice} onChange={e => set('entryPrice', e.target.value)} placeholder="0.00" required />
            </div>
            <div>
              <label className="label">Exit Price</label>
              <input type="number" step="0.01" className="input-field font-mono" value={form.exitPrice} onChange={e => set('exitPrice', e.target.value)} placeholder="0.00" required />
            </div>
            <div>
              <label className="label">Fees ($)</label>
              <input type="number" step="0.01" min="0" className="input-field font-mono" value={form.fees} onChange={e => set('fees', e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* P&L Preview */}
          {entryNum > 0 && exitNum > 0 && (
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              netPnl >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
            }`}>
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Calculated P&L</p>
                <p className={`text-xl font-bold mt-0.5 ${netPnl >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
                  {netPnl >= 0 ? '+' : ''}{netPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
              <div className="text-right text-xs text-[var(--text-secondary)]">
                <p>Gross: {rawPnl >= 0 ? '+' : ''}{rawPnl.toFixed(2)}</p>
                <p>Fees: −{feesNum.toFixed(2)}</p>
                <p className="mt-1 font-medium text-[var(--text-muted)]">{contracts} contract{contracts > 1 ? 's' : ''} · {form.symbol}</p>
              </div>
            </div>
          )}

          {/* Row 4: SL + TP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Stop Loss</label>
              <input type="number" step="0.01" className="input-field font-mono" value={form.stopLoss} onChange={e => set('stopLoss', e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="label">Take Profit</label>
              <input type="number" step="0.01" className="input-field font-mono" value={form.takeProfit} onChange={e => set('takeProfit', e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {/* Setup + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Setup</label>
              <input type="text" className="input-field" value={form.setup} onChange={e => set('setup', e.target.value)} placeholder="e.g. VWAP Reclaim, Breakout" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="What happened? What did you learn?"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#F0F3F7]">
            <div>
              {isEdit && trade && (
                <button
                  type="button"
                  onClick={() => { onDelete(trade.id); onClose() }}
                  className="btn-danger"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">
                <Save size={14} />
                {isEdit ? 'Save Changes' : 'Log Trade'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
