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

interface FileBundle {
  fileName: string
  parsed: ParseResult
  linkedAccountId: string | null
  autoMatched: boolean
  selected: Set<string>
  duplicateCount: number
}

export default function ImportPage() {
  const { trades: existingTrades, importBatch } = useTrades()
  const { accounts, refresh: refreshAccounts } = useAccountFilter()
  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [bundles, setBundles] = useState<FileBundle[]>([])
  const [importing, setImporting] = useState(false)
  const [importCount, setImportCount] = useState(0)

  // Wizard state (for unmatched accounts)
  const [wizardQueue, setWizardQueue] = useState<number[]>([])
  const [wizardIndex, setWizardIndex] = useState(0)

  const processFiles = async (files: File[]) => {
    const propAccounts = await dl.getPropAccounts()
    const existingOrderIds = new Set(
      existingTrades.filter(t => t.orderId).map(t => t.orderId!)
    )

    const newBundles: FileBundle[] = []

    for (const file of files) {
      const text = await file.text()
      const result = parseTradovateCSV(text)

      // Deduplicate
      const newTrades: Trade[] = []
      let dupes = 0
      for (const t of result.trades) {
        if (t.orderId && existingOrderIds.has(t.orderId)) {
          dupes++
        } else {
          newTrades.push(t)
          // Also add to existing set so cross-file dupes are caught
          if (t.orderId) existingOrderIds.add(t.orderId)
        }
      }
      result.trades = newTrades

      // Auto-match account
      let linkedAccountId: string | null = null
      let autoMatched = false
      if (result.detectedAccountNumber) {
        const match = propAccounts.find(
          a => a.accountNumber &&
            result.detectedAccountNumber &&
            a.accountNumber.toLowerCase() === result.detectedAccountNumber.toLowerCase()
        )
        if (match) {
          linkedAccountId = match.id
          autoMatched = true
        }
      }

      newBundles.push({
        fileName: file.name,
        parsed: result,
        linkedAccountId,
        autoMatched,
        selected: new Set(result.trades.map(t => t.id)),
        duplicateCount: dupes,
      })
    }

    setBundles(newBundles)

    // Check if any files need a new account (unmatched)
    const unmatchedIdxs = newBundles
      .map((b, i) => (!b.linkedAccountId && b.parsed.detectedAccountNumber) ? i : -1)
      .filter(i => i !== -1)

    if (unmatchedIdxs.length > 0) {
      setWizardQueue(unmatchedIdxs)
      setWizardIndex(0)
      setStep('wizard')
    } else {
      setStep('preview')
    }
  }

  const handleWizardCreated = (account: PropAccount) => {
    // Link the current wizard bundle to the new account
    const idx = wizardQueue[wizardIndex]
    setBundles(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], linkedAccountId: account.id, autoMatched: true }
      return next
    })
    refreshAccounts()
    advanceWizard()
  }

  const handleWizardSkip = () => {
    advanceWizard()
  }

  const handleWizardClose = () => {
    advanceWizard()
  }

  const advanceWizard = () => {
    if (wizardIndex < wizardQueue.length - 1) {
      setWizardIndex(prev => prev + 1)
    } else {
      setStep('preview')
    }
  }

  const handleFiles = (fileList: FileList) => {
    const csvFiles = Array.from(fileList).filter(f => f.name.endsWith('.csv'))
    if (csvFiles.length > 0) processFiles(csvFiles)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [existingTrades])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
  }

  const updateBundleAccount = (idx: number, accountId: string | null) => {
    setBundles(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], linkedAccountId: accountId, autoMatched: false }
      return next
    })
  }

  const totalTrades = bundles.reduce((s, b) => s + b.selected.size, 0)
  const totalDupes = bundles.reduce((s, b) => s + b.duplicateCount, 0)

  const doImport = async () => {
    setImporting(true)
    let count = 0
    for (const bundle of bundles) {
      const toImport = bundle.parsed.trades
        .filter(t => bundle.selected.has(t.id))
        .map(t => bundle.linkedAccountId ? { ...t, accountId: bundle.linkedAccountId } : t)
      if (toImport.length > 0) {
        await importBatch(toImport)
        count += toImport.length
      }
    }
    setImportCount(count)
    setImporting(false)
    setStep('done')
  }

  const reset = () => {
    setStep('upload')
    setBundles([])
    setImportCount(0)
    setWizardQueue([])
    setWizardIndex(0)
  }

  if (step === 'done') {
    return (
      <div className="max-w-xl mx-auto py-16 space-y-6 animate-slide-up text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}>
          <CheckCircle size={40} className="text-[var(--text-primary)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Import Complete!</h2>
          <p className="text-[var(--text-muted)] mt-2">
            {importCount} trades imported from {bundles.length} file{bundles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-secondary">
            <Upload size={15} /> Import More Files
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
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Import your trade history from Tradovate — drop multiple files to auto-match accounts
        </p>
      </div>

      {/* New Account Wizard */}
      {step === 'wizard' && wizardQueue.length > 0 && bundles[wizardQueue[wizardIndex]] && (
        <div>
          <div className="text-xs text-[var(--text-muted)] mb-2">
            New account detected ({wizardIndex + 1} of {wizardQueue.length})
          </div>
          <NewAccountWizard
            detectedFirm={bundles[wizardQueue[wizardIndex]].parsed.detectedFirm ?? null}
            detectedAccountNumber={bundles[wizardQueue[wizardIndex]].parsed.detectedAccountNumber ?? null}
            onCreated={handleWizardCreated}
            onSkip={handleWizardSkip}
            onClose={handleWizardClose}
          />
        </div>
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
              <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={onFileChange} multiple />
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  dragging ? 'scale-110' : ''
                }`} style={{ background: 'linear-gradient(135deg, #2D8B4E, #4ADE50)' }}>
                  <Upload size={32} className="text-[var(--text-primary)]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-lg">Drop your CSVs here</p>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">Drop multiple files at once — accounts are auto-detected</p>
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
                <h3 className="font-bold text-[var(--text-primary)] text-sm">Multi-Account Import</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-1">🔍 Auto-Detection</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Each CSV is scanned for account numbers. Trades are automatically matched to your prop accounts.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-1">📁 Multiple Files</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Select or drop 5 CSVs from 5 accounts — they'll sort themselves out.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-1">🔄 Deduplication</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Duplicate trades are automatically filtered — even across files.
                  </p>
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

      {step === 'preview' && bundles.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          {/* Global Summary */}
          <div className="glass-card p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <FileText size={20} className="text-[#2D8B4E]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)]">
                    {bundles.length} file{bundles.length !== 1 ? 's' : ''} ready
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {totalTrades} trades to import
                    {totalDupes > 0 && ` · ${totalDupes} duplicates skipped`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={reset} className="btn-secondary text-xs py-1.5">
                  <X size={13} /> Cancel
                </button>
                <button
                  onClick={doImport}
                  disabled={totalTrades === 0 || importing}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  Import All ({totalTrades})
                </button>
              </div>
            </div>
          </div>

          {/* Per-File Cards */}
          {bundles.map((bundle, idx) => {
            const totalPnl = bundle.parsed.trades
              .filter(t => bundle.selected.has(t.id))
              .reduce((s, t) => s + t.netPnl, 0)
            const matchedAccount = accounts.find(a => a.id === bundle.linkedAccountId)

            return (
              <div key={idx} className="glass-card overflow-hidden">
                {/* File header */}
                <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} className="text-[#2D8B4E] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--text-primary)] text-sm truncate">{bundle.fileName}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {bundle.selected.size} trades · {' '}
                        <span className={totalPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#EF4444]'}>
                          {formatPnl(totalPnl)}
                        </span>
                        {bundle.duplicateCount > 0 && ` · ${bundle.duplicateCount} dupes skipped`}
                        {bundle.parsed.detectedAccountNumber && (
                          <span className="text-[var(--text-muted)]"> · Acct: {bundle.parsed.detectedAccountNumber}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Account matcher */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {bundle.autoMatched && matchedAccount ? (
                      <span className="text-xs text-[#4ADE80] flex items-center gap-1 font-semibold px-3 py-1.5 rounded-lg bg-[#4ADE80]/10">
                        <CheckCircle size={12} />
                        {matchedAccount.nickname || matchedAccount.firmName}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link2 size={12} className="text-[var(--text-muted)]" />
                        <select
                          className="input-field text-xs py-1.5 max-w-[180px]"
                          value={bundle.linkedAccountId || ''}
                          onChange={e => updateBundleAccount(idx, e.target.value || null)}
                        >
                          <option value="">Link to account...</option>
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.nickname || a.firmName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compact trade preview (first 5) */}
                <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                  <table className="w-full trade-table text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th>Date</th>
                        <th>Symbol</th>
                        <th>Side</th>
                        <th>Qty</th>
                        <th>Entry</th>
                        <th>Exit</th>
                        <th>Net P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bundle.parsed.trades.slice(0, 5).map(t => (
                        <tr key={t.id}>
                          <td className="text-[var(--text-muted)]">{t.date}</td>
                          <td><span className="font-mono font-bold bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">{t.symbol}</span></td>
                          <td>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              t.side === 'Long' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                            }`}>{t.side}</span>
                          </td>
                          <td className="font-mono">{t.contracts}</td>
                          <td className="font-mono">{t.entryPrice.toFixed(2)}</td>
                          <td className="font-mono">{t.exitPrice.toFixed(2)}</td>
                          <td className={`font-mono font-bold ${t.netPnl >= 0 ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>
                            {formatPnl(t.netPnl)}
                          </td>
                        </tr>
                      ))}
                      {bundle.parsed.trades.length > 5 && (
                        <tr>
                          <td colSpan={7} className="text-center text-[var(--text-muted)] text-[11px] py-2">
                            +{bundle.parsed.trades.length - 5} more trades
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
