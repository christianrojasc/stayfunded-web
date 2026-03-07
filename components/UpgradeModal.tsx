'use client'
import { useState } from 'react'
import { X, Infinity, BarChart3, FileText, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

const PRICE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'price_1T8DHOCheboU7tiQPTTAPQvv'
const PRICE_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || 'price_1T8DHOCheboU7tiQR1S4s1gk'

const features = [
  { icon: Infinity, label: 'Unlimited accounts' },
  { icon: BarChart3, label: 'Trade screen charts' },
  { icon: FileText, label: 'Report generation' },
  { icon: Sparkles, label: 'AI trade insights' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function UpgradeModal({ open, onClose }: Props) {
  const { user } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  if (!open) return null

  async function handleCheckout(priceId: string) {
    if (!user) return
    setLoadingPlan(priceId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1a]/90 backdrop-blur-xl p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
        <p className="text-gray-400 text-sm mb-6">Unlock the full power of StayFunded.</p>

        <div className="space-y-3 mb-8">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Icon size={16} className="text-green-400" />
              </div>
              <span className="text-sm text-gray-200">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleCheckout(PRICE_MONTHLY)}
            disabled={!!loadingPlan}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loadingPlan === PRICE_MONTHLY ? 'Redirecting...' : 'Monthly — $14/mo'}
          </button>
          <button
            onClick={() => handleCheckout(PRICE_YEARLY)}
            disabled={!!loadingPlan}
            className="w-full py-3.5 rounded-xl border border-green-500/30 text-green-400 font-semibold text-sm hover:bg-green-500/10 transition-colors disabled:opacity-60"
          >
            {loadingPlan === PRICE_YEARLY ? 'Redirecting...' : 'Yearly — $99/yr (save $69)'}
          </button>
        </div>
      </div>
    </div>
  )
}
