export type Side = 'Long' | 'Short'

export type Symbol =
  | 'ES' | 'NQ' | 'CL' | 'GC' | 'YM' | 'RTY' | '6E' | '6J'
  | 'MES' | 'MNQ' | 'MCL' | 'MGC' | 'MYM' | 'M2K'
  | 'ZB' | 'ZN' | 'ZC' | 'ZS' | 'ZW'
  | string

export type TradeStatus = 'open' | 'closed'
export type AccountStatus = 'evaluation' | 'funded'
export type DrawdownType = 'static_eod' | 'trailing' | 'trailing_eod' | 'static_intraday' | 'static'

export interface Trade {
  id: string
  date: string
  sessionDate: string
  symbol: Symbol
  side: Side
  contracts: number
  entryPrice: number
  exitPrice: number
  pnl: number
  fees: number
  netPnl: number
  setup?: string
  notes?: string
  screenshot?: string
  tags?: string[]
  status: TradeStatus
  entryTime?: string
  exitTime?: string
  stopLoss?: number
  takeProfit?: number
  accountId?: string
  orderId?: string
  createdAt: string
  updatedAt: string
}

export interface DailyNote {
  id: string
  date: string
  sessionDate: string
  title?: string
  content: string
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
  marketBias?: 'bullish' | 'bearish' | 'neutral'
  preMarket?: string
  postMarket?: string
  screenshot?: string
  createdAt: string
  updatedAt: string
}

export interface Account {
  id: string
  name: string
  balance: number
  startingBalance: number
  platform?: string
  firm?: string
  phase?: 'challenge' | 'funded' | 'personal'
  maxDailyLoss?: number
  maxTotalDrawdown?: number
  profitTarget?: number
  createdAt: string
}

// ── Prop Account ─────────────────────────────────────────────────────────────

export interface PropAccount {
  id: string
  firmName: string
  nickname: string
  accountNumber: string
  startingBalance: number
  status: AccountStatus
  dailyLossLimit: number | null   // null = no daily loss limit (e.g. Apex)
  maxLossLimit: number
  drawdownType: DrawdownType
  profitTarget: number | null
  maxDailyTrades: number | null
  minTradingDays: number
  consistencyRule: string
  evalCost?: number | null
  activationFee?: number | null
  daysToPayout?: number
  maxFundedAccounts?: number
  resetFee?: number | null
  createdAt: string
}

// ── Prop Firm Presets (real data from OnlyPropFirms.com) ──────────────────────

export interface PropFirmPlan {
  planId: string
  label: string
  size: number              // account size in K (50 = $50,000)
  evalCost: number | null   // monthly subscription / eval fee
  activationFee: number | null
  profitTarget: number | null
  drawdown: number
  drawdownType: DrawdownType
  dailyLossLimit: number | null
  minTradingDays: number
  daysToPayout: number
  maxFundedAccounts: number
  resetFee: number | null
  consistencyRule: string
}

export interface PropFirmPreset {
  firmName: string
  prefixes: string[]
  description?: string
  plans: PropFirmPlan[]
}

// ── REAL DATA from OnlyPropFirms.com JSON ─────────────────────────────────────

export const PROP_FIRM_PRESETS: PropFirmPreset[] = [
  // ─── Apex Trader Funding ───────────────────────────────────────────────────
  {
    firmName: 'Apex Trader Funding',
    prefixes: ['APEX'],
    description: 'Trailing intraday drawdown. No daily loss limit. Up to 20 funded accounts.',
    plans: [
      { planId: 'apex-25k', label: '25K', size: 25, evalCost: 18.70, activationFee: 75, profitTarget: 1500, drawdown: 1500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 8, maxFundedAccounts: 20, resetFee: 50, consistencyRule: '' },
      { planId: 'apex-50k', label: '50K', size: 50, evalCost: 19.70, activationFee: 75, profitTarget: 3000, drawdown: 2500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 8, maxFundedAccounts: 20, resetFee: 50, consistencyRule: '' },
      { planId: 'apex-100k', label: '100K', size: 100, evalCost: 29.70, activationFee: 75, profitTarget: 6000, drawdown: 3000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 8, maxFundedAccounts: 20, resetFee: 50, consistencyRule: '' },
      { planId: 'apex-100k-static', label: '100K Static', size: 100, evalCost: 29.70, activationFee: 75, profitTarget: 2000, drawdown: 625, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 8, maxFundedAccounts: 20, resetFee: 50, consistencyRule: '' },
      { planId: 'apex-150k', label: '150K', size: 150, evalCost: 39.70, activationFee: 95, profitTarget: 9000, drawdown: 5000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 8, maxFundedAccounts: 20, resetFee: 50, consistencyRule: '' },
      { planId: 'apex-250k', label: '250K', size: 250, evalCost: 39.70, activationFee: 95, profitTarget: 15000, drawdown: 6500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 8, maxFundedAccounts: 20, resetFee: 50, consistencyRule: '' },
      { planId: 'apex-300k', label: '300K', size: 300, evalCost: 39.70, activationFee: 95, profitTarget: 20000, drawdown: 7500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 8, maxFundedAccounts: 20, resetFee: 50, consistencyRule: '' },
    ],
  },

  // ─── Tradeify ─────────────────────────────────────────────────────────────
  {
    firmName: 'Tradeify',
    prefixes: ['TDY', 'TDYS', 'TDYG', 'FTD', 'FTDFY', 'FTDFYG', 'FTDFYL', 'TDFYSL', 'FTDFYSLD'],
    description: 'Trailing EOD drawdown. Growth (1-day eval), Select (3-day eval, Daily/Flex payouts), Lightning (instant funding). No activation fees.',
    plans: [
      // ── Growth Eval ──
      { planId: 'tdy-growth-50k', label: 'Growth 50K', size: 50, evalCost: 97, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'trailing_eod', dailyLossLimit: 1250, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 95, consistencyRule: 'No consistency in eval. 35% once funded. DLL increases to max DD at 6% account profit.' },
      { planId: 'tdy-growth-100k', label: 'Growth 100K', size: 100, evalCost: 174, activationFee: null, profitTarget: 6000, drawdown: 3500, drawdownType: 'trailing_eod', dailyLossLimit: 2500, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 169, consistencyRule: 'No consistency in eval. 35% once funded. DLL increases to max DD at 6% account profit.' },
      { planId: 'tdy-growth-150k', label: 'Growth 150K', size: 150, evalCost: 251, activationFee: null, profitTarget: 9000, drawdown: 5000, drawdownType: 'trailing_eod', dailyLossLimit: 3750, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 243, consistencyRule: 'No consistency in eval. 35% once funded. DLL increases to max DD at 6% account profit.' },
      // ── Select Eval (Daily Payout Path) ──
      { planId: 'tdy-select-50k-daily', label: 'Select 50K (Daily)', size: 50, evalCost: 111, activationFee: null, profitTarget: 2500, drawdown: 2000, drawdownType: 'trailing_eod', dailyLossLimit: 1000, minTradingDays: 3, daysToPayout: 1, maxFundedAccounts: 5, resetFee: 95, consistencyRule: '40% consistency in eval. No consistency once funded. Max daily payout $1,000.' },
      { planId: 'tdy-select-100k-daily', label: 'Select 100K (Daily)', size: 100, evalCost: 181, activationFee: null, profitTarget: 6000, drawdown: 2500, drawdownType: 'trailing_eod', dailyLossLimit: 1250, minTradingDays: 3, daysToPayout: 1, maxFundedAccounts: 5, resetFee: 155, consistencyRule: '40% consistency in eval. No consistency once funded. Max daily payout $1,500.' },
      { planId: 'tdy-select-150k-daily', label: 'Select 150K (Daily)', size: 150, evalCost: 251, activationFee: null, profitTarget: 9000, drawdown: 3500, drawdownType: 'trailing_eod', dailyLossLimit: 1500, minTradingDays: 3, daysToPayout: 1, maxFundedAccounts: 5, resetFee: 215, consistencyRule: '40% consistency in eval. No consistency once funded. Max daily payout $2,000.' },
      // ── Select Eval (5-Day Flex Payout Path) ──
      { planId: 'tdy-select-50k-flex', label: 'Select 50K (Flex)', size: 50, evalCost: 111, activationFee: null, profitTarget: 2500, drawdown: 2000, drawdownType: 'trailing_eod', dailyLossLimit: null, minTradingDays: 3, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 95, consistencyRule: '40% consistency in eval. No consistency once funded. Max payout $3,000.' },
      { planId: 'tdy-select-100k-flex', label: 'Select 100K (Flex)', size: 100, evalCost: 181, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'trailing_eod', dailyLossLimit: null, minTradingDays: 3, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 155, consistencyRule: '40% consistency in eval. No consistency once funded. Max payout $4,000.' },
      { planId: 'tdy-select-150k-flex', label: 'Select 150K (Flex)', size: 150, evalCost: 251, activationFee: null, profitTarget: 9000, drawdown: 4500, drawdownType: 'trailing_eod', dailyLossLimit: null, minTradingDays: 3, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 215, consistencyRule: '40% consistency in eval. No consistency once funded. Max payout $6,000.' },
      // ── Lightning (Instant Funded — no eval) ──
      { planId: 'tdy-lightning-25k', label: 'Lightning 25K', size: 25, evalCost: null, activationFee: 165, profitTarget: null, drawdown: 1500, drawdownType: 'trailing_eod', dailyLossLimit: null, minTradingDays: 0, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '20% consistency, relaxes after each payout.' },
      { planId: 'tdy-lightning-50k', label: 'Lightning 50K', size: 50, evalCost: null, activationFee: 328, profitTarget: null, drawdown: 2000, drawdownType: 'trailing_eod', dailyLossLimit: null, minTradingDays: 0, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '20% consistency, relaxes after each payout.' },
      { planId: 'tdy-lightning-100k', label: 'Lightning 100K', size: 100, evalCost: null, activationFee: 440, profitTarget: null, drawdown: 3500, drawdownType: 'trailing_eod', dailyLossLimit: null, minTradingDays: 0, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '20% consistency, relaxes after each payout.' },
      { planId: 'tdy-lightning-150k', label: 'Lightning 150K', size: 150, evalCost: null, activationFee: 531, profitTarget: null, drawdown: 5000, drawdownType: 'trailing_eod', dailyLossLimit: null, minTradingDays: 0, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '20% consistency, relaxes after each payout.' },
    ],
  },

  // ─── Take Profit Trader ────────────────────────────────────────────────────
  {
    firmName: 'Take Profit Trader',
    prefixes: ['TPT'],
    description: 'Static EOD drawdown. Same-day payout. No daily loss limit.',
    plans: [
      { planId: 'tpt-25k', label: '25K', size: 25, evalCost: 90, activationFee: null, profitTarget: 1500, drawdown: 1500, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'tpt-50k', label: '50K', size: 50, evalCost: 102, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'tpt-75k', label: '75K', size: 75, evalCost: 147, activationFee: null, profitTarget: 4500, drawdown: 2500, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'tpt-100k', label: '100K', size: 100, evalCost: 198, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'tpt-150k', label: '150K', size: 150, evalCost: 216, activationFee: null, profitTarget: 9000, drawdown: 4500, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
    ],
  },

  // ─── TopStep ───────────────────────────────────────────────────────────────
  {
    firmName: 'TopStep',
    prefixes: ['TS'],
    description: 'Trailing drawdown with daily loss limit. Industry pioneer.',
    plans: [
      { planId: 'ts-50k', label: '50K', size: 50, evalCost: 49, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'trailing', dailyLossLimit: 1000, minTradingDays: 0, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 99, consistencyRule: 'No single day should represent more than 40% of total profit' },
      { planId: 'ts-100k', label: '100K', size: 100, evalCost: 99, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'trailing', dailyLossLimit: 2000, minTradingDays: 0, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 149, consistencyRule: 'No single day should represent more than 40% of total profit' },
      { planId: 'ts-150k', label: '150K', size: 150, evalCost: 149, activationFee: null, profitTarget: 9000, drawdown: 4500, drawdownType: 'trailing', dailyLossLimit: 3000, minTradingDays: 0, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 199, consistencyRule: 'No single day should represent more than 40% of total profit' },
    ],
  },

  // ─── My Funded Futures ────────────────────────────────────────────────────
  {
    firmName: 'My Funded Futures',
    prefixes: ['MFFU'],
    description: 'Static EOD drawdown. Multiple program options. Next-day payout available.',
    plans: [
      { planId: 'mffu-50k-mini', label: '50K Mini', size: 50, evalCost: 77, activationFee: null, profitTarget: 1500, drawdown: 1000, drawdownType: 'static_eod', dailyLossLimit: 500, minTradingDays: 2, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 77, consistencyRule: 'No single trading day should exceed 30% of total profits' },
      { planId: 'mffu-50k-std', label: '50K Standard', size: 50, evalCost: 107, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1000, minTradingDays: 2, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 107, consistencyRule: 'No single trading day should exceed 30% of total profits' },
      { planId: 'mffu-50k-fast', label: '50K Fast Payout', size: 50, evalCost: 125.60, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1000, minTradingDays: 2, daysToPayout: 1, maxFundedAccounts: 5, resetFee: 125.60, consistencyRule: 'No single trading day should exceed 30% of total profits' },
      { planId: 'mffu-100k-std', label: '100K Standard', size: 100, evalCost: 214, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: 2000, minTradingDays: 2, daysToPayout: 1, maxFundedAccounts: 5, resetFee: 214, consistencyRule: 'No single trading day should exceed 30% of total profits' },
      { planId: 'mffu-150k-std', label: '150K Standard', size: 150, evalCost: 278, activationFee: null, profitTarget: 9000, drawdown: 4500, drawdownType: 'static_eod', dailyLossLimit: 3000, minTradingDays: 2, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 278, consistencyRule: 'No single trading day should exceed 30% of total profits' },
    ],
  },

  // ─── Lucid Trading ────────────────────────────────────────────────────────
  {
    firmName: 'Lucid Trading',
    prefixes: ['LUCID', 'LFF'],
    description: 'EOD drawdown. One-time fee (no subscriptions). 90/10 profit split. Free activation. LucidPro, LucidFlex, and LucidDirect plans. Max 5 funded accounts.',
    plans: [
      // ── LucidPro Eval (higher cost, stricter drawdown, DLL included) ──
      { planId: 'lucid-25k-pro', label: '25K Pro Eval', size: 25, evalCost: 135, activationFee: null, profitTarget: 1250, drawdown: 1000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 90, consistencyRule: '' },
      { planId: 'lucid-50k-pro', label: '50K Pro Eval', size: 50, evalCost: 185, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1200, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 120, consistencyRule: '' },
      { planId: 'lucid-100k-pro', label: '100K Pro Eval', size: 100, evalCost: 285, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: 1800, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 180, consistencyRule: '' },
      { planId: 'lucid-150k-pro', label: '150K Pro Eval', size: 150, evalCost: 370, activationFee: null, profitTarget: 9000, drawdown: 4500, drawdownType: 'static_eod', dailyLossLimit: 2700, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 245, consistencyRule: '' },
      // ── LucidFlex Eval (lower cost, no DLL, 50% consistency in eval) ──
      { planId: 'lucid-25k-flex', label: '25K Flex Eval', size: 25, evalCost: 100, activationFee: null, profitTarget: 1250, drawdown: 1000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 60, consistencyRule: '50% consistency in eval. No consistency once funded.' },
      { planId: 'lucid-50k-flex', label: '50K Flex Eval', size: 50, evalCost: 130, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 85, consistencyRule: '50% consistency in eval. No consistency once funded.' },
      { planId: 'lucid-100k-flex', label: '100K Flex Eval', size: 100, evalCost: 225, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 140, consistencyRule: '50% consistency in eval. No consistency once funded.' },
      { planId: 'lucid-150k-flex', label: '150K Flex Eval', size: 150, evalCost: 345, activationFee: null, profitTarget: 9000, drawdown: 4500, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 225, consistencyRule: '50% consistency in eval. No consistency once funded.' },
      // ── LucidDirect (straight to funded — no eval) ──
      { planId: 'lucid-25k-direct', label: '25K Direct', size: 25, evalCost: null, activationFee: 340, profitTarget: null, drawdown: 1000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '20% consistency rule' },
      { planId: 'lucid-50k-direct', label: '50K Direct', size: 50, evalCost: null, activationFee: 520, profitTarget: null, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1200, minTradingDays: 5, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '20% consistency rule. DLL above initial trail: 60% of peak EOD balance' },
      { planId: 'lucid-100k-direct', label: '100K Direct', size: 100, evalCost: null, activationFee: 700, profitTarget: null, drawdown: 3500, drawdownType: 'static_eod', dailyLossLimit: 2100, minTradingDays: 5, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '20% consistency rule. DLL above initial trail: 60% of peak EOD balance' },
      { planId: 'lucid-150k-direct', label: '150K Direct', size: 150, evalCost: null, activationFee: 840, profitTarget: null, drawdown: 5000, drawdownType: 'static_eod', dailyLossLimit: 3000, minTradingDays: 5, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '20% consistency rule. DLL above initial trail: 60% of peak EOD balance' },
    ],
  },

  // ─── TradeDay ─────────────────────────────────────────────────────────────
  {
    firmName: 'TradeDay',
    prefixes: ['TD'],
    description: '1-step subscription eval. 30% consistency rule. 80-95% profit split. Day trading only (CME futures). Free reset on renewal.',
    plans: [
      { planId: 'td-50k-intraday', label: '50K Intraday', size: 50, evalCost: 75, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_intraday', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 99, consistencyRule: 'No single day profit > 30% of total profit goal' },
      { planId: 'td-50k-static', label: '50K Static', size: 50, evalCost: 99, activationFee: null, profitTarget: 1500, drawdown: 500, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 99, consistencyRule: 'No single day profit > 30% of total profit goal' },
      { planId: 'td-50k-eod', label: '50K EOD', size: 50, evalCost: 105, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 99, consistencyRule: 'No single day profit > 30% of total profit goal' },
      { planId: 'td-100k-intraday', label: '100K Intraday', size: 100, evalCost: 120, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_intraday', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 99, consistencyRule: 'No single day profit > 30% of total profit goal' },
      { planId: 'td-100k-static', label: '100K Static', size: 100, evalCost: 150, activationFee: null, profitTarget: 2500, drawdown: 750, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 6, maxFundedAccounts: 1, resetFee: 99, consistencyRule: 'No single day profit > 30% of total profit goal' },
      { planId: 'td-100k-eod', label: '100K EOD', size: 100, evalCost: 165, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 99, consistencyRule: 'No single day profit > 30% of total profit goal' },
      { planId: 'td-150k-intraday', label: '150K Intraday', size: 150, evalCost: 180, activationFee: null, profitTarget: 9000, drawdown: 4000, drawdownType: 'static_intraday', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 99, consistencyRule: 'No single day profit > 30% of total profit goal' },
      { planId: 'td-150k-static', label: '150K Static', size: 150, evalCost: 210, activationFee: null, profitTarget: 3750, drawdown: 1000, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 99, consistencyRule: 'No single day profit > 30% of total profit goal' },
      { planId: 'td-150k-eod', label: '150K EOD', size: 150, evalCost: 225, activationFee: null, profitTarget: 9000, drawdown: 4000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 99, consistencyRule: 'No single day profit > 30% of total profit goal' },
    ],
  },

  // ─── Bulenox ──────────────────────────────────────────────────────────────
  {
    firmName: 'Bulenox',
    prefixes: ['BLX'],
    description: 'Trailing drawdown. Competitive pricing.',
    plans: [
      { planId: 'blx-10k', label: '10K', size: 10, evalCost: 49, activationFee: null, profitTarget: 750, drawdown: 550, drawdownType: 'trailing', dailyLossLimit: 250, minTradingDays: 1, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 49, consistencyRule: '' },
      { planId: 'blx-25k', label: '25K', size: 25, evalCost: 59, activationFee: null, profitTarget: 1500, drawdown: 1500, drawdownType: 'trailing', dailyLossLimit: 625, minTradingDays: 1, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 59, consistencyRule: '' },
      { planId: 'blx-50k', label: '50K', size: 50, evalCost: 79, activationFee: null, profitTarget: 3000, drawdown: 2750, drawdownType: 'trailing', dailyLossLimit: 1250, minTradingDays: 1, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 79, consistencyRule: '' },
      { planId: 'blx-100k', label: '100K', size: 100, evalCost: 129, activationFee: null, profitTarget: 5000, drawdown: 5000, drawdownType: 'trailing', dailyLossLimit: 2500, minTradingDays: 1, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 129, consistencyRule: '' },
    ],
  },

  // ─── Earn2Trade ────────────────────────────────────────────────────────────
  {
    firmName: 'Earn2Trade',
    prefixes: ['E2T'],
    description: 'Trader Career Path (TCP) program. EOD trailing drawdown. $139 activation deducted from first payout. Free reset on renewal.',
    plans: [
      { planId: 'e2t-tcp25', label: 'TCP 25K', size: 25, evalCost: 150, activationFee: 139, profitTarget: 1750, drawdown: 1500, drawdownType: 'trailing_eod', dailyLossLimit: 550, minTradingDays: 10, daysToPayout: 14, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'No single day > 30% of total net profit' },
      { planId: 'e2t-tcp50', label: 'TCP 50K', size: 50, evalCost: 200, activationFee: 139, profitTarget: 3000, drawdown: 2000, drawdownType: 'trailing_eod', dailyLossLimit: 1100, minTradingDays: 10, daysToPayout: 14, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'No single day > 30% of total net profit' },
      { planId: 'e2t-tcp100', label: 'TCP 100K', size: 100, evalCost: 250, activationFee: 139, profitTarget: 6000, drawdown: 3500, drawdownType: 'trailing_eod', dailyLossLimit: 2200, minTradingDays: 10, daysToPayout: 14, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'No single day > 30% of total net profit' },
    ],
  },

  // ─── Leeloo Trading ────────────────────────────────────────────────────────
  {
    firmName: 'Leeloo Trading',
    prefixes: ['LEELOO'],
    description: 'Rising trailing drawdown (LTMAB). Swing trading allowed. No daily loss limit. PA fee: $88/mo or $250 one-time.',
    plans: [
      // ── Aspire (monthly subscription) ──
      { planId: 'leeloo-25k-aspire', label: '25K Aspire', size: 25, evalCost: 250, activationFee: null, profitTarget: 1500, drawdown: 1500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'PA: No single day > 30% of net profit from starting balance' },
      { planId: 'leeloo-50k-launch', label: '50K Launch', size: 50, evalCost: 50, activationFee: null, profitTarget: 3000, drawdown: 2500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'PA: No single day > 30% of net profit from starting balance' },
      // ── Kickstart (popular — monthly subscription) ──
      { planId: 'leeloo-75k-kickstart', label: 'Kickstart 75K', size: 75, evalCost: 75, activationFee: null, profitTarget: 4500, drawdown: 2750, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: 85, consistencyRule: 'PA: No single day > 30% of net profit from starting balance' },
      // ── Express (14-day non-recurring) ──
      { planId: 'leeloo-100k-express', label: 'Express 100K', size: 100, evalCost: 77, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'PA: No single day > 30% of net profit from starting balance' },
      { planId: 'leeloo-150k', label: '150K', size: 150, evalCost: 150, activationFee: null, profitTarget: 9000, drawdown: 5000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'PA: No single day > 30% of net profit from starting balance' },
      { planId: 'leeloo-250k', label: '250K', size: 250, evalCost: 250, activationFee: null, profitTarget: 15000, drawdown: 6500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'PA: No single day > 30% of net profit from starting balance' },
    ],
  },

  // ─── OneUp Trader ─────────────────────────────────────────────────────────
  {
    firmName: 'OneUp Trader',
    prefixes: ['ONEUP'],
    description: '1-step eval. Trailing drawdown stops at starting balance. 90% profit split (100% of first $10K). No daily loss limit. 50% upfront, 50% when funded.',
    plans: [
      { planId: 'oneup-25k', label: '25K', size: 25, evalCost: 65, activationFee: null, profitTarget: 1500, drawdown: 1500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 10, daysToPayout: 14, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'Sum of 3 best days net profit must be >= 80% of single best day' },
      { planId: 'oneup-50k', label: '50K', size: 50, evalCost: 125, activationFee: null, profitTarget: 3000, drawdown: 2500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 10, daysToPayout: 14, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'Sum of 3 best days net profit must be >= 80% of single best day' },
      { planId: 'oneup-100k', label: '100K', size: 100, evalCost: 195, activationFee: null, profitTarget: 6000, drawdown: 3500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 10, daysToPayout: 14, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'Sum of 3 best days net profit must be >= 80% of single best day' },
      { planId: 'oneup-150k', label: '150K', size: 150, evalCost: 295, activationFee: null, profitTarget: 9000, drawdown: 5000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 10, daysToPayout: 14, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'Sum of 3 best days net profit must be >= 80% of single best day' },
      { planId: 'oneup-250k', label: '250K', size: 250, evalCost: 395, activationFee: null, profitTarget: 15000, drawdown: 5500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 10, daysToPayout: 14, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'Sum of 3 best days net profit must be >= 80% of single best day' },
    ],
  },

  // ─── UProfit ───────────────────────────────────────────────────────────────
  {
    firmName: 'UProfit',
    prefixes: ['UPROF'],
    description: 'Trailing drawdown. Competitive fees.',
    plans: [
      { planId: 'uprof-25k', label: '25K', size: 25, evalCost: 45, activationFee: null, profitTarget: 1500, drawdown: 1500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 45, consistencyRule: '' },
      { planId: 'uprof-50k', label: '50K', size: 50, evalCost: 79, activationFee: null, profitTarget: 3000, drawdown: 2500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 79, consistencyRule: '' },
      { planId: 'uprof-100k', label: '100K', size: 100, evalCost: 129, activationFee: null, profitTarget: 6000, drawdown: 4000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 129, consistencyRule: '' },
      { planId: 'uprof-200k', label: '200K', size: 200, evalCost: 199, activationFee: null, profitTarget: 12000, drawdown: 7000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 199, consistencyRule: '' },
    ],
  },

  // ─── Elite Trader Funding ─────────────────────────────────────────────────
  {
    firmName: 'Elite Trader Funding',
    prefixes: ['ETF'],
    description: 'Static drawdown. Straightforward rules.',
    plans: [
      { planId: 'etf-25k', label: '25K', size: 25, evalCost: 75, activationFee: null, profitTarget: 1500, drawdown: 1500, drawdownType: 'static_eod', dailyLossLimit: 750, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 75, consistencyRule: '' },
      { planId: 'etf-50k', label: '50K', size: 50, evalCost: 120, activationFee: null, profitTarget: 3000, drawdown: 2500, drawdownType: 'static_eod', dailyLossLimit: 1250, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 120, consistencyRule: '' },
      { planId: 'etf-100k', label: '100K', size: 100, evalCost: 195, activationFee: null, profitTarget: 6000, drawdown: 4000, drawdownType: 'static_eod', dailyLossLimit: 2000, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 195, consistencyRule: '' },
      { planId: 'etf-200k', label: '200K', size: 200, evalCost: 350, activationFee: null, profitTarget: 12000, drawdown: 7000, drawdownType: 'static_eod', dailyLossLimit: 3500, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 350, consistencyRule: '' },
    ],
  },



  // ─── DayTraders.com ────────────────────────────────────────────────────────
  {
    firmName: 'DayTraders.com',
    prefixes: ['DT'],
    description: '100% profit split. $130 activation fee. Trail, Static, and S2F (instant funded) accounts. ONYX platform (Rithmic + TradingView).',
    plans: [
      // ── Trail Accounts (intraday trailing drawdown) ──
      { planId: 'dt-25k-trail', label: '25K Trail', size: 25, evalCost: 249, activationFee: 130, profitTarget: 1500, drawdown: 1500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 2, daysToPayout: 7, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day > 50% of total profit. Min qualifying day profit: $100' },
      { planId: 'dt-50k-trail', label: '50K Trail', size: 50, evalCost: 379, activationFee: 130, profitTarget: 3000, drawdown: 2500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 2, daysToPayout: 7, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day > 50% of total profit. Min qualifying day profit: $200' },
      { planId: 'dt-300k-trail', label: '300K Trail', size: 300, evalCost: 879, activationFee: 130, profitTarget: 15000, drawdown: 7000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 2, daysToPayout: 7, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day > 50% of total profit. Min qualifying day profit: $400' },
      // ── Static Accounts ──
      { planId: 'dt-50k-static', label: '50K Static', size: 50, evalCost: 200, activationFee: 130, profitTarget: 3750, drawdown: 1000, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 2, daysToPayout: 7, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day > 50% of total profit. Min qualifying day profit: $200' },
      { planId: 'dt-100k-static', label: '100K Static', size: 100, evalCost: 325, activationFee: 130, profitTarget: 5750, drawdown: 1500, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 2, daysToPayout: 7, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day > 50% of total profit. Min qualifying day profit: $300' },
      { planId: 'dt-150k-static', label: '150K Static', size: 150, evalCost: 400, activationFee: 130, profitTarget: 6750, drawdown: 1750, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 2, daysToPayout: 7, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day > 50% of total profit. Min qualifying day profit: $300' },
      // ── S2F (Straight to Funded — no eval) ──
      { planId: 'dt-25k-s2f', label: '25K S2F', size: 25, evalCost: null, activationFee: 285, profitTarget: null, drawdown: 1000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 10, daysToPayout: 7, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'No single day > 20% of total profit. Min qualifying day profit: $100' },
      { planId: 'dt-50k-s2f', label: '50K S2F', size: 50, evalCost: null, activationFee: 570, profitTarget: null, drawdown: 2500, drawdownType: 'static_eod', dailyLossLimit: 1250, minTradingDays: 10, daysToPayout: 7, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'No single day > 20% of total profit. Min qualifying day profit: $200' },
      { planId: 'dt-150k-s2f', label: '150K S2F', size: 150, evalCost: null, activationFee: 825, profitTarget: null, drawdown: 6000, drawdownType: 'static_eod', dailyLossLimit: 3750, minTradingDays: 10, daysToPayout: 7, maxFundedAccounts: 3, resetFee: null, consistencyRule: 'No single day > 20% of total profit. Min qualifying day profit: $300' },
    ],
  },


  // ─── Custom / Other ────────────────────────────────────────────────────────
  {
    firmName: 'Custom / Other',
    prefixes: [],
    description: 'Configure your own rules for any firm not listed.',
    plans: [
      { planId: 'custom-50k', label: '50K Custom', size: 50, evalCost: null, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1000, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 1, resetFee: null, consistencyRule: '' },
      { planId: 'custom-100k', label: '100K Custom', size: 100, evalCost: null, activationFee: null, profitTarget: 6000, drawdown: 4000, drawdownType: 'static_eod', dailyLossLimit: 2000, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 1, resetFee: null, consistencyRule: '' },
    ],
  },
]

// ── Fee Schedule ──────────────────────────────────────────────────────────────

// Per-side fee rates (verified from real Tradovate account)
// Full-size contracts: $1.99/contract/side
// Micro contracts: $0.20/contract/side
export const DEFAULT_FEE_SCHEDULE: Record<string, number> = {
  ES: 1.99, MES: 0.20, NQ: 1.99, MNQ: 0.20, YM: 1.99, MYM: 0.20,
  RTY: 1.99, M2K: 0.20, CL: 1.99, MCL: 0.20, GC: 1.99, MGC: 0.20,
  SI: 1.99, ZB: 1.99, ZN: 1.99, ZC: 1.99, ZS: 1.99, ZW: 1.99,
  '6E': 1.99, '6J': 1.99,
}

// ── App Settings ──────────────────────────────────────────────────────────────

export interface AppSettings {
  activeAccountId: string
  currency: string
  timezone: string
  defaultContracts: number
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  feeSchedule: Record<string, number>
  autoFees: boolean
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface DailyStats {
  date: string
  sessionDate: string
  totalPnl: number
  totalFees: number
  netPnl: number
  tradeCount: number
  winCount: number
  lossCount: number
  winRate: number
  largestWin: number
  largestLoss: number
}

export interface AnalyticsData {
  totalTrades: number
  winCount: number
  lossCount: number
  winRate: number
  profitFactor: number
  netPnl: number
  grossProfit: number
  grossLoss: number
  avgWin: number
  avgLoss: number
  avgRR: number
  bestDay: number
  worstDay: number
  maxDrawdown: number
  maxDrawdownPct: number
  currentStreak: number
  longestWinStreak: number
  longestLossStreak: number
  avgTradesPerDay: number
  totalFees: number
  sharpeRatio: number
  recoveryFactor: number
  consistency: number
  score: number
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  category?: 'mindset' | 'analysis' | 'risk' | 'technical'
}

export interface DailyChecklist {
  sessionDate: string
  items: ChecklistItem[]
  readiness: number   // 1-5
  savedAt: string
}
