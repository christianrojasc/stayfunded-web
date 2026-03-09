'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface Props {
  data: { date: string; drawdown: number; peak: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-white border border-[#E4E9F0] rounded-xl shadow-card p-3 text-xs min-w-[130px]">
      <p className="text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5 font-medium">{label}</p>
      <p className="font-bold text-sm text-[#EF4444]">{val.toFixed(2)}%</p>
    </div>
  )
}

export default function DrawdownChart({ data }: Props) {
  if (!data.length) return (
    <div className="h-full flex items-center justify-center text-[#9EB0C0] dark:text-[var(--text-secondary)] text-sm">No data</div>
  )

  const formatted = data.map(d => ({
    ...d,
    label: (() => { try { return format(parseISO(d.date), 'MMM d') } catch { return d.date } })(),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
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
          tickFormatter={v => `${v.toFixed(1)}%`}
          width={50}
          domain={['dataMin', 0]}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#E4E9F0" strokeWidth={1.5} />
        <Area
          type="monotone"
          dataKey="drawdown"
          stroke="#EF4444"
          strokeWidth={2}
          fill="url(#ddGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#EF4444', stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
