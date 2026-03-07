'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface Props {
  data: { date: string; cumPnl: number; netPnl: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const daily = payload[1]?.value
  return (
    <div className="bg-white border border-[#E4E9F0] rounded-xl shadow-card p-3 text-xs min-w-[140px]">
      <p className="text-[#6B7E91] dark:text-[#94A3B8] mb-2 font-medium">{label}</p>
      <p className={`font-bold text-sm ${val >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
        Cum P&L: {val >= 0 ? '+' : ''}{val.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </p>
      {daily !== undefined && (
        <p className={`font-semibold mt-0.5 ${daily >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
          Day: {daily >= 0 ? '+' : ''}{daily.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </p>
      )}
    </div>
  )
}

export default function CumPnlChart({ data }: Props) {
  if (!data.length) return (
    <div className="h-full flex items-center justify-center text-[#9EB0C0] dark:text-[#64748B] text-sm">No data</div>
  )

  const maxVal = Math.max(...data.map(d => d.cumPnl))
  const isPositive = data[data.length - 1]?.cumPnl >= 0

  const formatted = data.map(d => ({
    ...d,
    label: (() => { try { return format(parseISO(d.date), 'MMM d') } catch { return d.date } })(),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? '#2D8B4E' : '#EF4444'} stopOpacity={0.18} />
            <stop offset="100%" stopColor={isPositive ? '#4ADE50' : '#EF4444'} stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2D8B4E" />
            <stop offset="100%" stopColor="#4ADE50" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F7" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#9EB0C0', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#9EB0C0', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${v >= 1000 || v <= -1000 ? (v/1000).toFixed(1)+'k' : v}`}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#E4E9F0" strokeWidth={1.5} />
        <Area
          type="monotone"
          dataKey="cumPnl"
          stroke="url(#lineGrad)"
          strokeWidth={2.5}
          fill="url(#cumGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#2D8B4E', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
