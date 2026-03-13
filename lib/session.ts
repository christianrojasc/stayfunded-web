/**
 * StayFunded — Prop Firm Session Management
 * Ported from PropPilot mobile app.
 *
 * Trading sessions run 6:00 PM EST → 5:00 PM EST (23 hours).
 * Uses America/New_York timezone via Intl.DateTimeFormat — handles EST/EDT automatically.
 * "Today's" trades = trades within the current session window, NOT calendar day.
 * This is critical for prop firm compliance — daily loss limits reset at session start.
 */

const SESSION_START_HOUR = 18  // 6:00 PM EST/EDT
const SESSION_END_HOUR = 17    // 5:00 PM EST/EDT

const POSITION_WARN_MINUTES = 30
const POSITION_CRITICAL_MINUTES = 15
const POSITION_URGENT_MINUTES = 5

export type SessionStatus = 'active' | 'closed' | 'closing_soon'
export type AlertLevel = 'none' | 'warning' | 'critical' | 'urgent'

export interface SessionInfo {
  status: SessionStatus
  sessionStart: Date
  sessionEnd: Date
  remainingMs: number
  countdown: string
  alertLevel: AlertLevel
  progress: number
  sessionDate: string
}

/**
 * Get EST/EDT components from a UTC Date using Intl (reliable cross-platform).
 */
function getESTComponents(date: Date = new Date()): {
  year: number; month: number; day: number; hours: number; minutes: number
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date)

  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10)
  return {
    year: get('year'),
    month: get('month') - 1, // 0-indexed for Date.UTC
    day: get('day'),
    hours: get('hour') === 24 ? 0 : get('hour'), // midnight edge case
    minutes: get('minute'),
  }
}

/**
 * Build a UTC Date that corresponds to a specific EST/EDT wall-clock time.
 * Binary-search approach: create a UTC guess, check its EST rendering, adjust.
 * Handles DST transitions automatically.
 */
function estWallClockToUTC(year: number, month: number, day: number, hour: number): Date {
  // Initial guess: assume UTC-5 (EST)
  let guess = Date.UTC(year, month, day, hour + 5, 0, 0)
  // Check what EST hour that guess maps to and correct
  const estOfGuess = getESTComponents(new Date(guess))
  const diff = estOfGuess.hours - hour
  guess -= diff * 60 * 60 * 1000
  return new Date(guess)
}

/**
 * Get the session boundaries for a given point in time.
 * A session starts at 6 PM EST on day N and ends at 5 PM EST on day N+1.
 */
export function getSessionBounds(now: Date = new Date()): {
  start: Date; end: Date; sessionDate: string
} {
  const est = getESTComponents(now)
  const estHour = est.hours

  let startYear = est.year, startMonth = est.month, startDay = est.day
  let endYear = est.year, endMonth = est.month, endDay = est.day

  if (estHour >= SESSION_START_HOUR) {
    // After 6 PM: session started today, ends tomorrow
    const nextDay = new Date(Date.UTC(est.year, est.month, est.day + 1))
    endYear = nextDay.getUTCFullYear(); endMonth = nextDay.getUTCMonth(); endDay = nextDay.getUTCDate()
  } else if (estHour < SESSION_END_HOUR) {
    // Before 5 PM: session started yesterday
    const prevDay = new Date(Date.UTC(est.year, est.month, est.day - 1))
    startYear = prevDay.getUTCFullYear(); startMonth = prevDay.getUTCMonth(); startDay = prevDay.getUTCDate()
  } else {
    // Between 5 PM and 6 PM: closed window, next session starts today at 6 PM
    const nextDay = new Date(Date.UTC(est.year, est.month, est.day + 1))
    endYear = nextDay.getUTCFullYear(); endMonth = nextDay.getUTCMonth(); endDay = nextDay.getUTCDate()
  }

  const start = estWallClockToUTC(startYear, startMonth, startDay, SESSION_START_HOUR)
  const end = estWallClockToUTC(endYear, endMonth, endDay, SESSION_END_HOUR)
  // Session date = the date the session ENDS (at 5PM), matching CSV parser convention
  const sessionDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`

  return { start, end, sessionDate }
}

/**
 * Get full session info for the current moment.
 */
export function isMarketOpen(now: Date = new Date()): boolean {
  const est = getESTComponents(now)
  // CME futures closed Friday 5 PM → Sunday 6 PM EST
  // dayOfWeek: 0=Sun, 1=Mon ... 6=Sat
  const utcDay = now.getUTCDay()
  const nyParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short', hour: '2-digit', hour12: false,
  }).formatToParts(now)
  const dayName = nyParts.find(p => p.type === 'weekday')?.value ?? ''
  const hour = est.hours === 24 ? 0 : est.hours
  // Saturday: fully closed
  if (dayName === 'Sat') return false
  // Friday: closed after 5 PM
  if (dayName === 'Fri' && hour >= 17) return false
  // Sunday: closed before 6 PM
  if (dayName === 'Sun' && hour < 18) return false
  return true
}

export function getSessionInfo(now: Date = new Date()): SessionInfo {
  const est = getESTComponents(now)
  const estHour = est.hours

  // Closed window: 5 PM–6 PM EST
  const isClosed = estHour >= SESSION_END_HOUR && estHour < SESSION_START_HOUR

  const bounds = getSessionBounds(now)

  if (isClosed) {
    const nextStart = bounds.start
    const msUntilOpen = Math.max(0, nextStart.getTime() - now.getTime())
    return {
      status: 'closed',
      sessionStart: bounds.start,
      sessionEnd: bounds.end,
      remainingMs: 0,
      countdown: `Opens in ${formatDuration(msUntilOpen)}`,
      alertLevel: 'none',
      progress: 1,
      sessionDate: bounds.sessionDate,
    }
  }

  const remainingMs = Math.max(0, bounds.end.getTime() - now.getTime())
  const elapsedMs = now.getTime() - bounds.start.getTime()
  const totalMs = bounds.end.getTime() - bounds.start.getTime()
  const progress = Math.min(1, Math.max(0, elapsedMs / totalMs))

  const remainingMinutes = remainingMs / (60 * 1000)
  let alertLevel: AlertLevel = 'none'
  let status: SessionStatus = 'active'

  if (remainingMinutes <= POSITION_URGENT_MINUTES) {
    alertLevel = 'urgent'; status = 'closing_soon'
  } else if (remainingMinutes <= POSITION_CRITICAL_MINUTES) {
    alertLevel = 'critical'; status = 'closing_soon'
  } else if (remainingMinutes <= POSITION_WARN_MINUTES) {
    alertLevel = 'warning'; status = 'closing_soon'
  }

  return {
    status,
    sessionStart: bounds.start,
    sessionEnd: bounds.end,
    remainingMs,
    countdown: formatDuration(remainingMs),
    alertLevel,
    progress,
    sessionDate: bounds.sessionDate,
  }
}

/**
 * Format milliseconds into human-readable duration.
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '0m'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

/**
 * Get the session date for a given trade time.
 * Trades between 6 PM–midnight belong to that day's session.
 * Trades between midnight–5 PM belong to the previous day's session.
 */
export function getSessionDateForTrade(tradeTime: string | Date): string {
  const date = typeof tradeTime === 'string' ? new Date(tradeTime) : tradeTime
  const bounds = getSessionBounds(date)
  return bounds.sessionDate
}

/**
 * Check if a trade falls within a specific session window.
 */
export function isTradeInSession(
  tradeTime: string | Date,
  sessionStart: Date,
  sessionEnd: Date
): boolean {
  const date = typeof tradeTime === 'string' ? new Date(tradeTime) : tradeTime
  return date >= sessionStart && date <= sessionEnd
}

/**
 * Check if a trade violates session rules.
 */
export function validateTradeSession(entryTime: string, exitTime: string): {
  valid: boolean
  violations: string[]
} {
  const violations: string[] = []
  const entry = new Date(entryTime)
  const exit = new Date(exitTime)

  const entryEST = getESTComponents(entry)
  const exitEST = getESTComponents(exit)

  // Entered during closed period (5 PM–6 PM)
  if (entryEST.hours >= SESSION_END_HOUR && entryEST.hours < SESSION_START_HOUR) {
    violations.push('Trade entered during closed session (5:00 PM – 6:00 PM EST)')
  }
  // Exited during closed period
  if (exitEST.hours >= SESSION_END_HOUR && exitEST.hours < SESSION_START_HOUR) {
    violations.push('Trade exited during closed session (5:00 PM – 6:00 PM EST)')
  }
  // Held past session close (overnight)
  const entryBounds = getSessionBounds(entry)
  if (exit > entryBounds.end) {
    violations.push('Trade held past session close (5:00 PM EST) — overnight position')
  }

  return { valid: violations.length === 0, violations }
}

/**
 * Group trades by session date (not calendar date).
 */
export function groupTradesBySession<T extends { date: string }>(
  trades: T[]
): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  trades.forEach(trade => {
    const sd = trade.date
    if (!groups[sd]) groups[sd] = []
    groups[sd].push(trade)
  })
  return groups
}

/**
 * Get today's session date label (the session that's currently active or just closed).
 */
export function getTodaySessionDate(): string {
  return getSessionBounds(new Date()).sessionDate
}
