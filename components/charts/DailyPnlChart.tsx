'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface Props {
  data: { date: string; netPnl: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-white border border-[#E4E9F0] rounded-xl shadow-card p-3 text-xs min-w-[120px]">
      <p className="text-[var(--text-muted)] dark:text-[#94A3B8] mb-1.5 font-medium">{label}</p>
      <p className={`font-bold text-sm ${val >= 0 ? 'text-[#2D8B4E]' : 'text-[#EF4444]'}`}>
        {val >= 0 ? '+' : ''}{val.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </p>
    </div>
  )
}

export default function DailyPnlChart({ data }: Props) {
  if (!data.length) return (
    <div className="h-full flex items-center justify-center text-[#9EB0C0] dark:text-[var(--text-secondary)] text-sm">No data</div>
  )

  const formatted = data.slice(-20).map(d => ({
    ...d,
    label: (() => { try { return format(parseISO(d.date), 'MMM d') } catch { return d.date } })(),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barSize={20}>
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
          tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v}`}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30,45,61,0.03)', radius: 8 }} />
        <ReferenceLine y={0} stroke="#E4E9F0" strokeWidth={1.5} />
        <Bar dataKey="netPnl" radius={[5, 5, 0, 0]}>
          {formatted.map((d, i) => (
            <Cell
              key={i}
              fill={d.netPnl >= 0 ? '#4ADE50' : '#EF4444'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
