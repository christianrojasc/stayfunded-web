'use client'
import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Trade } from '@/lib/types'
import { formatPnl } from '@/lib/calculations'

interface RuleItem {
  id: string
  name: string
  type?: string
  condition?: string
}

interface Props {
  trades: Trade[]
  allTrades: Trade[]
  rules: RuleItem[]
  compliance: Record<string, boolean>
  sessionDate: string
}

interface CostLine {
  ruleName: string
  details: string[]
  cost: number
}

export default function RuleBreakCostCalculator({ trades, allTrades, rules, compliance, sessionDate }: Props) {
  const costLines = useMemo(() => {
    const brokenRules = rules.filter(r => compliance[r.id] === false)
    if (brokenRules.length === 0) return []

    const dayTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date))
    const dayPnl = dayTrades.reduce((s, t) => s + (t.pnl ?? 0), 0)

    const allWins = allTrades.filter(t => (t.pnl ?? 0) > 0)
    const avgWin = allWins.length > 0 ? allWins.reduce((s, t) => s + (t.pnl ?? 0), 0) / allWins.length : 0

    const sessionMap: Record<string, number> = {}
    for (const t of allTrades) {
      const sd = t.sessionDate || t.date?.split('T')[0]
      if (!sessionMap[sd]) sessionMap[sd] = 0
      sessionMap[sd] += t.pnl ?? 0
    }
    const sessionPnls = Object.values(sessionMap)
    const avgDayPnl = sessionPnls.length > 0 ? sessionPnls.reduce((a, b) => a + b, 0) / sessionPnls.length : 0

    const lines: CostLine[] = []

    for (const rule of brokenRules) {
      const rType = (rule as unknown as Record<string, string>).type || ''
      const rCondition = (rule as unknown as Record<string, string>).condition || ''

      if (rType === 'max_loss_trade') {
        const limit = parseFloat(rCondition) || 0
        const worstTrade = dayTrades.reduce((worst, t) => (t.pnl ?? 0) < (worst?.pnl ?? 0) ? t : worst, dayTrades[0])
        const worstPnl = worstTrade?.pnl ?? 0
        const details: string[] = []
        if (worstPnl < 0) {
          details.push(`Worst trade that day: ${formatPnl(worstPnl)}${avgWin > 0 ? `  (vs your avg win: ${formatPnl(avgWin)})` : ''}`)
          const edgeLost = avgWin > 0 ? Math.abs(worstPnl) + avgWin : Math.abs(worstPnl)
          details.push(`Estimated cost: ${formatPnl(-edgeLost)} edge lost`)
          lines.push({ ruleName: rule.name, details, cost: -edgeLost })
        } else {
          lines.push({ ruleName: rule.name, details: ['No losing trades found'], cost: 0 })
        }

      } else if (rType === 'no_revenge') {
        const revengeTrades: Trade[] = []
        for (let i = 1; i < dayTrades.length; i++) {
          const prev = dayTrades[i - 1]
          if ((prev.pnl ?? 0) < 0) {
            try {
              const prevTime = new Date(prev.exitTime ? `${sessionDate}T${prev.exitTime}` : prev.date).getTime()
              const curTime = new Date(dayTrades[i].entryTime ? `${sessionDate}T${dayTrades[i].entryTime}` : dayTrades[i].date).getTime()
              const diffMin = (curTime - prevTime) / 60000
              if (diffMin >= 0 && diffMin <= 15) {
                revengeTrades.push(dayTrades[i])
              }
            } catch {
              revengeTrades.push(dayTrades[i])
            }
          }
        }
        const details: string[] = []
        if (revengeTrades.length > 0) {
          const avgRevPnl = revengeTrades.reduce((s, t) => s + (t.pnl ?? 0), 0) / revengeTrades.length
          const totalRevPnl = revengeTrades.reduce((s, t) => s + (t.pnl ?? 0), 0)
          details.push(`Trades after a loss: ${revengeTrades.length} trades avg ${formatPnl(avgRevPnl)} each = ${formatPnl(totalRevPnl)}`)
          lines.push({ ruleName: rule.name, details, cost: totalRevPnl < 0 ? totalRevPnl : 0 })
        } else {
          details.push('No revenge trades detected')
          lines.push({ ruleName: rule.name, details, cost: 0 })
        }

      } else if (rType === 'max_loss_day') {
        const limit = parseFloat(rCondition) || 0
        if (dayPnl < 0 && limit > 0 && Math.abs(dayPnl) > limit) {
          const excess = Math.abs(dayPnl) - limit
          lines.push({
            ruleName: rule.name,
            details: [`Day loss: ${formatPnl(dayPnl)} exceeded limit by ${formatPnl(-excess)}`],
            cost: -excess,
          })
        } else {
          lines.push({ ruleName: rule.name, details: [`Day P&L: ${formatPnl(dayPnl)}`], cost: 0 })
        }

      } else {
        const opportunityCost = dayPnl - avgDayPnl
        const details: string[] = []
        details.push(`Day P&L: ${formatPnl(dayPnl)} vs avg day: ${formatPnl(avgDayPnl)}`)
        if (opportunityCost < 0) {
          details.push(`Opportunity cost: ${formatPnl(opportunityCost)}`)
        }
        lines.push({ ruleName: rule.name, details, cost: opportunityCost < 0 ? opportunityCost : 0 })
      }
    }

    return lines
  }, [trades, allTrades, rules, compliance, sessionDate])

  if (costLines.length === 0) return null

  const totalCost = costLines.reduce((s, l) => s + l.cost, 0)

  return (
    <div
      className="mt-4 rounded-2xl p-4 space-y-3"
      style={{
        background: 'rgba(255,69,58,0.06)',
        border: '1px solid rgba(255,69,58,0.15)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} className="text-[#FF453A]" />
        <span className="text-sm font-bold text-[#FF453A]">Rule Break Impact</span>
      </div>

      {costLines.map((line, i) => (
        <div key={i} className="space-y-1">
          <div className="text-sm font-medium text-white">
            {line.ruleName} — <span className="text-[#FF453A]">Broken</span>
          </div>
          {line.details.map((d, j) => (
            <div key={j} className="text-xs text-[#94A3B8] pl-3">{d}</div>
          ))}
        </div>
      ))}

      <div className="border-t border-white/[0.06] pt-2 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Total rule break cost this session:</span>
          <span className="text-sm font-bold text-[#FF453A]">{formatPnl(totalCost)}</span>
        </div>
      </div>
    </div>
  )
}
