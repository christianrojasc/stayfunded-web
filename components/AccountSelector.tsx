'use client'
import { formatAccountNumber } from '@/lib/utils'
import { useRef, useState, useEffect } from 'react'
import { Briefcase, ChevronDown, Check, LayoutGrid } from 'lucide-react'
import { useAccountFilter } from './AccountFilterContext'

export default function AccountSelector() {
  const { accounts, selectedId, setSelectedId } = useAccountFilter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (accounts.length === 0) return null

  const selected = accounts.find(a => a.id === selectedId)
  const label = selected ? (formatAccountNumber(selected.accountNumber) || selected.nickname || selected.firmName) : 'All Accounts'

  const statusColor = (status: string) =>
    status === 'funded' ? 'text-[#4ADE50] bg-[#2D8B4E]/10' : 'text-amber-500 bg-amber-500/10'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E4E9F0] dark:border-[#21262d] bg-white dark:bg-[#161b22] text-sm font-medium text-[#1E2D3D] dark:text-[#c9d1d9] hover:border-[#2D8B4E]/50 transition-all"
      >
        {selected ? (
          <Briefcase size={14} className="text-[#2D8B4E] flex-shrink-0" />
        ) : (
          <LayoutGrid size={14} className="text-[#6B7E91] flex-shrink-0" />
        )}
        <span className="max-w-[80px] sm:max-w-[140px] truncate">{label}</span>
        {selected && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor(selected.status)}`}>
            {selected.status === 'funded' ? 'Funded' : 'Eval'}
          </span>
        )}
        <ChevronDown size={13} className={`text-[#6B7E91] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 w-64 bg-white dark:bg-[#161b22] border border-[#E4E9F0] dark:border-[#21262d] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* All Accounts */}
          <button
            onClick={() => { setSelectedId(null); setOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F5F7FA] dark:hover:bg-[#1c2129] transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#F5F7FA] dark:bg-[#1c2129] flex items-center justify-center">
              <LayoutGrid size={14} className="text-[#6B7E91]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1E2D3D] dark:text-[#e6edf3]">All Accounts</p>
              <p className="text-[11px] text-[#6B7E91] dark:text-[#8b949e]">Aggregate view</p>
            </div>
            {!selectedId && <Check size={14} className="text-[#2D8B4E] flex-shrink-0" />}
          </button>

          {accounts.length > 0 && (
            <div className="border-t border-[#E4E9F0] dark:border-[#21262d]">
              {accounts.map(acct => (
                <button
                  key={acct.id}
                  onClick={() => { setSelectedId(acct.id); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F5F7FA] dark:hover:bg-[#1c2129] transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2D8B4E22 0%, #4ADE5022 100%)' }}>
                    <Briefcase size={13} className="text-[#2D8B4E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E2D3D] dark:text-[#e6edf3] truncate">
                      {formatAccountNumber(acct.accountNumber) || acct.nickname || acct.firmName}
                    </p>
                    <p className="text-[11px] text-[#6B7E91] dark:text-[#8b949e] truncate">
                      {acct.firmName} · ${(acct.startingBalance / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusColor(acct.status)}`}>
                    {acct.status === 'funded' ? 'Funded' : 'Eval'}
                  </span>
                  {selectedId === acct.id && <Check size={14} className="text-[#2D8B4E] flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
