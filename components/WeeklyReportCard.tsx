'use client'
import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, TrendingDown, Award, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { useTrades } from '@/components/TradeContext'
import { calcDailyGrade, formatPnl } from '@/lib/calculations'
import Link from 'next/link'

interface RuleItem {
  id: string
  name: string
  type?: string
  condition?: string
}

interface DayData {
  date: string
  dayName: string
  grade: ReturnType<typeof calcDailyGrade>
  hasRulesData: boolean
  pnl: number
  brokenRules: string[]
  totalRules: number
  followedRules: number
}

function getWeekDates(): string[] {
  const now = new Date()
  const day = now.getDay()
  // Get Monday of current week
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1))

  const dates: string[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return dates
}

function getLastWeekDates(): string[] {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1) - 7)

  const dates: string[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return dates
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function WeeklyReportCard() {
  const { trades } = useTrades()
  const [expanded, setExpanded] = useState(false)
  const [rules, setRules] = useState<RuleItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sf_rules')
      if (raw) setRules(JSON.parse(raw))
    } catch { /* empty */ }
  }, [])

  const { weekDays, isWeekend, weekLabel, hasData, overallGrade, mostBroken, totalCost, bestDay, worstDay } = useMemo(() => {
    const now = new Date()
    const isWeekend = now.getDay() === 0 || now.getDay() === 6

    // Use last week if weekend, otherwise current week
    const dates = isWeekend ? getLastWeekDates() : getLastWeekDates()
    const weekStart = new Date(dates[0])
    const weekEnd = new Date(dates[dates.length - 1])

    const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${weekEnd.getFullYear()}`

    const tradesByDate: Record<string, number> = {}
    for (const t of trades) {
      const sd = t.sessionDate || t.date?.split('T')[0]
      if (!tradesByDate[sd]) tradesByDate[sd] = 0
      tradesByDate[sd] += t.pnl ?? 0
    }

    const brokenCount: Record<string, number> = {}
    const weekDays: DayData[] = []
    let hasData = false

    dates.forEach((date, i) => {
      const rulesKey = `sf_journal_rules_${date}`
      let compliance: Record<string, boolean> = {}
      try {
        const raw = localStorage.getItem(rulesKey)
        if (raw) compliance = JSON.parse(raw)
      } catch { /* empty */ }

      const hasRulesData = Object.keys(compliance).length > 0
      if (hasRulesData) hasData = true

      const followed = rules.filter(r => compliance[r.id] === true).length
      const total = rules.length
      const compliancePct = total > 0 ? (followed / total) * 100 : 100

      const broken = rules.filter(r => compliance[r.id] === false)
      broken.forEach(r => {
        brokenCount[r.name] = (brokenCount[r.name] || 0) + 1
      })

      weekDays.push({
        date,
        dayName: DAY_NAMES[i],
        grade: hasRulesData ? calcDailyGrade(compliancePct) : calcDailyGrade(0),
        hasRulesData,
        pnl: tradesByDate[date] || 0,
        brokenRules: broken.map(r => r.name),
        totalRules: total,
        followedRules: followed,
      })
    })

    // Overall grade
    const daysWithData = weekDays.filter(d => d.hasRulesData)
    const avgCompliance = daysWithData.length > 0
      ? daysWithData.reduce((s, d) => s + (d.followedRules / Math.max(d.totalRules, 1)) * 100, 0) / daysWithData.length
      : 0
    const overallGrade = daysWithData.length > 0 ? calcDailyGrade(avgCompliance) : calcDailyGrade(0)

    // Most broken rule
    let mostBroken = ''
    let mostBrokenCount = 0
    for (const [name, count] of Object.entries(brokenCount)) {
      if (count > mostBrokenCount) {
        mostBroken = name
        mostBrokenCount = count
      }
    }
    const mostBrokenStr = mostBroken ? `"${mostBroken}" — ${mostBrokenCount} session${mostBrokenCount > 1 ? 's' : ''}` : 'None'

    // Estimate cost (sum negative pnl on days with broken rules)
    const totalCost = weekDays
      .filter(d => d.brokenRules.length > 0 && d.pnl < 0)
      .reduce((s, d) => s + d.pnl, 0)

    // Best/worst day
    const sortedByPnl = [...daysWithData].sort((a, b) => b.pnl - a.pnl)
    const bestDay = sortedByPnl[0]
    const worstDay = sortedByPnl[sortedByPnl.length - 1]

    return { weekDays, isWeekend, weekLabel, hasData, overallGrade, mostBroken: mostBrokenStr, totalCost, bestDay, worstDay }
  }, [trades, rules])

  if (!hasData && !expanded) {
    return null
  }

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center">
            <Award size={18} className="text-[#4ADE80]" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Weekly Report Card</h3>
            <p className="text-xs text-[var(--text-secondary)]">Week of {weekLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold" style={{ color: overallGrade.color }}>
            {overallGrade.grade}
          </span>
          {expanded ? <ChevronUp size={16} className="text-[var(--text-secondary)]" /> : <ChevronDown size={16} className="text-[var(--text-secondary)]" />}
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 pt-2">
          {/* Daily grades row */}
          <div className="flex items-center justify-between gap-2">
            {weekDays.map(d => (
              <div key={d.date} className="flex-1 text-center py-2 rounded-xl" style={{ background: 'var(--border)' }}>
                <div className="text-xs text-[var(--text-secondary)] mb-1">{d.dayName}</div>
                <div className="text-sm font-bold" style={{ color: d.grade.color }}>
                  {d.hasRulesData ? d.grade.grade : '-'}
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Calendar size={14} className="text-[var(--text-secondary)] flex-shrink-0" />
              <span>Most broken rule: {mostBroken}</span>
            </div>
            {totalCost < 0 && (
              <div className="flex items-center gap-2 text-[#FF453A]">
                <TrendingDown size={14} className="flex-shrink-0" />
                <span>Estimated cost of rule breaks: {formatPnl(totalCost)}</span>
              </div>
            )}
            {bestDay && bestDay.hasRulesData && (
              <div className="flex items-center gap-2 text-[#4ADE80]">
                <TrendingUp size={14} className="flex-shrink-0" />
                <span>Best day: {bestDay.dayName} ({bestDay.grade.grade} — {bestDay.brokenRules.length === 0 ? 'all rules followed' : `${bestDay.followedRules}/${bestDay.totalRules} rules`}, {formatPnl(bestDay.pnl)})</span>
              </div>
            )}
            {worstDay && worstDay.hasRulesData && worstDay !== bestDay && (
              <div className="flex items-center gap-2 text-[#FB923C]">
                <TrendingDown size={14} className="flex-shrink-0" />
                <span>Worst day: {worstDay.dayName} ({worstDay.grade.grade} — {worstDay.brokenRules.length} rule{worstDay.brokenRules.length !== 1 ? 's' : ''} broken, {formatPnl(worstDay.pnl)})</span>
              </div>
            )}
          </div>

          <Link
            href="/journal"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4ADE80] hover:text-[#4ADE50] transition-colors"
          >
            View Full Journal →
          </Link>
        </div>
      )}
    </div>
  )
}
