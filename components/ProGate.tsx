'use client'
import { useState } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import UpgradeModal from '@/components/UpgradeModal'
import { ProFeature, PRO_FEATURE_LABELS } from '@/lib/plan-limits'

interface Props {
  feature: ProFeature
  children: React.ReactNode
  /** 'blur' shows blurred preview, 'block' shows full lock screen */
  mode?: 'blur' | 'block'
  /** Custom label override */
  label?: string
}

/**
 * Wraps a section/page. Free users see a blurred preview + upgrade CTA.
 * Pro users see children normally.
 */
export default function ProGate({ feature, children, mode = 'blur', label }: Props) {
  const { isPro, loading } = useSubscription()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#4ADE50] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isPro) return <>{children}</>

  const featureLabel = label || PRO_FEATURE_LABELS[feature]

  if (mode === 'block') {
    return (
      <>
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-[#4ADE80]" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              {featureLabel}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              This feature is available on the Pro plan. Upgrade to unlock {featureLabel} and more.
            </p>
          </div>
          <button
            onClick={() => setUpgradeOpen(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro
          </button>
        </div>
      </>
    )
  }

  // blur mode — show blurred preview with overlay
  return (
    <>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <div className="relative">
        {/* Blurred content */}
        <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)', opacity: 0.5 }}>
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[var(--bg-primary)]/60 backdrop-blur-sm rounded-2xl">
          <div className="flex flex-col items-center gap-4 p-8 mt-8">
            <div className="w-12 h-12 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#4ADE80]" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                {featureLabel}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                Upgrade to Pro to unlock this feature.
              </p>
            </div>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
