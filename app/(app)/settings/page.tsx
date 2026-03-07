'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save, Trash2, AlertTriangle, Database,
  Globe, DollarSign, Zap, RotateCcw, CheckCircle,
  Shield, Monitor, Palette, Bell, HardDrive, Download, Upload,
  CreditCard, Crown, ExternalLink, Check
} from 'lucide-react'
import * as dl from '@/lib/data-layer'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/components/AuthContext'
import UpgradeModal from '@/components/UpgradeModal'
import { getSettings as localGetSettings } from '@/lib/storage'
import { Account, AppSettings, DEFAULT_FEE_SCHEDULE } from '@/lib/types'

function SectionCard({ icon: Icon, title, description, children, accent = '#2D8B4E' }: {
  icon: any; title: string; description?: string; children: React.ReactNode; accent?: string
}) {
  return (
    <div className="rounded-3xl overflow-hidden" style={{background:"#0c1120", border:"1px solid rgba(255,255,255,0.07)"}}>
      <div className="px-8 py-5 border-b border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${accent}08, transparent)` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
            <Icon size={18} style={{ color: accent }} />
          </div>
          <div>
            <h2 className="font-bold text-white text-[15px]">{title}</h2>
            {description && <p className="text-xs text-[#64748B] mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-8 space-y-6">{children}</div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#64748B] mb-1.5">{children}</label>
}

function StyledInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-2xl text-sm text-white focus:outline-none transition-all placeholder:text-[#475569] ${className}`}
      style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)'}}
    />
  )
}

function StyledSelect({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-2xl text-sm text-white focus:outline-none transition-all appearance-none cursor-pointer ${className}`}
      style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)'}}
    >
      {children}
    </select>
  )
}

// Default settings for the initial render (before async load resolves)
const INITIAL_SETTINGS: AppSettings = {
  activeAccountId: '',
  currency: 'USD',
  timezone: 'America/New_York',
  defaultContracts: 1,
  theme: 'light',
  sidebarCollapsed: false,
  feeSchedule: DEFAULT_FEE_SCHEDULE,
  autoFees: true,
}

export default function SettingsPage() {
  const router = useRouter()
  // Start with a best-effort sync read (localStorage), updated once async load resolves
  const [settings, setSettings] = useState<AppSettings>(() => {
    try { return localGetSettings() } catch { return INITIAL_SETTINGS }
  })
  const [saved, setSaved] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [feeSchedule, setFeeSchedule] = useState<Record<string, number>>({})

  useEffect(() => {
    async function load() {
      const s = await dl.getSettings()
      setSettings(s)
      setFeeSchedule(s.feeSchedule || DEFAULT_FEE_SCHEDULE)
      // Accounts (regular Account[]) are always localStorage-based for now
      setAccounts(dl.getAccounts())
    }
    load()
  }, [])

  const save = async () => {
    await dl.saveSettings({ ...settings, feeSchedule, autoFees: settings.autoFees })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleResetDemo = async () => {
    // Delete from Supabase (if logged in) AND localStorage
    await dl.deleteAllTrades()
    // Clear all localStorage sf_ keys too
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sf_'))
      keys.forEach(k => localStorage.removeItem(k))
      // Hard reload to fully reset React state
      window.location.href = '/dashboard'
    }
  }

  const activeAccount = accounts.find(a => a.id === settings.activeAccountId) || accounts[0]

  const updateAccount = (data: Partial<Account>) => {
    if (!activeAccount) return
    const updated = { ...activeAccount, ...data }
    dl.saveAccount(updated)
    setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a))
  }

  // Fee symbols grouped
  const feeGroups = [
    { label: 'E-Mini', symbols: ['ES', 'NQ', 'YM', 'RTY'] },
    { label: 'Micro', symbols: ['MES', 'MNQ', 'MYM', 'M2K'] },
    { label: 'Energy', symbols: ['CL', 'MCL'] },
    { label: 'Metals', symbols: ['GC', 'MGC', 'SI'] },
    { label: 'Bonds', symbols: ['ZB', 'ZN'] },
    { label: 'Grains', symbols: ['ZC', 'ZS', 'ZW'] },
    { label: 'Currencies', symbols: ['6E', '6J'] },
  ]

  const { isPro } = useSubscription()
  const { user } = useAuth()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Configure your StayFunded workspace</p>
        </div>
        <button
          onClick={save}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
            saved
              ? 'bg-[#2D8B4E] text-white shadow-lg shadow-green-500/25'
              : 'bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Account */}
      <SectionCard icon={DollarSign} title="Account" description="Manage your trading account settings">
        {activeAccount && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Account Name</FieldLabel>
                <StyledInput value={activeAccount.name}
                  onChange={e => updateAccount({ name: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Platform</FieldLabel>
                <StyledSelect value={activeAccount.platform || ''}
                  onChange={e => updateAccount({ platform: e.target.value })}>
                  <option value="Tradovate">Tradovate</option>
                  <option value="Rithmic">Rithmic</option>
                  <option value="TopstepX">TopstepX</option>
                  <option value="NinjaTrader">NinjaTrader</option>
                  <option value="Other">Other</option>
                </StyledSelect>
              </div>
              <div>
                <FieldLabel>Account Type</FieldLabel>
                <div className="flex gap-2">
                  {(['personal', 'challenge', 'funded'] as const).map(phase => (
                    <button
                      key={phase}
                      onClick={() => updateAccount({ phase })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                        activeAccount.phase === phase
                          ? 'bg-[#2D8B4E] text-white shadow-md shadow-green-500/20'
                          : 'bg-[#F5F7FA] dark:bg-[#0d1117] text-[#6B7E91] dark:text-[#64748B] border border-[#E4E9F0] dark:border-[#21262d] hover:border-[#2D8B4E]/30'
                      }`}
                    >
                      {phase}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Starting Balance ($)</FieldLabel>
                <StyledInput type="number" className="font-mono" value={activeAccount.startingBalance}
                  onChange={e => updateAccount({ startingBalance: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            {(activeAccount.phase === 'challenge' || activeAccount.phase === 'funded') && (
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#E4E9F0]/50 dark:border-[#1a2035]">
                <div>
                  <FieldLabel>Max Daily Loss ($)</FieldLabel>
                  <StyledInput type="number" className="font-mono" value={activeAccount.maxDailyLoss || ''}
                    onChange={e => updateAccount({ maxDailyLoss: parseFloat(e.target.value) || undefined })}
                    placeholder="1,000" />
                </div>
                <div>
                  <FieldLabel>Max Drawdown ($)</FieldLabel>
                  <StyledInput type="number" className="font-mono" value={activeAccount.maxTotalDrawdown || ''}
                    onChange={e => updateAccount({ maxTotalDrawdown: parseFloat(e.target.value) || undefined })}
                    placeholder="2,000" />
                </div>
                <div>
                  <FieldLabel>Profit Target ($)</FieldLabel>
                  <StyledInput type="number" className="font-mono" value={activeAccount.profitTarget || ''}
                    onChange={e => updateAccount({ profitTarget: parseFloat(e.target.value) || undefined })}
                    placeholder="3,000" />
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* General */}
      <SectionCard icon={Globe} title="General" description="Currency and default preferences" accent="#3B82F6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Currency</FieldLabel>
            <StyledSelect value={settings.currency}
              onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}>
              <option value="USD">🇺🇸 USD — US Dollar</option>
              <option value="EUR">🇪🇺 EUR — Euro</option>
              <option value="GBP">🇬🇧 GBP — British Pound</option>
              <option value="CAD">🇨🇦 CAD — Canadian Dollar</option>
            </StyledSelect>
          </div>
          <div>
            <FieldLabel>Default Contracts</FieldLabel>
            <StyledInput type="number" min="1" className="font-mono" value={settings.defaultContracts}
              onChange={e => setSettings(s => ({ ...s, defaultContracts: parseInt(e.target.value) || 1 }))} />
          </div>
        </div>
      </SectionCard>

      {/* Fee Schedule */}
      <SectionCard icon={Zap} title="Fee Schedule" description="Per-side fees for round-trip calculations" accent="#F59E0B">
        {/* Auto-calculate toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#F59E0B]/5 to-transparent border border-[#F59E0B]/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
              <Zap size={16} className="text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1E2D3D] dark:text-[#e6edf3]">Auto-calculate fees on import</p>
              <p className="text-[11px] text-[#6B7E91] dark:text-[#64748B]">Apply fee schedule automatically when importing CSV trades</p>
            </div>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, autoFees: !s.autoFees }))}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
              settings.autoFees ? 'bg-[#2D8B4E] shadow-md shadow-green-500/20' : 'bg-[#E4E9F0] dark:bg-[#21262d]'
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
              settings.autoFees ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <p className="text-[11px] text-[#9EB0C0] dark:text-[#4d5566] px-1">
          Fee per side (entry + exit = 2 sides). Round-trip fee = fee × 2 × contracts.
        </p>

        {/* Grouped fee inputs */}
        <div className="space-y-4">
          {feeGroups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#9EB0C0] dark:text-[#4d5566] mb-2 px-1">{group.label}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {group.symbols.filter(sym => sym in feeSchedule).map(sym => (
                  <div key={sym} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F7FA] dark:bg-[#0d1117] border border-[#E4E9F0] dark:border-[#21262d] hover:border-[#F59E0B]/30 transition-colors group">
                    <span className="text-xs font-mono font-bold text-[#1E2D3D] dark:text-[#e6edf3] w-8 flex-shrink-0">{sym}</span>
                    <span className="text-xs text-[#9EB0C0] dark:text-[#4d5566]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="flex-1 bg-transparent text-xs font-mono text-[#1E2D3D] dark:text-[#e6edf3] focus:outline-none w-12"
                      value={feeSchedule[sym]}
                      onChange={e => setFeeSchedule(f => ({ ...f, [sym]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setFeeSchedule(DEFAULT_FEE_SCHEDULE)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#6B7E91] dark:text-[#64748B] bg-[#F5F7FA] dark:bg-[#0d1117] border border-[#E4E9F0] dark:border-[#21262d] hover:border-[#F59E0B]/30 transition-colors"
        >
          <RotateCcw size={12} /> Reset to Defaults
        </button>
      </SectionCard>

      {/* Data Management */}
      {/* Subscription */}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <div className="rounded-3xl overflow-hidden" style={{background:'#0c1120', border:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#4ADE80]/40 to-transparent" />
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center">
              <Crown size={18} className="text-[#4ADE80]" />
            </div>
            <div>
              <h2 className="font-bold text-white text-[15px]">Subscription</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Manage your plan and billing</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPro ? 'bg-[#4ADE80]/15 text-[#4ADE80]' : 'bg-white/[0.06] text-[#64748B]'}`}>
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>
        <div className="px-8 pb-6 space-y-3">
          {isPro ? (
            <>
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{background:'rgba(74,222,128,0.05)', border:'1px solid rgba(74,222,128,0.15)'}}>
                <Check size={16} className="text-[#4ADE80]" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">StayFunded Pro</p>
                  <p className="text-xs text-[#64748B] mt-0.5">Unlimited accounts · 1GB storage · Charts · Reports · AI insights</p>
                </div>
              </div>
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-[#64748B] hover:text-white transition-all"
                style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}
              >
                <ExternalLink size={14} />
                {portalLoading ? 'Loading...' : 'Manage Billing & Invoices'}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)'}}>
                <CreditCard size={16} className="text-[#64748B]" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Free Plan</p>
                  <p className="text-xs text-[#64748B] mt-0.5">3 accounts · CSV import · Basic analytics</p>
                </div>
              </div>
              <button
                onClick={() => setUpgradeOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-black transition-all hover:opacity-90"
                style={{background:'linear-gradient(135deg, #4ADE80, #22C55E)'}}
              >
                <Crown size={14} />
                Upgrade to Pro — $14/mo or $99/yr
              </button>
            </>
          )}
        </div>
      </div>

      <SectionCard icon={Database} title="Data Management" description="Storage and data controls" accent="#EF4444">
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#0d1117] to-[#0d1117] border border-[#21262d]">
          <div className="flex items-center gap-3 mb-3">
            <HardDrive size={16} className="text-[#6B7E91]" />
            <p className="text-sm font-medium text-[#e6edf3]">Local Storage</p>
          </div>
          <p className="text-xs text-[#6B7E91] dark:text-[#64748B] mb-4">
            All data is stored locally in your browser. No account or server required. Clear your browser data to reset everything.
          </p>
          <div className="flex gap-3">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 hover:bg-[#EF4444]/20 transition-colors"
              >
                <Trash2 size={14} />
                Clear All Trade Data
              </button>
            ) : (
              <div className="w-full p-4 bg-[#EF4444]/5 border border-[#EF4444]/30 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#EF4444] text-sm">Permanently delete all trades and notes?</p>
                    <p className="text-[11px] text-[#6B7E91] mt-0.5">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleResetDemo}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] transition-colors">
                    <Trash2 size={12} /> Yes, Delete Everything
                  </button>
                  <button onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B7E91] bg-[#F5F7FA] dark:bg-[#161b22] border border-[#E4E9F0] dark:border-[#21262d] hover:border-[#6B7E91]/30 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  )
}
