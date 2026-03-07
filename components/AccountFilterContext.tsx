'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { PropAccount } from '@/lib/types'
import * as dl from '@/lib/data-layer'

interface AccountFilterCtx {
  accounts: PropAccount[]
  selectedId: string | null   // null = All Accounts
  selected: PropAccount | null
  setSelectedId: (id: string | null) => void
  refresh: () => void
}

const Ctx = createContext<AccountFilterCtx>({
  accounts: [],
  selectedId: null,
  selected: null,
  setSelectedId: () => {},
  refresh: () => {},
})

export function AccountFilterProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<PropAccount[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Issue 7 fix: use a ref to track the latest selectedId so the refresh
  // callback doesn't capture a stale closure value. The ref is always current
  // regardless of when refresh() is called.
  const selectedIdRef = useRef<string | null>(selectedId)
  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  // refresh has no deps — it reads selectedId via the ref, not the closure.
  // This makes it safe to call at any time without stale-closure issues.
  const refresh = useCallback(async () => {
    const accts = await dl.getPropAccounts()
    setAccounts(accts)
    // If the currently selected account was deleted, reset to "All"
    if (selectedIdRef.current && !accts.find(a => a.id === selectedIdRef.current)) {
      setSelectedId(null)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const selected = accounts.find(a => a.id === selectedId) ?? null

  return (
    <Ctx.Provider value={{ accounts, selectedId, selected, setSelectedId, refresh }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAccountFilter() {
  return useContext(Ctx)
}
