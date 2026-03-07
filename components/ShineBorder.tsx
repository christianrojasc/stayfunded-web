'use client'

interface ShineBorderProps {
  className?: string
  borderRadius?: number
  color?: string
  duration?: number
}

export default function ShineBorder({ className = '', borderRadius = 24, color = '#4ADE80', duration = 6 }: ShineBorderProps) {
  return (
    <>
      <style>{`
        @keyframes shine-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .shine-spin {
          animation: shine-rotate ${duration}s linear infinite;
        }
      `}</style>

      {/* Clipping container sits behind card content via z-index */}
      <div
        className={`absolute pointer-events-none ${className}`}
        style={{
          inset: '-2px',
          borderRadius: `${borderRadius + 2}px`,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        <div
          className="shine-spin"
          style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: `conic-gradient(from 0deg, transparent 0deg, ${color}99 40deg, ${color} 80deg, ${color}99 120deg, transparent 200deg)`,
          }}
        />
      </div>
    </>
  )
}
