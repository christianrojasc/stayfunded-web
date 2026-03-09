/**
 * Supabase-backed storage layer.
 * Mirrors the localStorage-based storage.ts API but uses Supabase.
 * All functions are async and require a userId (from supabase.auth.getUser).
 *
 * ⚠️  Do NOT import this until the .env.local keys are filled in.
 *     storage.ts (localStorage) remains the active implementation until then.
 */

import { supabase } from './supabase'
import {
  Trade,
  DailyNote,
  PropAccount,
  AppSettings,
  DailyChecklist,
  ChecklistItem,
  DEFAULT_FEE_SCHEDULE,
} from './types'

// ── Row types (Supabase snake_case → TypeScript camelCase) ───────────────────

type TradeRow = {
  id: string
  user_id: string
  account_id: string | null
  date: string
  session_date: string
  symbol: string
  side: string
  contracts: number
  entry_price: number
  exit_price: number
  pnl: number
  fees: number
  net_pnl: number
  setup: string | null
  notes: string | null
  tags: string[] | null
  status: string
  entry_time: string | null
  exit_time: string | null
  stop_loss: number | null
  take_profit: number | null
  order_id: string | null
  created_at: string
  updated_at: string
}

type PropAccountRow = {
  id: string
  user_id: string
  firm_name: string
  nickname: string | null
  account_number: string | null
  starting_balance: number
  status: string
  daily_loss_limit: number | null
  max_loss_limit: number
  drawdown_type: string
  profit_target: number | null
  max_daily_trades: number | null
  min_trading_days: number
  consistency_rule: string | null
  eval_cost: number | null
  activation_fee: number | null
  days_to_payout: number | null
  max_funded_accounts: number | null
  reset_fee: number | null
  created_at: string
}

type DailyNoteRow = {
  id: string
  user_id: string
  date: string
  session_date: string
  title: string | null
  content: string | null
  mood: string | null
  market_bias: string | null
  pre_market: string | null
  post_market: string | null
  created_at: string
  updated_at: string
}

type ProfileRow = {
  id: string
  display_name: string | null
  timezone: string | null
  currency: string | null
  default_contracts: number | null
  theme: string | null
  sidebar_collapsed: boolean | null
  auto_fees: boolean | null
}

type FeeScheduleRow = {
  id: string
  user_id: string
  symbol: string
  fee_per_side: number
}

type ChecklistRow = {
  id: string
  user_id: string
  session_date: string
  items: ChecklistItem[]
  readiness: number
  saved_at: string
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function rowToTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    date: row.date,
    sessionDate: row.session_date,
    symbol: row.symbol,
    side: row.side as Trade['side'],
    contracts: row.contracts,
    entryPrice: row.entry_price,
    exitPrice: row.exit_price,
    pnl: row.pnl,
    fees: row.fees,
    netPnl: row.net_pnl,
    setup: row.setup ?? undefined,
    notes: row.notes ?? undefined,
    tags: row.tags ?? [],
    status: row.status as Trade['status'],
    entryTime: row.entry_time ?? undefined,
    exitTime: row.exit_time ?? undefined,
    stopLoss: row.stop_loss ?? undefined,
    takeProfit: row.take_profit ?? undefined,
    accountId: row.account_id ?? undefined,
    orderId: row.order_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function tradeToRow(userId: string, trade: Trade): Omit<TradeRow, 'user_id'> & { user_id: string } {
  return {
    id: trade.id,
    user_id: userId,
    account_id: trade.accountId ?? null,
    date: trade.date,
    session_date: trade.sessionDate,
    symbol: trade.symbol,
    side: trade.side,
    contracts: trade.contracts,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    pnl: trade.pnl,
    fees: trade.fees,
    net_pnl: trade.netPnl,
    setup: trade.setup ?? null,
    notes: trade.notes ?? null,
    tags: trade.tags ?? [],
    status: trade.status,
    entry_time: trade.entryTime ?? null,
    exit_time: trade.exitTime ?? null,
    stop_loss: trade.stopLoss ?? null,
    take_profit: trade.takeProfit ?? null,
    order_id: trade.orderId ?? null,
    created_at: trade.createdAt,
    updated_at: trade.updatedAt,
  }
}

function rowToPropAccount(row: PropAccountRow): PropAccount {
  return {
    id: row.id,
    firmName: row.firm_name,
    nickname: row.nickname ?? '',
    accountNumber: row.account_number ?? '',
    startingBalance: row.starting_balance,
    status: row.status as PropAccount['status'],
    dailyLossLimit: row.daily_loss_limit,
    maxLossLimit: row.max_loss_limit,
    drawdownType: row.drawdown_type as PropAccount['drawdownType'],
    profitTarget: row.profit_target,
    maxDailyTrades: row.max_daily_trades,
    minTradingDays: row.min_trading_days,
    consistencyRule: row.consistency_rule ?? '',
    evalCost: row.eval_cost,
    activationFee: row.activation_fee,
    daysToPayout: row.days_to_payout ?? undefined,
    maxFundedAccounts: row.max_funded_accounts ?? undefined,
    resetFee: row.reset_fee,
    createdAt: row.created_at,
  }
}

function propAccountToRow(
  userId: string,
  account: PropAccount
): Omit<PropAccountRow, 'user_id'> & { user_id: string } {
  return {
    id: account.id,
    user_id: userId,
    firm_name: account.firmName,
    nickname: account.nickname || null,
    account_number: account.accountNumber || null,
    starting_balance: account.startingBalance,
    status: account.status,
    daily_loss_limit: account.dailyLossLimit,
    max_loss_limit: account.maxLossLimit,
    drawdown_type: account.drawdownType,
    profit_target: account.profitTarget,
    max_daily_trades: account.maxDailyTrades,
    min_trading_days: account.minTradingDays,
    consistency_rule: account.consistencyRule || null,
    eval_cost: account.evalCost ?? null,
    activation_fee: account.activationFee ?? null,
    days_to_payout: account.daysToPayout ?? null,
    max_funded_accounts: account.maxFundedAccounts ?? null,
    reset_fee: account.resetFee ?? null,
    created_at: account.createdAt,
  }
}

function rowToNote(row: DailyNoteRow): DailyNote {
  return {
    id: row.id,
    date: row.date,
    sessionDate: row.session_date,
    title: row.title ?? undefined,
    content: row.content ?? '',
    mood: row.mood as DailyNote['mood'],
    marketBias: row.market_bias as DailyNote['marketBias'],
    preMarket: row.pre_market ?? undefined,
    postMarket: row.post_market ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function noteToRow(
  userId: string,
  note: DailyNote
): Omit<DailyNoteRow, 'user_id'> & { user_id: string } {
  return {
    id: note.id,
    user_id: userId,
    date: note.date,
    session_date: note.sessionDate,
    title: note.title ?? null,
    content: note.content ?? null,
    mood: note.mood ?? null,
    market_bias: note.marketBias ?? null,
    pre_market: note.preMarket ?? null,
    post_market: note.postMarket ?? null,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  }
}

// ── Trades ───────────────────────────────────────────────────────────────────

export async function getTrades(userId: string): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) { console.error('[supabase] getTrades:', error); return [] }
  return (data as TradeRow[]).map(rowToTrade)
}

export async function saveTrade(userId: string, trade: Trade): Promise<void> {
  const row = tradeToRow(userId, trade)
  const { error } = await supabase
    .from('trades')
    .upsert(row, { onConflict: 'id' })

  if (error) console.error('[supabase] saveTrade:', error)
}

export async function deleteTrade(userId: string, tradeId: string): Promise<void> {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', tradeId)
    .eq('user_id', userId)

  if (error) console.error('[supabase] deleteTrade:', error)
}

export async function deleteAllTrades(userId: string): Promise<void> {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('user_id', userId)
  if (error) console.error('[supabase] deleteAllTrades:', error)
}

export async function deleteAllPropAccounts(userId: string): Promise<void> {
  const { error } = await supabase
    .from('prop_accounts')
    .delete()
    .eq('user_id', userId)
  if (error) console.error('[supabase] deleteAllPropAccounts:', error)
}

/**
 * Bulk import trades, deduplicating by order_id (if present) or id.
 */
export async function importTrades(userId: string, trades: Trade[]): Promise<void> {
  if (!trades.length) return

  const rows = trades.map(t => tradeToRow(userId, t))

  // Upsert on id — if same id exists it will update
  const { error } = await supabase
    .from('trades')
    .upsert(rows, { onConflict: 'id' })

  if (error) console.error('[supabase] importTrades:', error)
}

// ── Prop Accounts ────────────────────────────────────────────────────────────

export async function getPropAccounts(userId: string): Promise<PropAccount[]> {
  const { data, error } = await supabase
    .from('prop_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) { console.error('[supabase] getPropAccounts:', error); return [] }
  return (data as PropAccountRow[]).map(rowToPropAccount)
}

export async function savePropAccount(userId: string, account: PropAccount): Promise<void> {
  const row = propAccountToRow(userId, account)
  const { error } = await supabase
    .from('prop_accounts')
    .upsert(row, { onConflict: 'id' })

  if (error) console.error('[supabase] savePropAccount:', error)
}

export async function deletePropAccount(userId: string, accountId: string): Promise<void> {
  // Delete trades associated with this account first
  const { error: tradesError } = await supabase
    .from('trades')
    .delete()
    .eq('account_id', accountId)
    .eq('user_id', userId)

  if (tradesError) console.error('[supabase] deletePropAccount trades:', tradesError)

  // Then delete the account
  const { error } = await supabase
    .from('prop_accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_id', userId)

  if (error) console.error('[supabase] deletePropAccount:', error)
}

export async function getPropAccount(userId: string, accountId: string): Promise<PropAccount | null> {
  const { data, error } = await supabase
    .from('prop_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single()

  if (error) { console.error('[supabase] getPropAccount:', error); return null }
  return rowToPropAccount(data as PropAccountRow)
}

// ── Daily Notes ──────────────────────────────────────────────────────────────

export async function getDailyNotes(userId: string): Promise<DailyNote[]> {
  const { data, error } = await supabase
    .from('daily_notes')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })

  if (error) { console.error('[supabase] getDailyNotes:', error); return [] }
  return (data as DailyNoteRow[]).map(rowToNote)
}

export async function saveDailyNote(userId: string, note: DailyNote): Promise<void> {
  const row = noteToRow(userId, note)
  const { error } = await supabase
    .from('daily_notes')
    .upsert(row, { onConflict: 'id' })

  if (error) console.error('[supabase] saveDailyNote:', error)
}

export async function deleteDailyNote(userId: string, noteId: string): Promise<void> {
  const { error } = await supabase
    .from('daily_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)

  if (error) console.error('[supabase] deleteDailyNote:', error)
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(userId: string): Promise<AppSettings> {
  const defaults: AppSettings = {
    activeAccountId: '',
    currency: 'USD',
    timezone: 'America/New_York',
    defaultContracts: 1,
    theme: 'dark',
    sidebarCollapsed: false,
    feeSchedule: { ...DEFAULT_FEE_SCHEDULE },
    autoFees: true,
  }

  // Fetch profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileErr) {
    console.error('[supabase] getSettings (profile):', profileErr)
    return defaults
  }

  const p = profile as ProfileRow

  // Fetch fee schedules
  const { data: fees, error: feesErr } = await supabase
    .from('fee_schedules')
    .select('*')
    .eq('user_id', userId)

  const feeSchedule = { ...DEFAULT_FEE_SCHEDULE }
  if (!feesErr && fees) {
    for (const f of fees as FeeScheduleRow[]) {
      feeSchedule[f.symbol] = f.fee_per_side
    }
  }

  return {
    activeAccountId: defaults.activeAccountId,
    currency: p.currency ?? defaults.currency,
    timezone: p.timezone ?? defaults.timezone,
    defaultContracts: p.default_contracts ?? defaults.defaultContracts,
    theme: (p.theme as AppSettings['theme']) ?? defaults.theme,
    sidebarCollapsed: p.sidebar_collapsed ?? defaults.sidebarCollapsed,
    autoFees: p.auto_fees ?? defaults.autoFees,
    feeSchedule,
  }
}

export async function saveSettings(userId: string, settings: Partial<AppSettings>): Promise<void> {
  // Update profile fields
  const profileUpdate: Partial<ProfileRow> = {}
  if (settings.currency      !== undefined) profileUpdate.currency          = settings.currency
  if (settings.timezone      !== undefined) profileUpdate.timezone          = settings.timezone
  if (settings.defaultContracts !== undefined) profileUpdate.default_contracts = settings.defaultContracts
  if (settings.theme         !== undefined) profileUpdate.theme             = settings.theme
  if (settings.sidebarCollapsed !== undefined) profileUpdate.sidebar_collapsed = settings.sidebarCollapsed
  if (settings.autoFees      !== undefined) profileUpdate.auto_fees         = settings.autoFees

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update({ ...profileUpdate, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) console.error('[supabase] saveSettings (profile):', error)
  }

  // Upsert fee schedule rows
  if (settings.feeSchedule) {
    const rows = Object.entries(settings.feeSchedule).map(([symbol, fee_per_side]) => ({
      user_id: userId,
      symbol,
      fee_per_side,
    }))

    const { error } = await supabase
      .from('fee_schedules')
      .upsert(rows, { onConflict: 'user_id,symbol' })

    if (error) console.error('[supabase] saveSettings (fees):', error)
  }
}

// ── Daily Checklists ─────────────────────────────────────────────────────────

export async function getChecklists(userId: string): Promise<DailyChecklist[]> {
  const { data, error } = await supabase
    .from('daily_checklists')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })

  if (error) { console.error('[supabase] getChecklists:', error); return [] }
  return (data as ChecklistRow[]).map(row => ({
    sessionDate: row.session_date,
    items: row.items,
    readiness: row.readiness,
    savedAt: row.saved_at,
  }))
}

export async function saveChecklist(userId: string, checklist: DailyChecklist): Promise<void> {
  const { error } = await supabase
    .from('daily_checklists')
    .upsert(
      {
        user_id: userId,
        session_date: checklist.sessionDate,
        items: checklist.items,
        readiness: checklist.readiness,
        saved_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,session_date' }
    )

  if (error) console.error('[supabase] saveChecklist:', error)
}
