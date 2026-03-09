'use client'
import {
  RadarChart as ReRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'

interface Props {
  data: { metric: string; value: number; fullMark: number }[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-card p-3 text-xs">
      <p className="font-semibold text-[var(--text-primary)]">{d?.metric}</p>
      <p className="text-[#2D8B4E] font-bold mt-0.5">{d?.value.toFixed(1)} / {d?.fullMark}</p>
    </div>
  )
}

export default function RadarChartComp({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReRadar data={data} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: '#6B7E91', fontSize: 11, fontWeight: 600 }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#2D8B4E"
          fill="#2D8B4E"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={{ fill: '#2D8B4E', r: 4, strokeWidth: 0 }}
        />
      </ReRadar>
    </ResponsiveContainer>
  )
}
