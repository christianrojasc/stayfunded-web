'use client'
import { useState, useEffect } from 'react'
import { AlertTriangle, OctagonX, X } from 'lucide-react'
import { getSessionInfo, AlertLevel } from '@/lib/session'

interface SessionAlertProps {
  /** Number of open positions — only show alert if > 0 */
  openPositionCount?: number
}

export default function SessionAlert({ openPositionCount = 0 }: SessionAlertProps) {
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('none')
  const [countdown, setCountdown] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const update = () => {
      const s = getSessionInfo()
      setAlertLevel(s.alertLevel)
      setCountdown(s.countdown)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  // Reset dismiss when alert level changes (e.g. warning → critical)
  useEffect(() => {
    setDismissed(false)
  }, [alertLevel])

  if (alertLevel === 'none' || dismissed) return null
  // Show regardless of open positions (prop firm daily loss resets at session close)

  const isUrgent = alertLevel === 'urgent' || alertLevel === 'critical'
  const Icon = isUrgent ? OctagonX : AlertTriangle

  const styles = {
    urgent: {
      bg: 'bg-red-50/10',
      border: 'border-red-200/30',
      text: 'text-[#EF4444]',
      sub: 'text-red-700',
    },
    critical: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-600',
      sub: 'text-orange-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-600',
      sub: 'text-amber-700',
    },
    none: { bg: '', border: '', text: '', sub: '' },
  }[alertLevel]

  const message = isUrgent
    ? 'Session closing — ensure positions closed'
    : 'Session closing soon — check open positions'

  const detail = openPositionCount > 0
    ? `${openPositionCount} open position${openPositionCount > 1 ? 's' : ''} · ${countdown} remaining`
    : `${countdown} remaining in trading session`

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles.bg} ${styles.border} mb-4 animate-slide-down`}>
      <Icon size={18} className={`flex-shrink-0 ${styles.text}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${styles.text}`}>{message}</p>
        <p className={`text-xs mt-0.5 ${styles.sub} opacity-80`}>{detail}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${styles.text}`}
      >
        <X size={14} />
      </button>
    </div>
  )
}
