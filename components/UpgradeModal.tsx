'use client'
import { useState } from 'react'
import ShineBorder from '@/components/ShineBorder'
import { X, Check, Zap, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

const PRICE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!
const PRICE_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY!

const features = [
  'Unlimited prop firm accounts',
  'Trade screen charts & replay',
  'PDF & CSV report generation',
  'AI trade insights',
  '1GB storage for screenshots',
  'Priority support',
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function UpgradeModal({ open, onClose }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')

  if (!open) return null

  async function handleCheckout(priceId: string) {
    if (!user) return
    setLoading(priceId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md">
        <ShineBorder borderRadius={24} duration={6} />
        <div className="relative z-10 w-full rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95vh] sm:max-h-none overflow-y-auto" style={{background:'var(--bg-primary)', border:'1px solid var(--border)'}}>
        


        {/* Header */}
        <div className="px-7 pt-7 pb-5">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-all">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-green-400">StayFunded Pro</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-3">Upgrade your edge.</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Everything you need to stay funded, longer.</p>
        </div>

        {/* Plan boxes */}
        <div className="px-7 pb-5 grid grid-cols-2 gap-3">
          {/* Monthly */}
          <button
            onClick={() => setBilling('monthly')}
            className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 ${
              billing === 'monthly'
                ? 'border-green-500/60 bg-green-500/8 shadow-[0_0_20px_rgba(74,222,80,0.08)]'
                : 'border-[var(--border)] bg-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >
            {billing === 'monthly' && (
              <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
              </div>
            )}
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Monthly</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[var(--text-primary)]">$14</span>
              <span className="text-[var(--text-muted)] text-xs">/mo</span>
            </div>
            <span className="text-[var(--text-muted)] text-xs mt-1">Billed monthly</span>
          </button>

          {/* Yearly */}
          <button
            onClick={() => setBilling('yearly')}
            className={`relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 ${
              billing === 'yearly'
                ? 'border-green-500/60 bg-green-500/8 shadow-[0_0_20px_rgba(74,222,80,0.08)]'
                : 'border-[var(--border)] bg-[var(--border)] hover:border-[var(--border-strong)]'
            }`}
          >
            <div className="absolute -top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-black flex items-center gap-1" style={{background:"linear-gradient(135deg,#4ADE80,#22C55E)"}}>⚡ LAUNCH SPECIAL</div>
            {billing === 'yearly' && (
              <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
              </div>
            )}
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Yearly</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[var(--text-primary)]">$99</span>
              <span className="text-[var(--text-muted)] text-xs">/yr</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[var(--text-muted)] text-xs line-through">$168</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-black" style={{background:"#4ADE80"}}>-$69 OFF</span>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-7 border-t border-[var(--border)] mb-5" />

        {/* Features */}
        <div className="px-7 pb-6 space-y-3">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-7 pb-7">
          <button
            onClick={() => handleCheckout(billing === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY)}
            disabled={!!loading}
            className="w-full py-4 rounded-2xl font-bold text-[var(--text-primary)] text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:opacity-95 disabled:opacity-60"
            style={{background: 'linear-gradient(135deg, #16a34a, #4ade80)'}}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Get Pro — {billing === 'monthly' ? '$14/mo' : '$99/yr'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-center text-[var(--text-muted)] text-xs mt-3">Cancel anytime · Secure checkout via Stripe</p>
        </div>
      </div>
      </div>
    </div>
  )
}
