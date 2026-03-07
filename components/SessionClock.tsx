'use client'
import { useState, useEffect } from 'react'
import { getSessionInfo, SessionInfo } from '@/lib/session'

export default function SessionClock() {
  const [session, setSession] = useState<SessionInfo | null>(null)

  useEffect(() => {
    setSession(getSessionInfo())
    const interval = setInterval(() => setSession(getSessionInfo()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!session) {
    return (
      <div className="flex items-center gap-2 text-[#6B7E91] dark:text-[#8b949e] text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6B7E91]" />
        <span>6 PM – 5 PM EST</span>
      </div>
    )
  }

  const statusColor = (() => {
    switch (session.status) {
      case 'active': return '#4ADE50'
      case 'closing_soon':
        return session.alertLevel === 'urgent' ? '#EF4444'
          : session.alertLevel === 'critical' ? '#F97316'
          : '#F59E0B'
      case 'closed': return '#6B7E91'
    }
  })()

  const statusLabel = (() => {
    switch (session.status) {
      case 'active': return 'Live'
      case 'closing_soon': return 'Closing'
      case 'closed': return 'Closed'
    }
  })()

  const progressPct = Math.min(session.progress * 100, 100)

  return (
    <div className="flex items-center gap-3 text-xs">
      {/* Status dot + label */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${session.status === 'active' ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: statusColor }}
        />
        <span className="font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
        <span className="text-[#6B7E91] dark:text-[#8b949e]">6 PM – 5 PM EST</span>
      </div>

      {/* Countdown */}
      <span className="font-mono font-semibold" style={{ color: statusColor }}>
        {session.countdown}
      </span>

      {/* Progress bar */}
      <div className="w-12 h-0.5 rounded-full bg-[#E4E9F0] dark:bg-[#21262d] overflow-hidden hidden sm:block">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progressPct}%`, backgroundColor: statusColor }}
        />
      </div>
    </div>
  )
}
