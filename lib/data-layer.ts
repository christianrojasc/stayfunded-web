/**
 * data-layer.ts
 *
 * Unified data-access layer that automatically routes to Supabase (when the
 * user is authenticated) or to localStorage (when they are not).
 *
 * All functions are async so callers don't need to know which backend is used.
 *
 * Usage:
 *   import * as dl from '@/lib/data-layer'
 *   const trades = await dl.getTrades()
 */

import { supabase } from './supabase'
import * as local from './storage'
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

/**
 * Returns the current user's ID, or null if not authenticated.
 * Uses getSession() (reads from local storage — no network call) for speed.
 */
async function getUserId(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

// ── Trades ────────────────────────────────────────────────────────────────────

export async function getTrades(): Promise<Trade[]> {
  const userId = await getUserId()
  if (userId) return cloud.getTrades(userId)
  return local.getTrades()
}

export async function saveTrade(trade: Trade): Promise<void> {
  const userId = await getUserId()
  if (userId) return cloud.saveTrade(userId, trade)
  local.saveTrade(trade)
}

export async function deleteTrade(id: string): Promise<void> {
  const userId = await getUserId()
  if (userId) return cloud.deleteTrade(userId, id)
  local.deleteTrade(id)
}

export async function deleteAllTrades(): Promise<void> {
  const userId = await getUserId()
  if (userId) {
    await cloud.deleteAllTrades(userId)
    await cloud.deleteAllPropAccounts(userId)
  }
  local.clearAllTrades()
  local.clearAllPropAccounts()
}

export async function importTrades(trades: Trade[]): Promise<void> {
  const userId = await getUserId()
  if (userId) return cloud.importTrades(userId, trades)
  local.importTrades(trades)
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function getNotes(): Promise<DailyNote[]> {
  const userId = await getUserId()
  if (userId) return cloud.getDailyNotes(userId)
  return local.getNotes()
}

export async function saveNote(note: DailyNote): Promise<void> {
  const userId = await getUserId()
  if (userId) return cloud.saveDailyNote(userId, note)
  local.saveNote(note)
}

export async function deleteNote(id: string): Promise<void> {
  const userId = await getUserId()
  if (userId) return cloud.deleteDailyNote(userId, id)
  local.deleteNote(id)
}

// ── Prop Accounts ─────────────────────────────────────────────────────────────

export async function getPropAccounts(): Promise<PropAccount[]> {
  const userId = await getUserId()
  if (userId) return cloud.getPropAccounts(userId)
  return local.getPropAccounts()
}

export async function savePropAccount(account: PropAccount): Promise<void> {
  const userId = await getUserId()
  if (userId) return cloud.savePropAccount(userId, account)
  local.savePropAccount(account)
}

export async function deletePropAccount(id: string): Promise<void> {
  const userId = await getUserId()
  if (userId) return cloud.deletePropAccount(userId, id)
  local.deletePropAccount(id)
}

export async function getPropAccount(id: string): Promise<PropAccount | null | undefined> {
  const userId = await getUserId()
  if (userId) return cloud.getPropAccount(userId, id)
  return local.getPropAccount(id)
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const userId = await getUserId()
  if (userId) return cloud.getSettings(userId)
  return local.getSettings()
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const userId = await getUserId()
  if (userId) return cloud.saveSettings(userId, settings)
  local.saveSettings(settings)
}

// ── Daily Checklists ──────────────────────────────────────────────────────────

export async function getChecklist(sessionDate: string): Promise<DailyChecklist> {
  const userId = await getUserId()
  if (userId) {
    const all = await cloud.getChecklists(userId)
    const found = all.find(c => c.sessionDate === sessionDate)
    if (found) return found
    // Return fresh template for new session (mirrors storage.ts behaviour)
    return {
      sessionDate,
      items: DEFAULT_CHECKLIST_ITEMS.map((i: ChecklistItem) => ({ ...i, checked: false })),
      readiness: 0,
      savedAt: new Date().toISOString(),
    }
  }
  return local.getChecklist(sessionDate)
}

export async function saveChecklist(checklist: DailyChecklist): Promise<void> {
  const userId = await getUserId()
  if (userId) return cloud.saveChecklist(userId, checklist)
  local.saveChecklist(checklist)
}

// ── Checklist template (localStorage only — no Supabase table) ───────────────

export function getChecklistTemplate(): ChecklistItem[] {
  return local.getChecklistTemplate()
}

export function saveChecklistTemplate(items: ChecklistItem[]): void {
  local.saveChecklistTemplate(items)
}

// ── Regular accounts (localStorage only — Supabase uses profiles table) ──────
// These stay local-only until a dedicated accounts table is added to Supabase.

export { getAccounts, saveAccount } from './storage'

// ── Seed data (localStorage only) ─────────────────────────────────────────────

export { seedDemoData } from './storage'

// ── TODO: First-login migration ───────────────────────────────────────────────
// When a user signs in for the first time, offer to sync their existing
// localStorage data (trades, notes, checklists) to Supabase so they don't
// lose historical data.
//
// Suggested approach:
//   1. On sign-in success (AuthContext), check if localStorage has any trades
//   2. If yes AND Supabase has no trades for this user, prompt the user
//   3. If they accept, call importTrades(local.getTrades()) via the data-layer
//      (which will route to cloud.importTrades since they're now authenticated)
//   4. Do the same for notes and checklists
//   5. Store a flag (e.g. 'sf_migration_done') in localStorage to avoid
//      re-prompting on subsequent sign-ins
//
// This feature is intentionally deferred as it requires a migration UI and
// careful handling of potential duplicates.

