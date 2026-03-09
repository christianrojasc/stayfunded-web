/**
 * data-layer.ts
 *
 * Unified data-access layer that routes to Supabase.
 * Auth is required — no localStorage fallback.
 *
 * All functions are async so callers don't need to know which backend is used.
 *
 * Usage:
 *   import * as dl from '@/lib/data-layer'
 *   const trades = await dl.getTrades()
 */

import { supabase } from './supabase'
import * as cloud from './supabase-storage'
import {
  Trade,
  DailyNote,
  PropAccount,
  AppSettings,
  DailyChecklist,
  ChecklistItem,
} from './types'
import { DEFAULT_CHECKLIST_ITEMS } from './storage'

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

// ── Trades ────────────────────────────────────────────────────────────────────

export async function getTrades(): Promise<Trade[]> {
  const userId = await getUserId()
  if (!userId) return []
  return cloud.getTrades(userId)
}

export async function saveTrade(trade: Trade): Promise<void> {
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')
  return cloud.saveTrade(userId, trade)
}

export async function deleteTrade(id: string): Promise<void> {
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')
  return cloud.deleteTrade(userId, id)
}

export async function deleteAllTrades(): Promise<void> {
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')
  await cloud.deleteAllTrades(userId)
  await cloud.deleteAllPropAccounts(userId)
}

export async function importTrades(trades: Trade[]): Promise<void> {
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')
  return cloud.importTrades(userId, trades)
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function getNotes(): Promise<DailyNote[]> {
  const userId = await getUserId()
  if (!userId) return []
  return cloud.getDailyNotes(userId)
}

export async function saveNote(note: DailyNote): Promise<void> {
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')
  return cloud.saveDailyNote(userId, note)
}

export async function deleteNote(id: string): Promise<void> {
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')
  return cloud.deleteDailyNote(userId, id)
}

// ── Prop Accounts ─────────────────────────────────────────────────────────────

export async function getPropAccounts(): Promise<PropAccount[]> {
  const userId = await getUserId()
  if (!userId) return []
  return cloud.getPropAccounts(userId)
}

export async function savePropAccount(account: PropAccount): Promise<void> {
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')
  return cloud.savePropAccount(userId, account)
}

export async function deletePropAccount(id: string): Promise<void> {
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')
  return cloud.deletePropAccount(userId, id)
}

export async function getPropAccount(id: string): Promise<PropAccount | null | undefined> {
  const userId = await getUserId()
  if (!userId) return null
  return cloud.getPropAccount(userId, id)
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const userId = await getUserId()
  if (!userId) return { activeAccountId: '', currency: 'USD', timezone: 'America/New_York', defaultContracts: 1, theme: 'dark' as const, sidebarCollapsed: false, feeSchedule: {}, autoFees: false }
  return cloud.getSettings(userId)
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')
  return cloud.saveSettings(userId, settings)
}

// ── Daily Checklists ──────────────────────────────────────────────────────────

export async function getChecklist(sessionDate: string): Promise<DailyChecklist> {
  const userId = await getUserId()
  if (!userId) {
    return {
      sessionDate,
      items: DEFAULT_CHECKLIST_ITEMS.map((i: ChecklistItem) => ({ ...i, checked: false })),
      readiness: 0,
      savedAt: new Date().toISOString(),
    }
  }
  const all = await cloud.getChecklists(userId)
  const found = all.find(c => c.sessionDate === sessionDate)
  if (found) return found
  return {
    sessionDate,
    items: DEFAULT_CHECKLIST_ITEMS.map((i: ChecklistItem) => ({ ...i, checked: false })),
    readiness: 0,
    savedAt: new Date().toISOString(),
  }
}

export async function getAllChecklists(): Promise<DailyChecklist[]> {
  const userId = await getUserId()
  if (!userId) return []
  return cloud.getChecklists(userId)
}

export async function saveChecklist(checklist: DailyChecklist): Promise<void> {
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')
  return cloud.saveChecklist(userId, checklist)
}

// ── Checklist template (localStorage only — no Supabase table) ───────────────

export { getChecklistTemplate, saveChecklistTemplate } from './storage'

// ── Regular accounts (localStorage only — Supabase uses profiles table) ──────

export { getAccounts, saveAccount } from './storage'

// ── Seed data (localStorage only) ─────────────────────────────────────────────

export { seedDemoData } from './storage'
