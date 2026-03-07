'use client'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ShineBorderProps {
  borderRadius?: number
  borderWidth?: number
  duration?: number
  color?: string | string[]
  className?: string
  children: ReactNode
}

export default function ShineBorder({
  borderRadius = 24,
  borderWidth = 2,
  duration = 8,
  color = ['#4ADE80', '#22C55E', '#86EFAC'],
  className,
  children,
}: ShineBorderProps) {
  return (
    <div
      style={{ '--border-radius': `${borderRadius}px` } as React.CSSProperties}
      className={cn('relative', className)}
    >
      <div
        style={{
          '--border-width': `${borderWidth}px`,
          '--border-radius': `${borderRadius}px`,
          '--shine-pulse-duration': `${duration}s`,
          '--mask-linear-gradient': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          '--background-radial-gradient': `radial-gradient(transparent,transparent, ${Array.isArray(color) ? color.join(',') : color},transparent,transparent)`,
        } as React.CSSProperties}
        className="before:bg-shine-size before:absolute before:inset-0 before:aspect-square before:size-full before:rounded-[--border-radius] before:p-[--border-width] before:will-change-[background-position] before:content-[''] before:![-webkit-mask-composite:xor] before:[background-image:--background-radial-gradient] before:[background-size:300%_300%] before:![mask-composite:exclude] before:[mask:--mask-linear-gradient] motion-safe:before:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear] pointer-events-none absolute inset-0"
      />
      {children}
    </div>
  )
}
