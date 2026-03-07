'use client'
import type { ReactNode } from 'react'

interface ShineBorderProps {
  color?: string[]
  duration?: number
  borderWidth?: number
  className?: string
  children: ReactNode
  borderRadius?: number
}

export default function ShineBorder({ className = '', children, borderRadius = 24, color, duration = 3, borderWidth = 2 }: ShineBorderProps) {
  return (
    <div className={`relative ${className}`} style={{ borderRadius: `${borderRadius}px` }}>
      <style>{`
        @keyframes rotateBorder {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .shine-border-spin {
          animation: rotateBorder 6s linear infinite;
        }
      `}</style>

      {/* Outer container clips the rotating glow */}
      <div style={{
        position: 'absolute',
        inset: '-3px',
        borderRadius: `${borderRadius + 3}px`,
        overflow: 'hidden',
        zIndex: 0,
      }}>
        {/* The rotating conic gradient */}
        <div
          className="shine-border-spin"
          style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: 'conic-gradient(from 0deg, transparent 0deg, #4ADE80 60deg, #86EFAC 90deg, #4ADE80 120deg, transparent 180deg)',
            zIndex: 0,
          }}
        />
      </div>

      {/* Dark inner fill */}
      <div style={{
        position: 'absolute',
        inset: '3px',
        borderRadius: `${borderRadius - 1}px`,
        background: '#0f1117',
        zIndex: 1,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
