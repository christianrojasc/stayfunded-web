'use client'
import { useState, useEffect } from 'react'
import { getSessionInfo, isMarketOpen, SessionInfo } from '@/lib/session'

export default function SessionClock() {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [liveTime, setLiveTime] = useState('')

  useEffect(() => {
    const tick = () => {
      setSession(getSessionInfo())
      const now = new Date()
      setLiveTime(now.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
      }) + ' EST')
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!session) return null

  const isWeekend = !isMarketOpen()

  const statusColor = isWeekend ? '#6B7E91' : (() => {
    switch (session.status) {
      case 'active': return '#4ADE80'
      case 'closing_soon':
        return session.alertLevel === 'urgent' ? '#EF4444'
          : session.alertLevel === 'critical' ? '#F97316'
          : '#F59E0B'
      case 'closed': return '#6B7E91'
    }
  })()

  const statusLabel = isWeekend ? 'Weekend' : (() => {
    switch (session.status) {
      case 'active': return 'Live'
      case 'closing_soon': return 'Closing'
      case 'closed': return 'Closed'
    }
  })()

  const progressPct = Math.min(session.progress * 100, 100)

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${session.status === 'active' && !isWeekend ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: statusColor }}
        />
        <span className="font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
        <span className="text-[var(--text-muted)]">6 PM – 5 PM EST</span>
      </div>

      {!isWeekend && (
        <span className="font-mono font-bold text-base tracking-tight" style={{ color: statusColor }}>
          {session.countdown}
        </span>
      )}

      {liveTime && (
        <span className="font-mono text-[var(--text-muted)] hidden sm:inline">
          {liveTime}
        </span>
      )}

      {!isWeekend && (
        <div className="w-12 h-0.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%`, backgroundColor: statusColor }}
          />
        </div>
      )}
    </div>
  )
}
