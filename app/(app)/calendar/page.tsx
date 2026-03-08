'use client'
import { useEffect, useRef } from 'react'

export default function EconomicCalendarPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      isTransparent: true,
      width: '100%',
      height: '100%',
      locale: 'en',
      importanceFilter: '-1,0,1,2,3',
      countryFilter: 'us'
    })
    containerRef.current.appendChild(script)
  }, [])

  return (
    <div className="flex flex-col h-full p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Economic Calendar</h1>
        <p className="text-[#64748B] text-sm mt-1">High-impact US economic events affecting futures markets</p>
      </div>
      <div className="flex-1 rounded-2xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', minHeight:'600px'}}>
        <div className="tradingview-widget-container h-full" ref={containerRef} style={{height:'100%'}}>
          <div className="tradingview-widget-container__widget" style={{height:'100%'}} />
        </div>
      </div>
      <p className="text-[#334155] text-xs text-center mt-3">Powered by TradingView</p>
    </div>
  )
}
