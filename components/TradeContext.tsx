'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Trade } from '@/lib/types'
import * as dl from '@/lib/data-layer'
import { v4 as uuidv4 } from 'uuid'

function validateTrade(data: Partial<Trade>): string | null {
  if (data.contracts !== undefined) {
    if (!Number.isInteger(data.contracts) || data.contracts < 1 || data.contracts > 9_999) {
      return 'Contracts must be a whole number between 1 and 9,999.'
    }
  }
  if (data.entryPrice !== undefined && (data.entryPrice <= 0 || data.entryPrice > 1_000_000)) {
    return 'Entry price must be between 0 and 1,000,000.'
  }
  if (data.exitPrice !== undefined && (data.exitPrice <= 0 || data.exitPrice > 1_000_000)) {
    return 'Exit price must be between 0 and 1,000,000.'
  }
  if (data.pnl !== undefined && Math.abs(data.pnl) > 10_000_000) {
    return 'P&L value exceeds the maximum allowed (±$10,000,000). Please verify your trade data.'
  }
  if (data.netPnl !== undefined && Math.abs(data.netPnl) > 10_000_000) {
    return 'Net P&L value exceeds the maximum allowed. Please verify your trade data.'
  }
  return null
}

interface TradeCtx {
  trades: Trade[]
  loaded: boolean
  addTrade: (data: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Trade>
  updateTrade: (id: string, data: Partial<Trade>) => Promise<void>
  removeTrade: (id: string) => Promise<void>
  importBatch: (incoming: Trade[]) => Promise<void>
  refresh: () => void
}

const Ctx = createContext<TradeCtx>({
  trades: [],
  loaded: false,
  addTrade: async () => { throw new Error('TradeProvider not mounted') },
  updateTrade: async () => {},
  removeTrade: async () => {},
  importBatch: async () => {},
  refresh: () => {},
})

export function TradeProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loaded, setLoaded] = useState(false)

  const loadTrades = useCallback(async () => {
    const data = await dl.getTrades()
    setTrades(data)
    setLoaded(true)
  }, [])

  useEffect(() => { loadTrades() }, [loadTrades])

  const refresh = useCallback(() => { loadTrades() }, [loadTrades])

  const addTrade = useCallback(async (data: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => {
    const validationError = validateTrade(data)
    if (validationError) throw new Error(validationError)
    const trade: Trade = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await dl.saveTrade(trade)
    await loadTrades()
    return trade
  }, [loadTrades])

  const updateTrade = useCallback(async (id: string, data: Partial<Trade>) => {
    const validationError = validateTrade(data)
    if (validationError) throw new Error(validationError)
    const existing = trades.find(t => t.id === id)
    if (!existing) return
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
    await dl.saveTrade(updated)
    await loadTrades()
  }, [trades, loadTrades])

  const removeTrade = useCallback(async (id: string) => {
    await dl.deleteTrade(id)
    await loadTrades()
  }, [loadTrades])

  const importBatch = useCallback(async (incoming: Trade[]) => {
    const valid: Trade[] = []
    for (const t of incoming) {
      const err = validateTrade(t)
      if (err) {
        console.warn(`[TradeProvider] importBatch skipping trade ${t.id}: ${err}`)
      } else {
        valid.push(t)
      }
    }
    if (valid.length > 0) {
      await dl.importTrades(valid)
    }
    await loadTrades()
  }, [loadTrades])

  return (
    <Ctx.Provider value={{ trades, loaded, addTrade, updateTrade, removeTrade, importBatch, refresh }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTrades() {
  return useContext(Ctx)
}
