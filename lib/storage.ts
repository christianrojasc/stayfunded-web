import { Trade, DailyNote, Account, AppSettings, PropAccount, DailyChecklist, ChecklistItem, DEFAULT_FEE_SCHEDULE } from './types'
import { v4 as uuidv4 } from 'uuid'

const KEYS = {
  TRADES: 'sf_trades',
  NOTES: 'sf_notes',
  ACCOUNTS: 'sf_accounts',
  PROP_ACCOUNTS: 'sf_prop_accounts',
  SETTINGS: 'sf_settings',
  CHECKLISTS: 'sf_checklists',
}

// ── Generic helpers ──────────────────────────────────────────────────────────

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// ── Trades ───────────────────────────────────────────────────────────────────

export function getTrades(): Trade[] {
  return get<Trade[]>(KEYS.TRADES, [])
}

export function saveTrade(trade: Trade): void {
  const trades = getTrades()
  const idx = trades.findIndex(t => t.id === trade.id)
  if (idx >= 0) trades[idx] = trade
  else trades.push(trade)
  set(KEYS.TRADES, trades)
}

export function deleteTrade(id: string): void {
  set(KEYS.TRADES, getTrades().filter(t => t.id !== id))
}

export function clearAllTrades(): void {
  set(KEYS.TRADES, [])
}

export function clearAllPropAccounts(): void {
  set(KEYS.PROP_ACCOUNTS, [])
}

export function importTrades(trades: Trade[]): void {
  const existing = getTrades()
  const map = new Map(existing.map(t => [t.id, t]))
  trades.forEach(t => map.set(t.id, t))
  set(KEYS.TRADES, Array.from(map.values()))
}

// ── Notes ────────────────────────────────────────────────────────────────────

export function getNotes(): DailyNote[] {
  return get<DailyNote[]>(KEYS.NOTES, [])
}

export function saveNote(note: DailyNote): void {
  const notes = getNotes()
  const idx = notes.findIndex(n => n.id === note.id)
  if (idx >= 0) notes[idx] = note
  else notes.push(note)
  set(KEYS.NOTES, notes)
}

export function deleteNote(id: string): void {
  set(KEYS.NOTES, getNotes().filter(n => n.id !== id))
}

// ── Accounts ─────────────────────────────────────────────────────────────────

const DEFAULT_ACCOUNT: Account = {
  id: 'default',
  name: 'My Account',
  balance: 50000,
  startingBalance: 50000,
  platform: 'Tradovate',
  phase: 'personal',
  createdAt: new Date().toISOString(),
}

export function getAccounts(): Account[] {
  return get<Account[]>(KEYS.ACCOUNTS, [DEFAULT_ACCOUNT])
}

export function saveAccount(account: Account): void {
  const accounts = getAccounts()
  const idx = accounts.findIndex(a => a.id === account.id)
  if (idx >= 0) accounts[idx] = account
  else accounts.push(account)
  set(KEYS.ACCOUNTS, accounts)
}

// ── Prop Accounts ─────────────────────────────────────────────────────────────

export function getPropAccounts(): PropAccount[] {
  return get<PropAccount[]>(KEYS.PROP_ACCOUNTS, [])
}

export function savePropAccount(account: PropAccount): void {
  const accounts = getPropAccounts()
  const idx = accounts.findIndex(a => a.id === account.id)
  if (idx >= 0) accounts[idx] = account
  else accounts.push(account)
  set(KEYS.PROP_ACCOUNTS, accounts)
}

export function deletePropAccount(id: string): void {
  // Delete trades associated with this account
  const allTrades: Trade[] = get(KEYS.TRADES, [] as Trade[])
  set(KEYS.TRADES, allTrades.filter(t => t.accountId !== id))
  // Delete the account
  set(KEYS.PROP_ACCOUNTS, getPropAccounts().filter(a => a.id !== id))
}

export function getPropAccount(id: string): PropAccount | undefined {
  return getPropAccounts().find(a => a.id === id)
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: '1', text: 'Reviewed overnight price action', checked: false, category: 'analysis' },
  { id: '2', text: 'Checked economic calendar', checked: false, category: 'analysis' },
  { id: '3', text: 'Set daily loss limit alert', checked: false, category: 'risk' },
  { id: '4', text: 'Reviewed yesterday\'s journal entry', checked: false, category: 'analysis' },
  { id: '5', text: 'Mental state: focused and calm', checked: false, category: 'mindset' },
  { id: '6', text: 'No revenge trading mindset', checked: false, category: 'mindset' },
  { id: '7', text: 'Identified key S/R levels', checked: false, category: 'technical' },
  { id: '8', text: 'Trading plan written for today', checked: false, category: 'analysis' },
]

export function getChecklist(sessionDate: string): DailyChecklist {
  const all = get<DailyChecklist[]>(KEYS.CHECKLISTS, [])
  const existing = all.find(c => c.sessionDate === sessionDate)
  if (existing) return existing

  // Return fresh template for new session
  return {
    sessionDate,
    items: DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i, checked: false })),
    readiness: 0,
    savedAt: new Date().toISOString(),
  }
}

export function saveChecklist(checklist: DailyChecklist): void {
  const all = get<DailyChecklist[]>(KEYS.CHECKLISTS, [])
  const idx = all.findIndex(c => c.sessionDate === checklist.sessionDate)
  const updated = { ...checklist, savedAt: new Date().toISOString() }
  if (idx >= 0) all[idx] = updated
  else all.push(updated)
  set(KEYS.CHECKLISTS, all)
}

export function getChecklistTemplate(): ChecklistItem[] {
  return get<ChecklistItem[]>('sf_checklist_template', DEFAULT_CHECKLIST_ITEMS)
}

export function saveChecklistTemplate(items: ChecklistItem[]): void {
  set('sf_checklist_template', items)
}

// ── Setups ───────────────────────────────────────────────────────────────────

export function getSetups(): string[] {
  return get<string[]>('sf_setups', [])
}

export function saveSetups(setups: string[]): void {
  set('sf_setups', setups)
}

// ── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  activeAccountId: 'default',
  currency: 'USD',
  timezone: 'America/New_York',
  defaultContracts: 1,
  theme: 'light',
  sidebarCollapsed: false,
  feeSchedule: DEFAULT_FEE_SCHEDULE,
  autoFees: true,
}

export function getSettings(): AppSettings {
  const saved = get<Partial<AppSettings>>(KEYS.SETTINGS, {})
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    feeSchedule: { ...DEFAULT_FEE_SCHEDULE, ...(saved.feeSchedule || {}) },
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  set(KEYS.SETTINGS, { ...getSettings(), ...settings })
}

// ── Seed data ─────────────────────────────────────────────────────────────────

export function seedDemoData(): void {
  const existing = getTrades()
  if (existing.length > 0) return

  const now = new Date()
  const trades: Trade[] = []
  const symbols = ['ES', 'NQ', 'MES', 'MNQ', 'CL', 'GC']
  const sides: Trade['side'][] = ['Long', 'Short']
  const setups = ['Breakout', 'VWAP Reclaim', 'Opening Range', 'Pullback', 'Reversal', 'ICT Killzone']

  for (let i = 30; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (d.getDay() === 0 || d.getDay() === 6) continue

    const date = d.toISOString().split('T')[0]
    const tradesForDay = Math.floor(Math.random() * 4) + 1

    for (let j = 0; j < tradesForDay; j++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)]
      const side = sides[Math.floor(Math.random() * 2)]
      const isMicro = sym.startsWith('M')
      const multiplier = isMicro ? 5 : 50
      const basePrice = sym === 'NQ' || sym === 'MNQ' ? 18000 + Math.random() * 2000
        : sym === 'CL' ? 70 + Math.random() * 10
        : sym === 'GC' ? 1900 + Math.random() * 200
        : 4500 + Math.random() * 500
      const contracts = Math.floor(Math.random() * 3) + 1
      const move = (Math.random() - 0.42) * (sym === 'NQ' || sym === 'MNQ' ? 60 : 15)
      const entry = parseFloat(basePrice.toFixed(2))
      const exit = parseFloat((basePrice + (side === 'Long' ? move : -move)).toFixed(2))
      const pnl = parseFloat(((exit - entry) * contracts * (sym === 'NQ' || sym === 'MNQ' ? 20 : multiplier)).toFixed(2))
      const feePerSide = (sym.startsWith('M') && sym.length <= 3) || ['MES','MNQ','MYM','M2K','MGC','MCL'].includes(sym) ? 0.20 : 1.99; const fees = parseFloat((feePerSide * 2 * contracts).toFixed(2))

      trades.push({
        id: `demo_${date}_${j}_${Math.random().toString(36).slice(2, 7)}`,
        date, sessionDate: date, symbol: sym, side, contracts,
        entryPrice: entry, exitPrice: exit, pnl, fees,
        netPnl: parseFloat((pnl - fees).toFixed(2)),
        setup: setups[Math.floor(Math.random() * setups.length)],
        notes: '', tags: [], status: 'closed',
        createdAt: d.toISOString(), updatedAt: d.toISOString(),
      })
    }
  }

  set(KEYS.TRADES, trades)
}
