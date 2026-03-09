'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Save, Trash2, AlertTriangle, Database,
  Globe, DollarSign, Zap, RotateCcw, CheckCircle,
  Shield, Monitor, Palette, Bell, HardDrive, Download, Upload,
  CreditCard, Crown, ExternalLink, Check, LogOut, User, Eye, EyeOff
} from 'lucide-react'
import * as dl from '@/lib/data-layer'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/components/AuthContext'
import UpgradeModal from '@/components/UpgradeModal'
import { getSettings as localGetSettings, getSetups, saveSetups as persistSetups } from '@/lib/storage'
import { Account, AppSettings, DEFAULT_FEE_SCHEDULE } from '@/lib/types'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)] mb-1.5">{children}</label>
}

function StyledInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-2xl text-sm text-[var(--text-primary)] focus:outline-none transition-all placeholder:text-[var(--text-muted)] ${className}`}
      style={{background:'var(--bg-card)', border:'1px solid rgba(255,255,255,0.08)'}}
    />
  )
}

function StyledSelect({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-2xl text-sm text-[var(--text-primary)] focus:outline-none transition-all appearance-none cursor-pointer ${className}`}
      style={{background:'var(--bg-card)', border:'1px solid rgba(255,255,255,0.08)'}}
    >
      {children}
    </select>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
      {description && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{description}</p>}
    </div>
  )
}

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
  const { user, signOut } = useAuth()
  const { isPro } = useSubscription()
  const [settings, setSettings] = useState<AppSettings>(() => {
    try { return localGetSettings() } catch { return INITIAL_SETTINGS }
  })
  const [saved, setSaved] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [feeSchedule, setFeeSchedule] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState('profile')
  const settingsSearchParams = useSearchParams()
  const [upgradeOpen, setUpgradeOpen] = useState(settingsSearchParams.get('upgrade') === 'true')
  const [portalLoading, setPortalLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  // Setups state
  const [setups, setSetups] = useState<string[]>([])
  const [newSetup, setNewSetup] = useState('')

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'general', label: 'General' },
    { id: 'setups', label: 'Setups' },
    { id: 'fees', label: 'Fees' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'data', label: 'Data' },
    { id: 'contact', label: 'Contact Us' },
  ]

  useEffect(() => {
    async function load() {
      const s = await dl.getSettings()
      setSettings(s)
      setFeeSchedule(s.feeSchedule || DEFAULT_FEE_SCHEDULE)
      setAccounts(dl.getAccounts())
      setSetups(getSetups())
    }
    load()
  }, [])

  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name)
    }
  }, [user])

  const save = async () => {
    await dl.saveSettings({ ...settings, feeSchedule, autoFees: settings.autoFees })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleResetDemo = async () => {
    await dl.deleteAllTrades()
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sf_'))
      keys.forEach(k => localStorage.removeItem(k))
      window.location.href = '/dashboard'
    }
  }

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

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const handleChangePassword = async () => {
    setPwMessage(null)
    if (!newPassword || !confirmPassword) {
      setPwMessage({ type: 'error', text: 'Please fill in all fields.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    setPwLoading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPwMessage({ type: 'error', text: error.message })
      } else {
        setPwMessage({ type: 'success', text: 'Password updated successfully.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setPwMessage({ type: 'error', text: 'Something went wrong. Try again.' })
    } finally {
      setPwLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.updateUser({ data: { display_name: displayName } })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { /* ignore */ }
  }

  const feeGroups = [
    { label: 'E-Mini', symbols: ['ES', 'NQ', 'YM', 'RTY'] },
    { label: 'Micro', symbols: ['MES', 'MNQ', 'MYM', 'M2K'] },
    { label: 'Energy', symbols: ['CL', 'MCL'] },
    { label: 'Metals', symbols: ['GC', 'MGC', 'SI'] },
    { label: 'Bonds', symbols: ['ZB', 'ZN'] },
    { label: 'Grains', symbols: ['ZC', 'ZS', 'ZW'] },
    { label: 'Currencies', symbols: ['6E', '6J'] },
  ]

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your account and preferences</p>
      </div>

      {/* Tab Bar — underline style */}
      <div className="flex overflow-x-auto border-b border-[var(--border)] -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 sm:px-5 py-3 text-sm font-semibold transition-all relative whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4ADE80] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4ADE80] to-[#22C55E] flex items-center justify-center text-black text-2xl font-bold">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{displayName || user?.email || 'User'}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4ADE80]/15 text-[#4ADE80]">Verified</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeader title="Profile Information" description="Update your display name and view account details" />
            <div>
              <FieldLabel>Display Name</FieldLabel>
              <StyledInput
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>
            <div>
              <FieldLabel>Email Address</FieldLabel>
              <div className="w-full px-4 py-3 rounded-2xl text-sm text-[var(--text-secondary)]" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}>
                {user?.email}
              </div>
            </div>
            <div>
              <FieldLabel>Auth Method</FieldLabel>
              <div className="w-full px-4 py-3 rounded-2xl text-sm text-[var(--text-secondary)]" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}>
                Email &amp; Password
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
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

          {/* Logout */}
          <div className="pt-6 border-t border-[var(--border)]">
            <SectionHeader title="Sign Out" description="Log out of your StayFunded account" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 hover:bg-[#EF4444]/20 transition-colors"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-8">
          <SectionHeader title="Change Password" description="Update your account password" />
          <div className="space-y-4">
            <div>
              <FieldLabel>Current Password</FieldLabel>
              <div className="relative">
                <StyledInput
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <FieldLabel>New Password</FieldLabel>
              <div className="relative">
                <StyledInput
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <FieldLabel>Confirm New Password</FieldLabel>
              <div className="relative">
                <StyledInput
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <button onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {pwMessage && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                pwMessage.type === 'success' ? 'bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
              }`}>
                {pwMessage.text}
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={pwLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-[#4ADE80] to-[#22C55E] hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
            >
              <Shield size={16} />
              {pwLoading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-8">
          <SectionHeader title="General" description="Currency and default preferences" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Currency</FieldLabel>
              <StyledSelect value={settings.currency}
                onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="CAD">CAD — Canadian Dollar</option>
              </StyledSelect>
            </div>
            <div>
              <FieldLabel>Default Contracts</FieldLabel>
              <StyledInput type="number" min="1" className="font-mono" value={settings.defaultContracts}
                onChange={e => setSettings(s => ({ ...s, defaultContracts: parseInt(e.target.value) || 1 }))} />
            </div>
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
      )}

      {/* Setups Tab */}
      {activeTab === 'setups' && (
        <div className="space-y-8">
          <SectionHeader title="Setup Manager" description="Define your trade setups so you can quickly tag trades after importing." />

          {/* Add new setup */}
          <div className="flex gap-3">
            <StyledInput
              placeholder="e.g. Breakout, Pullback, VWAP Bounce..."
              value={newSetup}
              onChange={e => setNewSetup(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newSetup.trim()) {
                  const updated = [...setups, newSetup.trim()]
                  setSetups(updated)
                  persistSetups(updated)
                  setNewSetup('')
                }
              }}
            />
            <button
              onClick={() => {
                if (!newSetup.trim()) return
                const updated = [...setups, newSetup.trim()]
                setSetups(updated)
                persistSetups(updated)
                setNewSetup('')
              }}
              className="px-5 py-3 rounded-2xl bg-[var(--green)] text-white text-sm font-semibold hover:opacity-90 transition-all whitespace-nowrap"
            >
              Add
            </button>
          </div>

          {/* Setups list */}
          {setups.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-[var(--text-muted)] text-sm">No setups defined yet. Add your first setup above.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['Breakout', 'Pullback', 'VWAP Bounce', 'Gap Fill', 'Trend Continuation', 'Reversal', 'Range Fade', 'Opening Drive'].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      const updated = [...setups, s]
                      setSetups(updated)
                      persistSetups(updated)
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--green)] hover:text-[var(--green)] transition-all"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card divide-y divide-[var(--border)]">
              {setups.map((setup, idx) => (
                <div key={idx} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{setup}</span>
                  <div className="flex items-center gap-2">
                    {/* Move up */}
                    {idx > 0 && (
                      <button
                        onClick={() => {
                          const updated = [...setups]
                          ;[updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]]
                          setSetups(updated)
                          persistSetups(updated)
                        }}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-all"
                        title="Move up"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                      </button>
                    )}
                    {/* Move down */}
                    {idx < setups.length - 1 && (
                      <button
                        onClick={() => {
                          const updated = [...setups]
                          ;[updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]
                          setSetups(updated)
                          persistSetups(updated)
                        }}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-all"
                        title="Move down"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    )}
                    {/* Delete */}
                    <button
                      onClick={() => {
                        const updated = setups.filter((_, i) => i !== idx)
                        setSetups(updated)
                        persistSetups(updated)
                      }}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#FF453A] hover:bg-[var(--border)] transition-all"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)]">
            These setups will appear as a dropdown when editing trades in the Trade Detail drawer.
          </p>
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <div className="space-y-8">
          <SectionHeader title="Fee Schedule" description="Per-side fees for round-trip calculations" />

          <div className="flex items-center justify-between p-4 rounded-2xl" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <Zap size={16} className="text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Auto-calculate fees on import</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Apply fee schedule automatically when importing CSV trades</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, autoFees: !s.autoFees }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
                settings.autoFees ? 'bg-[#2D8B4E] shadow-md shadow-green-500/20' : 'bg-[var(--bg-card)]'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                settings.autoFees ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] px-1">
            Fee per side (entry + exit = 2 sides). Round-trip fee = fee x 2 x contracts.
          </p>

          <div className="space-y-4">
            {feeGroups.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-2 px-1">{group.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {group.symbols.filter(sym => sym in feeSchedule).map(sym => (
                    <div key={sym} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] hover:border-[#F59E0B]/30 transition-colors" style={{background:'var(--bg-card)'}}>
                      <span className="text-xs font-mono font-bold text-[var(--text-primary)] w-8 flex-shrink-0">{sym}</span>
                      <span className="text-xs text-[var(--text-secondary)]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="flex-1 bg-transparent text-xs font-mono text-[var(--text-primary)] focus:outline-none w-12"
                        value={feeSchedule[sym]}
                        onChange={e => setFeeSchedule(f => ({ ...f, [sym]: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setFeeSchedule(DEFAULT_FEE_SCHEDULE)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" style={{background:'var(--bg-card)', border:'1px solid var(--border)'}}
            >
              <RotateCcw size={12} /> Reset to Defaults
            </button>
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
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-8">
          <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

          <div className="flex items-center justify-between">
            <SectionHeader title="Current Plan" description="Manage your subscription and billing" />
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPro ? 'bg-[#4ADE80]/15 text-[#4ADE80]' : 'bg-[var(--border)] text-[var(--text-secondary)]'}`}>
              {isPro ? 'Pro' : 'Free'}
            </span>
          </div>

          {isPro ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--text-secondary)]">Plan</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">StayFunded Pro</span>
                </div>
                <div className="flex justify-between py-3 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--text-secondary)]">Accounts</span>
                  <span className="text-sm text-[var(--text-primary)]">Unlimited</span>
                </div>
                <div className="flex justify-between py-3 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--text-secondary)]">Storage</span>
                  <span className="text-sm text-[var(--text-primary)]">1GB</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-3">Included Features</p>
                <div className="space-y-2">
                  {['CSV import (Tradovate)', 'Advanced analytics & charts', 'Trade journal', 'Progress tracker', 'AI insights', 'Reports'].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={14} className="text-[#4ADE80]" />
                      <span className="text-sm text-[var(--text-secondary)]">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                style={{background:'var(--bg-card)', border:'1px solid rgba(255,255,255,0.08)'}}
              >
                <ExternalLink size={14} />
                {portalLoading ? 'Loading...' : 'Manage Billing & Invoices'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--text-secondary)]">Plan</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Free</span>
                </div>
                <div className="flex justify-between py-3 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--text-secondary)]">Billing Cycle</span>
                  <span className="text-sm text-[var(--text-primary)]">Free forever</span>
                </div>
                <div className="flex justify-between py-3 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--text-secondary)]">Accounts</span>
                  <span className="text-sm text-[var(--text-primary)]">Up to 3 accounts</span>
                </div>
                <div className="flex justify-between py-3 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--text-secondary)]">Storage</span>
                  <span className="text-sm text-[var(--text-primary)]">No file storage</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-3">Included Features</p>
                <div className="space-y-2">
                  {['CSV import (Tradovate)', 'Basic analytics', 'Trade journal', 'Progress tracker'].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={14} className="text-[#4ADE80]" />
                      <span className="text-sm text-[var(--text-secondary)]">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setUpgradeOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{background:'linear-gradient(135deg, #4ADE80, #22C55E)'}}
              >
                <Crown size={14} />
                Upgrade to Pro — $14/mo or $99/yr
              </button>
            </div>
          )}
        </div>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="space-y-8">
          <SectionHeader title="Data Management" description="Storage and data controls" />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <HardDrive size={16} className="text-[var(--text-secondary)]" />
              <p className="text-sm font-medium text-[var(--text-primary)]">Local Storage</p>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              All data is stored locally in your browser. No account or server required. Clear your browser data to reset everything.
            </p>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 hover:bg-[#EF4444]/20 transition-colors"
              >
                <Trash2 size={14} />
                Clear All Trade Data
              </button>
            ) : (
              <div className="p-4 bg-[#EF4444]/5 border border-[#EF4444]/30 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#EF4444] text-sm">Permanently delete all trades and notes?</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleResetDemo}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] bg-[#EF4444] hover:bg-[#DC2626] transition-colors">
                    <Trash2 size={12} /> Yes, Delete Everything
                  </button>
                  <button onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border)] hover:border-[#64748B]/30 transition-colors" style={{background:'var(--bg-card)'}}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="space-y-8">
          <SectionHeader title="Contact Us" description="Get in touch with the StayFunded team" />

          <div className="space-y-6">
            {/* Email */}
            <div className="p-5 rounded-xl border border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Email Support</p>
                  <p className="text-xs text-[var(--text-secondary)]">We typically respond within 24 hours</p>
                </div>
              </div>
              <a href="mailto:support@stayfunded.app"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#4ADE80] bg-[#4ADE80]/10 border border-[#4ADE80]/20 hover:bg-[#4ADE80]/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                support@stayfunded.app
              </a>
            </div>

            {/* Twitter/X */}
            <div className="p-5 rounded-xl border border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1DA1F2]/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Twitter / X</p>
                  <p className="text-xs text-[var(--text-secondary)]">Follow us for updates and tips</p>
                </div>
              </div>
              <a href="https://x.com/StayFundedApp" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1DA1F2] bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 hover:bg-[#1DA1F2]/20 transition-colors">
                <ExternalLink size={14} />
                @StayFundedApp
              </a>
            </div>

            {/* Feature Request */}
            <div className="p-5 rounded-xl border border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Feature Requests</p>
                  <p className="text-xs text-[var(--text-secondary)]">Have an idea? We&apos;d love to hear it</p>
                </div>
              </div>
              <a href="mailto:features@stayfunded.app?subject=Feature Request"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                features@stayfunded.app
              </a>
            </div>

            {/* Bug Report */}
            <div className="p-5 rounded-xl border border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Report a Bug</p>
                  <p className="text-xs text-[var(--text-secondary)]">Found something broken? Let us know</p>
                </div>
              </div>
              <a href="mailto:bugs@stayfunded.app?subject=Bug Report"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 hover:bg-[#EF4444]/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                bugs@stayfunded.app
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
