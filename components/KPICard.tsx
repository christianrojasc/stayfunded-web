'use client'
import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  valueNode?: React.ReactNode
  subValue?: string
  trend?: number
  trendLabel?: string
  icon?: ReactNode
  variant?: 'default' | 'green' | 'red' | 'neutral'
  large?: boolean
  suffix?: string
}

export default function KPICard({
  title, value, subValue, trend, trendLabel, icon, variant = 'default', large, suffix, valueNode
}: KPICardProps) {
  const isGreen = variant === 'green' || (variant === 'default' && trend && trend > 0)
  const isRed = variant === 'red' || (variant === 'default' && trend && trend < 0)

  return (
    <div className="glass-card-hover p-5 flex flex-col gap-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: isGreen ? 'rgba(74,222,128,0.1)' : isRed ? 'rgba(255,69,58,0.1)' : 'rgba(255,255,255,0.06)',
              color: isGreen ? '#4ADE80' : isRed ? '#FF453A' : 'rgba(255,255,255,0.4)',
            }}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <div className={`font-bold tracking-tight leading-none ${large ? 'text-3xl' : 'text-2xl'}`}
          style={{ color: isGreen ? '#4ADE80' : isRed ? '#FF453A' : 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em' }}>
          {valueNode ?? value}
          {suffix && <span className="text-base font-semibold ml-1" style={{ opacity: 0.6 }}>{suffix}</span>}
        </div>
        {subValue && (
          <div className="text-xs mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
            {subValue}
          </div>
        )}
      </div>

      {/* Trend */}
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-1.5">
          {trend !== undefined ? (
            <>
              <div className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: trend > 0 ? 'rgba(74,222,128,0.1)' : trend < 0 ? 'rgba(255,69,58,0.1)' : 'rgba(255,255,255,0.06)',
                  color: trend > 0 ? '#4ADE80' : trend < 0 ? '#FF453A' : 'rgba(255,255,255,0.4)',
                }}>
                {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
              {trendLabel && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{trendLabel}</span>}
            </>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
