'use client'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

import { useState, FormEvent, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/components/AuthContext'
import { supabase } from '@/lib/supabase'
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { CanvasRevealEffect } from '@/components/ui/canvas-reveal-wrapper'
import { CanvasErrorBoundary } from '@/components/ui/canvas-error-boundary'

type PageMode = 'signin' | 'signup' | 'reset'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp } = useAuth()

  const [mode, setMode]               = useState<PageMode>('signin')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState<string | null>(null)
  const [failedAttempts, setFailed]   = useState(0)
  const [cooldown, setCooldown]       = useState(false)
  const [mounted, setMounted]           = useState(false)
  const [step, setStep]               = useState<'form' | 'success'>('form')
  const [reverseCanvas, setReverse]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const switchMode = (next: PageMode) => {
    setMode(next); setError(null); setSuccess(null); setFailed(0); setCooldown(false);
  }

  const handleReset = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setSuccess(null)
    if (!email.trim()) { setError('Enter your email.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) setError(error.message)
      else setSuccess('Reset link sent! Check your inbox.')
    } finally { setLoading(false) }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setSuccess(null)
    if (!email.trim()) { setError('Email is required'); return }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (failedAttempts >= 5) { setError('Too many attempts. Please wait.'); return }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message.includes('Invalid') ? 'Incorrect email or password.' : error.message)
          setFailed(f => f + 1); setCooldown(true); setTimeout(() => setCooldown(false), 2000)
        } else {
          setStep('success')
          setTimeout(() => { window.location.href = '/dashboard' }, 800)
        }
      } else {
        const { error } = await signUp(email, password, displayName.trim() || undefined)
        if (error) {
          setError(error.message.includes('already registered') ? 'Account already exists. Try signing in.' : error.message)
          setFailed(f => f + 1); setCooldown(true); setTimeout(() => setCooldown(false), 2000)
        } else {
          setSuccess('Account created! Check your email to confirm, then sign in.')
          switchMode('signin')
        }
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#050810] overflow-hidden">
      {/* Canvas background */}
      <div className="absolute inset-0 z-0">
        <CanvasErrorBoundary>
        {mounted && !reverseCanvas && (
          <CanvasRevealEffect
            animationSpeed={3}
            colors={[[74, 222, 128], [34, 197, 94]]}
            dotSize={4}
            opacities={[0.1,0.1,0.1,0.2,0.2,0.2,0.4,0.4,0.4,0.6]}
            reverse={false}
          />
        )}
        {mounted && reverseCanvas && (
          <CanvasRevealEffect
            animationSpeed={4}
            colors={[[74, 222, 128], [34, 197, 94]]}
            dotSize={4}
            opacities={[0.1,0.1,0.1,0.2,0.2,0.2,0.4,0.4,0.4,0.6]}
            reverse={true}
          />
        )}
        </CanvasErrorBoundary>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center mb-8"
          >
            <img src="/logo.png" alt="StayFunded" className="h-12 w-auto mb-3" onError={e => (e.currentTarget.style.display='none')} />
            <h1 className="text-2xl font-bold text-white tracking-tight">StayFunded</h1>
            <p className="text-gray-500 text-sm mt-1">
              {mode === 'signin' ? 'Welcome back, trader' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">You&apos;re in!</h2>
                  <p className="text-gray-400 mt-1">Redirecting to dashboard…</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
              >
                {mode !== 'reset' && (
                  <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                    {(['signin','signup'] as PageMode[]).map(m => (
                      <button key={m} onClick={() => switchMode(m)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                        {m === 'signin' ? 'Sign In' : 'Sign Up'}
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'reset' && (
                  <button onClick={() => switchMode('signin')} className="text-gray-500 hover:text-gray-300 text-sm mb-5 transition-colors flex items-center gap-1">
                    ← Back to sign in
                  </button>
                )}

                {success && (
                  <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-5 text-green-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{success}</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span>
                  </div>
                )}

                <form onSubmit={mode === 'reset' ? handleReset : handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Display Name <span className="text-gray-600 font-normal">(optional)</span></label>
                      <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. ChrisT" maxLength={50}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500/50 transition-all" />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="trader@example.com" required autoComplete="email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500/50 transition-all" />
                  </div>

                  {mode !== 'reset' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                          placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                          required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-green-500/50 transition-all" />
                        <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors p-1">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={loading || cooldown || failedAttempts >= 5}
                    className="w-full mt-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #2D8B4E 0%, #22C55E 50%, #4ADE50 100%)', boxShadow: '0 4px 20px rgba(45,139,78,0.4)' }}
                  >
                    {loading || cooldown ? <><Loader2 className="w-4 h-4 animate-spin" />{loading ? 'Please wait…' : 'Cooling down…'}</> :
                      mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  </button>
                </form>

                {mode === 'signin' && (
                  <p className="text-center text-gray-600 text-xs mt-5">
                    Forgot your password?{' '}
                    <button onClick={() => switchMode('reset')} className="text-green-500 hover:text-green-400 transition-colors underline-offset-2 hover:underline">
                      Reset it here
                    </button>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-gray-600 text-xs mt-6">Stay Funded. Stay Disciplined.</p>
        </div>
      </div>
    </div>
  )
}
