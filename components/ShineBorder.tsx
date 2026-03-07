'use client'
import type { ReactNode } from 'react'

interface ShineBorderProps {
  color?: string | string[]
  duration?: number
  borderWidth?: number
  borderRadius?: number
  className?: string
  children: ReactNode
}

export default function ShineBorder({
  color = ['#4ADE80', '#22C55E', '#86EFAC'],
  duration = 6,
  borderWidth = 2,
  borderRadius = 24,
  className = '',
  children,
}: ShineBorderProps) {
  const gradientColor = Array.isArray(color) ? color.join(',') : color

  return (
    <div className={`relative ${className}`} style={{ borderRadius: `${borderRadius}px` }}>
      <style>{`
        @keyframes shineSpin {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {/* Animated glow border */}
      <div style={{
        position: 'absolute',
        inset: `-${borderWidth}px`,
        borderRadius: `${borderRadius + borderWidth}px`,
        background: `linear-gradient(var(--shine-angle, 0deg), ${gradientColor}, transparent, ${gradientColor})`,
        backgroundSize: '300% 300%',
        animation: `shineSpin ${duration}s linear infinite`,
        zIndex: 0,
      }} />
      {/* Dark fill behind content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: `${borderRadius}px`,
        background: '#0f1117',
        zIndex: 1,
      }} />
      {/* Content on top */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
