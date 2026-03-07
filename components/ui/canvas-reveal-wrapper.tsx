'use client'
import dynamic from 'next/dynamic'

const CanvasRevealEffectDynamic = dynamic<any>( // eslint-disable-line @typescript-eslint/no-explicit-any
  () => import('./canvas-reveal-effect').then(m => m.CanvasRevealEffect).catch(() => () => null),
  { ssr: false, loading: () => null }
)

export function CanvasRevealEffect(props: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) {
  return <CanvasRevealEffectDynamic {...props} />
}
