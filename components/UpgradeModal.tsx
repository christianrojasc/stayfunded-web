'use client'
import { useState } from 'react'
import { X, Check, Zap, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

const PRICE_MONTHLY = 'price_1T8DHOCheboU7tiQPTTAPQvv'
const PRICE_YEARLY = 'price_1T8DHOCheboU7tiQR1S4s1gk'

const features = [
  'Unlimited prop firm accounts',
  'Trade screen charts & replay',
  'PDF & CSV report generation',
  'AI trade insights (coming soon)',
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
        body: JSON.stringify({ priceId, userId: user.id, email: user.email }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={{background:'#0f1117', border:'1px solid rgba(255,255,255,0.08)'}}>
        
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-green-600 via-green-400 to-emerald-300" />

        {/* Header */}
        <div className="px-7 pt-7 pb-5">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-green-400">StayFunded Pro</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-3">Upgrade your edge.</h2>
          <p className="text-gray-400 text-sm mt-1">Everything you need to stay funded, longer.</p>
        </div>

        {/* Billing toggle */}
        <div className="px-7 pb-5">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
            <button
              onClick={() => setBilling('monthly')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${billing === 'yearly' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Yearly
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">Save $69</span>
            </button>
          </div>
        </div>

        {/* Price display */}
        <div className="px-7 pb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">
              {billing === 'monthly' ? '$14' : '$99'}
            </span>
            <span className="text-gray-500 text-sm">
              {billing === 'monthly' ? '/month' : '/year'}
            </span>
            {billing === 'yearly' && (
              <span className="text-gray-600 text-sm line-through ml-1">$168</span>
            )}
          </div>
          {billing === 'yearly' && (
            <p className="text-green-400 text-xs font-medium mt-1">That's $8.25/month — billed annually</p>
          )}
        </div>

        {/* Divider */}
        <div className="mx-7 border-t border-white/[0.06] mb-5" />

        {/* Features */}
        <div className="px-7 pb-6 space-y-3">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
              </div>
              <span className="text-sm text-gray-300">{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-7 pb-7">
          <button
            onClick={() => handleCheckout(billing === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY)}
            disabled={!!loading}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 hover:opacity-95 disabled:opacity-60"
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
          <p className="text-center text-gray-600 text-xs mt-3">Cancel anytime · Secure checkout via Stripe</p>
        </div>
      </div>
    </div>
  )
}
