'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { getSettings as localGetSettings } from '@/lib/storage'
import { Account, AppSettings, DEFAULT_FEE_SCHEDULE } from '@/lib/types'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#64748B] mb-1.5">{children}</label>
}

function StyledInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-2xl text-sm text-white focus:outline-none transition-all placeholder:text-[#475569] ${className}`}
      style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}
    />
  )
}

function StyledSelect({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 rounded-2xl text-sm text-white focus:outline-none transition-all appearance-none cursor-pointer ${className}`}
      style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}
    >
      {children}
    </select>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-bold text-white">{title}</h3>
      {description && <p className="text-sm text-[#64748B] mt-0.5">{description}</p>}
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
  const [upgradeOpen, setUpgradeOpen] = useState(false)
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

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'general', label: 'General' },
    { id: 'fees', label: 'Fees' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'data', label: 'Data' },
  ]

  useEffect(() => {
    async function load() {
      const s = await dl.getSettings()
      setSettings(s)
      setFeeSchedule(s.feeSchedule || DEFAULT_FEE_SCHEDULE)
      setAccounts(dl.getAccounts())
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
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#64748B] mt-1">Manage your account and preferences</p>
      </div>

      {/* Tab Bar — underline style */}
      <div className="flex overflow-x-auto border-b border-white/[0.06] -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 sm:px-5 py-3 text-sm font-semibold transition-all relative whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-[#64748B] hover:text-[#94A3B8]'
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
              <p className="text-lg font-bold text-white">{displayName || user?.email || 'User'}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-[#64748B]">{user?.email}</p>
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
              <div className="w-full px-4 py-3 rounded-2xl text-sm text-[#94A3B8]" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)'}}>
                {user?.email}
              </div>
            </div>
            <div>
              <FieldLabel>Auth Method</FieldLabel>
              <div className="w-full px-4 py-3 rounded-2xl text-sm text-[#94A3B8]" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)'}}>
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
          <div className="pt-6 border-t border-white/[0.06]">
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
                <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors">
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
                <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors">
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
                <button onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors">
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

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <div className="space-y-8">
          <SectionHeader title="Fee Schedule" description="Per-side fees for round-trip calculations" />

          <div className="flex items-center justify-between p-4 rounded-2xl" style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <Zap size={16} className="text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Auto-calculate fees on import</p>
                <p className="text-[11px] text-[#64748B]">Apply fee schedule automatically when importing CSV trades</p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, autoFees: !s.autoFees }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
                settings.autoFees ? 'bg-[#2D8B4E] shadow-md shadow-green-500/20' : 'bg-[#21262d]'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                settings.autoFees ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <p className="text-[11px] text-[#4d5566] px-1">
            Fee per side (entry + exit = 2 sides). Round-trip fee = fee x 2 x contracts.
          </p>

          <div className="space-y-4">
            {feeGroups.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#4d5566] mb-2 px-1">{group.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {group.symbols.filter(sym => sym in feeSchedule).map(sym => (
                    <div key={sym} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#21262d] hover:border-[#F59E0B]/30 transition-colors" style={{background:'rgba(255,255,255,0.02)'}}>
                      <span className="text-xs font-mono font-bold text-white w-8 flex-shrink-0">{sym}</span>
                      <span className="text-xs text-[#4d5566]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="flex-1 bg-transparent text-xs font-mono text-white focus:outline-none w-12"
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-white transition-colors" style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)'}}
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
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPro ? 'bg-[#4ADE80]/15 text-[#4ADE80]' : 'bg-white/[0.06] text-[#64748B]'}`}>
              {isPro ? 'Pro' : 'Free'}
            </span>
          </div>

          {isPro ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-white/[0.06]">
                  <span className="text-sm text-[#64748B]">Plan</span>
                  <span className="text-sm font-semibold text-white">StayFunded Pro</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/[0.06]">
                  <span className="text-sm text-[#64748B]">Accounts</span>
                  <span className="text-sm text-white">Unlimited</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/[0.06]">
                  <span className="text-sm text-[#64748B]">Storage</span>
                  <span className="text-sm text-white">1GB</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-[#4d5566] mb-3">Included Features</p>
                <div className="space-y-2">
                  {['CSV import (Tradovate)', 'Advanced analytics & charts', 'Trade journal', 'Progress tracker', 'AI insights', 'Reports'].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={14} className="text-[#4ADE80]" />
                      <span className="text-sm text-[#94A3B8]">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] hover:text-white transition-all"
                style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}
              >
                <ExternalLink size={14} />
                {portalLoading ? 'Loading...' : 'Manage Billing & Invoices'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-white/[0.06]">
                  <span className="text-sm text-[#64748B]">Plan</span>
                  <span className="text-sm font-semibold text-white">Free</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/[0.06]">
                  <span className="text-sm text-[#64748B]">Billing Cycle</span>
                  <span className="text-sm text-white">Free forever</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/[0.06]">
                  <span className="text-sm text-[#64748B]">Accounts</span>
                  <span className="text-sm text-white">Up to 3 accounts</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/[0.06]">
                  <span className="text-sm text-[#64748B]">Storage</span>
                  <span className="text-sm text-white">No file storage</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-[#4d5566] mb-3">Included Features</p>
                <div className="space-y-2">
                  {['CSV import (Tradovate)', 'Basic analytics', 'Trade journal', 'Progress tracker'].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={14} className="text-[#4ADE80]" />
                      <span className="text-sm text-[#94A3B8]">{f}</span>
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
              <HardDrive size={16} className="text-[#64748B]" />
              <p className="text-sm font-medium text-white">Local Storage</p>
            </div>
            <p className="text-sm text-[#64748B]">
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
                    <p className="text-[11px] text-[#64748B] mt-0.5">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleResetDemo}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] transition-colors">
                    <Trash2 size={12} /> Yes, Delete Everything
                  </button>
                  <button onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] border border-[#21262d] hover:border-[#64748B]/30 transition-colors" style={{background:'rgba(255,255,255,0.03)'}}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
