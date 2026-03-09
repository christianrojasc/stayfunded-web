'use client'
import { useState, useCallback } from 'react'
import {
  Upload, CheckCircle, AlertCircle, FileText, X,
  Download, ChevronRight, Info, RefreshCw, Briefcase, Link2
} from 'lucide-react'
import { useTrades } from '@/components/TradeContext'
import { useAccountFilter } from '@/components/AccountFilterContext'
import { parseTradovateCSV, ParseResult } from '@/lib/csv-parser'
import { formatPnl } from '@/lib/calculations'
import { Trade, PropAccount } from '@/lib/types'
import * as dl from '@/lib/data-layer'
import NewAccountWizard from '@/components/NewAccountWizard'

type Step = 'upload' | 'wizard' | 'preview' | 'done'

export default function ImportPage() {
  const { trades: existingTrades, importBatch } = useTrades()
  const { accounts, refresh: refreshAccounts } = useAccountFilter()
  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importCount, setImportCount] = useState(0)
  const [linkedAccountId, setLinkedAccountId] = useState<string | null>(null)
  const [duplicateCount, setDuplicateCount] = useState(0)

  const processFile = async (text: string, name: string) => {
    setFileName(name)
    const result = parseTradovateCSV(text)

    // Deduplicate: filter out trades whose orderId already exists
    const existingOrderIds = new Set(
      existingTrades.filter(t => t.orderId).map(t => t.orderId!)
    )
    const newTrades: Trade[] = []
    let dupes = 0
    for (const t of result.trades) {
      if (t.orderId && existingOrderIds.has(t.orderId)) {
        dupes++
      } else {
        newTrades.push(t)
      }
    }
    setDuplicateCount(dupes)
    result.trades = newTrades

    setParsed(result)
    setSelected(new Set(result.trades.map(t => t.id)))

    // Check for matching existing PropAccount (case-insensitive, exact match)
    if (result.detectedAccountNumber) {
      const propAccounts = await dl.getPropAccounts()
      const match = propAccounts.find(
        a =>
          a.accountNumber &&
          result.detectedAccountNumber &&
          a.accountNumber.toLowerCase() === result.detectedAccountNumber.toLowerCase()
      )
      if (match) {
        // Account already exists — link it and skip wizard
        setLinkedAccountId(match.id)
        setStep('preview')
      } else {
        // No matching account — show wizard
        setStep('wizard')
      }
    } else {
      setStep('preview')
    }
  }

  const handleWizardCreated = (account: PropAccount) => {
    setLinkedAccountId(account.id)
    refreshAccounts()
    setStep('preview')
  }

  const handleWizardSkip = () => {
    setStep('preview')
  }

  const handleWizardClose = () => {
    // Cancel the whole import
    reset()
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    // processFile is async; fire-and-forget here — state updates will arrive
    // once the promise resolves. The UI shows a loading spinner during processing.
    reader.onload = e => { processFile(e.target?.result as string, file.name) }
    reader.readAsText(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const doImport = async () => {
    if (!parsed) return
    setImporting(true)
    const toImport = parsed.trades
      .filter(t => selected.has(t.id))
      .map(t => linkedAccountId ? { ...t, accountId: linkedAccountId } : t)
    await new Promise(r => setTimeout(r, 400))
    await importBatch(toImport)
    setImportCount(toImport.length)
    setImporting(false)
    setStep('done')
  }

  const reset = () => {
    setStep('upload')
    setParsed(null)
    setSelected(new Set())
    setFileName('')
    setImportCount(0)
    setLinkedAccountId(null)
    setDuplicateCount(0)
  }

  if (step === 'done') {
    return (
      <div className="max-w-xl mx-auto py-16 space-y-6 animate-slide-up text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}>
          <CheckCircle size={40} className="text-[var(--text-primary)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Import Complete!</h2>
          <p className="text-[var(--text-muted)] mt-2">{importCount} trades imported from <strong>{fileName}</strong></p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-secondary">
            <Upload size={15} /> Import Another File
          </button>
          <a href="/dashboard" className="btn-primary">
            <ChevronRight size={15} /> View Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Import Trades</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Import your trade history from Tradovate</p>
      </div>

      {/* New Account Wizard — shown as overlay when new account detected */}
      {step === 'wizard' && parsed && (
        <NewAccountWizard
          detectedFirm={parsed.detectedFirm ?? null}
          detectedAccountNumber={parsed.detectedAccountNumber ?? null}
          onCreated={handleWizardCreated}
          onSkip={handleWizardSkip}
          onClose={handleWizardClose}
        />
      )}

      {step === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Drop zone */}
          <div className="lg:col-span-2">
            <div
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-16 text-center transition-all duration-200 cursor-pointer ${
                dragging
                  ? 'border-[#4ADE80]/60 shadow-[0_0_40px_rgba(74,222,128,0.08)]'
                  : 'border-[var(--border)] hover:border-[#4ADE80]/40 hover:shadow-[0_0_30px_rgba(74,222,128,0.05)]'
              }`}
              style={{background: dragging ? 'rgba(74,222,128,0.04)' : 'var(--bg-card)'}}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={onFileChange} />
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  dragging ? 'scale-110' : ''
                }`} style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}>
                  <Upload size={32} className="text-[var(--text-primary)]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-lg">Drop your CSV here</p>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">or click to browse your files</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)]" style={{background:'var(--bg-card)', border:'1px solid rgba(255,255,255,0.08)'}}>
                  <FileText size={13} />
                  Supports Tradovate Account Statement &amp; Trades Export CSV
                </div>
              </div>
            </div>
          </div>

          {/* Format guide */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info size={16} className="text-[#2D8B4E]" />
                <h3 className="font-bold text-[var(--text-primary)] text-sm">Supported Formats</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-0.5">Tradovate Account Statement</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Reports → Account Statement → Export CSV</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-0.5">Tradovate Trades Export</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Reports → Fills → Export CSV</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-[var(--text-primary)] text-sm mb-3">How to Export from Tradovate</h3>
              <ol className="space-y-2 text-xs text-[var(--text-muted)]">
                {[
                  'Log in to Tradovate',
                  'Go to Reports in the top menu',
                  'Select Account Statement or Fills',
                  'Set your date range',
                  'Click Export → CSV',
                  'Upload the file here',
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)] flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}>
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && parsed && (
        <div className="space-y-4 animate-slide-up">
          {/* Summary */}
          <div className="glass-card p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <FileText size={20} className="text-[#2D8B4E]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)]">{fileName}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {parsed.trades.length} new trades
                    {duplicateCount > 0 && ` · ${duplicateCount} duplicates skipped`}
                    {parsed.skipped > 0 && ` · ${parsed.skipped} rows skipped`}
                    {parsed.errors.length > 0 && ` · ${parsed.errors.length} errors`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--text-muted)]">
                  {selected.size} / {parsed.trades.length} selected
                </span>
                <button onClick={reset} className="btn-secondary text-xs py-1.5">
                  <X size={13} /> Cancel
                </button>
                <button
                  onClick={doImport}
                  disabled={selected.size === 0 || importing}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  Import {selected.size} Trades
                </button>
              </div>
            </div>
          </div>

          {/* Account Detection Banner */}
          {parsed.detectedFirm && (
            <div className="p-4 bg-[#2D8B4E]/5 border border-[#2D8B4E]/30 rounded-xl flex items-start gap-3">
              <Briefcase size={16} className="text-[#2D8B4E] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#2D8B4E] mb-1">
                  Detected: {parsed.detectedFirm}
                  {parsed.detectedAccountNumber && ` — ${parsed.detectedAccountNumber}`}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[var(--text-muted)]">Link to account:</span>
                  <select
                    className="input-field text-xs py-1 max-w-[200px]"
                    value={linkedAccountId || ''}
                    onChange={e => setLinkedAccountId(e.target.value || null)}
                  >
                    <option value="">Don't link</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nickname || a.firmName} ({a.firmName})
                      </option>
                    ))}
                  </select>
                  {linkedAccountId && (
                    <span className="text-xs text-[#4ADE50] flex items-center gap-1 font-semibold">
                      <CheckCircle size={12} /> Will link {selected.size} trades
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No account match — show link option anyway */}
          {!parsed.detectedFirm && accounts.length > 0 && (
            <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl flex items-center gap-3">
              <Link2 size={14} className="text-[var(--text-muted)] flex-shrink-0" />
              <span className="text-xs text-[var(--text-muted)]">Link trades to account:</span>
              <select
                className="input-field text-xs py-1 max-w-[200px]"
                value={linkedAccountId || ''}
                onChange={e => setLinkedAccountId(e.target.value || null)}
              >
                <option value="">Don't link</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nickname || a.firmName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Errors */}
          {parsed.errors.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">{parsed.errors.length} rows had issues (skipped)</p>
                {parsed.errors.slice(0, 3).map((e, i) => (
                  <p key={i} className="text-xs text-amber-600">{e}</p>
                ))}
              </div>
            </div>
          )}

          {/* Toggle all */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set(parsed.trades.map(t => t.id)))}
              className="text-xs text-[#2D8B4E] hover:underline font-medium"
            >Select all</button>
            <span className="text-[var(--text-muted)]">·</span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-[var(--text-secondary)] hover:underline font-medium"
            >Deselect all</button>
          </div>

          {/* Preview table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full trade-table">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === parsed.trades.length}
                        onChange={e => e.target.checked ? setSelected(new Set(parsed.trades.map(t => t.id))) : setSelected(new Set())}
                        className="rounded"
                      />
                    </th>
                    <th>Date</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Qty</th>
                    <th>Entry</th>
                    <th>Net P&L</th>
                    <th>Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.trades.map(t => (
                    <tr key={t.id} className={!selected.has(t.id) ? 'opacity-40' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggleSelect(t.id)}
                          className="rounded"
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                      <td className="text-[var(--text-muted)] font-medium">{t.date}</td>
                      <td>
                        <span className="font-mono font-bold text-xs bg-[var(--bg-secondary)] px-2 py-0.5 rounded-lg">{t.symbol}</span>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          t.side === 'Long'
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}>{t.side}</span>
                      </td>
                      <td className="font-mono">{t.contracts}</td>
                      <td className="font-mono">{t.entryPrice.toFixed(2)}</td>
                      <td>
                        <span className={`font-mono font-bold text-sm ${t.netPnl >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
                          {formatPnl(t.netPnl)}
                        </span>
                      </td>
                      <td className="font-mono text-[var(--text-secondary)] text-xs">${t.fees.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
