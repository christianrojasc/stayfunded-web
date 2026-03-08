'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { useTheme } from '@/components/ThemeContext'

interface Props {
  data: { date: string; cumPnl: number; netPnl: number }[]
}

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const daily = payload[1]?.value
  const isDark = theme === 'dark'
  
  return (
    <div style={{
      backgroundColor: isDark ? 'rgba(20,25,35,0.9)' : 'rgba(248,250,252,0.95)',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    }} className="border rounded-xl shadow-card p-3 text-xs min-w-[140px]">
      <p style={{color: isDark ? '#94A3B8' : '#475569'}} className="mb-2 font-medium">{label}</p>
      <p style={{color: val >= 0 ? '#16a34a' : '#dc2626'}} className="font-bold text-sm">
        Cum P&L: {val >= 0 ? '+' : ''}{val.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </p>
      {daily !== undefined && (
        <p style={{color: daily >= 0 ? '#16a34a' : '#dc2626'}} className="font-semibold mt-0.5">
          Day: {daily >= 0 ? '+' : ''}{daily.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </p>
      )}
    </div>
  )
}

export default function CumPnlChart({ data }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  if (!data.length) return (
    <div style={{color: 'var(--text-muted)'}} className="h-full flex items-center justify-center text-sm">No data</div>
  )

  const maxVal = Math.max(...data.map(d => d.cumPnl))
  const isPositive = data[data.length - 1]?.cumPnl >= 0

  const formatted = data.map(d => ({
    ...d,
    label: (() => { try { return format(parseISO(d.date), 'MMM d') } catch { return d.date } })(),
  }))

  const gridColor = isDark ? '#1e293b' : '#e2e8f0'
  const textColor = isDark ? '#64748b' : '#475569'
  const greenColor = isDark ? '#4ADE50' : '#16a34a'
  const redColor = isDark ? '#EF4444' : '#dc2626'

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? greenColor : redColor} stopOpacity={0.18} />
            <stop offset="100%" stopColor={isPositive ? greenColor : redColor} stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4ADE50" />
            <stop offset="100%" stopColor="#4ADE50" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: textColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: textColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${v >= 1000 || v <= -1000 ? (v/1000).toFixed(1)+'k' : v}`}
          width={60}
        />
        <Tooltip content={<CustomTooltip theme={theme} />} />
        <ReferenceLine y={0} stroke={gridColor} strokeWidth={1.5} />
        <Area
          type="monotone"
          dataKey="cumPnl"
          stroke="url(#lineGrad)"
          strokeWidth={2.5}
          fill="url(#cumGrad)"
          dot={false}
          activeDot={{ r: 5, fill: greenColor, stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
