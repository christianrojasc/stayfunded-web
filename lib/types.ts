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

  // ─── FTMO ─────────────────────────────────────────────────────────────────
  {
    firmName: 'FTMO',
    prefixes: ['FTMO', 'FTDF'],
    description: 'Two-phase evaluation. Static EOD drawdown. Industry standard.',
    plans: [
      { planId: 'ftmo-10k', label: '10K', size: 10, evalCost: 155, activationFee: null, profitTarget: 1000, drawdown: 1000, drawdownType: 'static_eod', dailyLossLimit: 500, minTradingDays: 4, daysToPayout: 14, maxFundedAccounts: 3, resetFee: 155, consistencyRule: 'No specific single-day cap; trade freely within limits' },
      { planId: 'ftmo-25k', label: '25K', size: 25, evalCost: 250, activationFee: null, profitTarget: 2500, drawdown: 2500, drawdownType: 'static_eod', dailyLossLimit: 1250, minTradingDays: 4, daysToPayout: 14, maxFundedAccounts: 3, resetFee: 250, consistencyRule: 'No specific single-day cap; trade freely within limits' },
      { planId: 'ftmo-50k', label: '50K', size: 50, evalCost: 345, activationFee: null, profitTarget: 5000, drawdown: 5000, drawdownType: 'static_eod', dailyLossLimit: 2500, minTradingDays: 4, daysToPayout: 14, maxFundedAccounts: 3, resetFee: 345, consistencyRule: 'No specific single-day cap; trade freely within limits' },
      { planId: 'ftmo-100k', label: '100K', size: 100, evalCost: 540, activationFee: null, profitTarget: 10000, drawdown: 10000, drawdownType: 'static_eod', dailyLossLimit: 5000, minTradingDays: 4, daysToPayout: 14, maxFundedAccounts: 3, resetFee: 540, consistencyRule: 'No specific single-day cap; trade freely within limits' },
      { planId: 'ftmo-200k', label: '200K', size: 200, evalCost: 1080, activationFee: null, profitTarget: 20000, drawdown: 20000, drawdownType: 'static_eod', dailyLossLimit: 10000, minTradingDays: 4, daysToPayout: 14, maxFundedAccounts: 3, resetFee: 1080, consistencyRule: 'No specific single-day cap; trade freely within limits' },
    ],
  },

  // ─── Funded Futures Network ────────────────────────────────────────────────
  {
    firmName: 'Funded Futures Network',
    prefixes: ['FFN'],
    description: 'Static EOD drawdown. Fast 3-day payouts. Multiple size/speed options.',
    plans: [
      { planId: 'ffn-25k-a', label: '25K Classic', size: 25, evalCost: 62.50, activationFee: null, profitTarget: 2000, drawdown: 1500, drawdownType: 'static_eod', dailyLossLimit: 750, minTradingDays: 7, daysToPayout: 3, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'ffn-25k-b', label: '25K Express', size: 25, evalCost: 77.50, activationFee: null, profitTarget: 2000, drawdown: 1500, drawdownType: 'static_eod', dailyLossLimit: 750, minTradingDays: 4, daysToPayout: 3, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'ffn-50k-a', label: '50K Classic', size: 50, evalCost: 75, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1000, minTradingDays: 7, daysToPayout: 3, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'ffn-50k-b', label: '50K Express', size: 50, evalCost: 87.50, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1000, minTradingDays: 4, daysToPayout: 3, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'ffn-100k-a', label: '100K Classic', size: 100, evalCost: 152.50, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: 1500, minTradingDays: 7, daysToPayout: 3, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'ffn-100k-b', label: '100K Express', size: 100, evalCost: 165, activationFee: null, profitTarget: 6000, drawdown: 3600, drawdownType: 'static_eod', dailyLossLimit: 1800, minTradingDays: 4, daysToPayout: 3, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'ffn-150k-a', label: '150K Classic', size: 150, evalCost: 175, activationFee: null, profitTarget: 9000, drawdown: 5000, drawdownType: 'static_eod', dailyLossLimit: 2500, minTradingDays: 7, daysToPayout: 3, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'ffn-150k-b', label: '150K Express', size: 150, evalCost: 190, activationFee: null, profitTarget: 9000, drawdown: 5000, drawdownType: 'static_eod', dailyLossLimit: 2500, minTradingDays: 4, daysToPayout: 3, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'ffn-250k-a', label: '250K Classic', size: 250, evalCost: 290, activationFee: null, profitTarget: 15000, drawdown: 6000, drawdownType: 'static_eod', dailyLossLimit: 3000, minTradingDays: 7, daysToPayout: 3, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'ffn-250k-b', label: '250K Express', size: 250, evalCost: 345, activationFee: null, profitTarget: 15000, drawdown: 6000, drawdownType: 'static_eod', dailyLossLimit: 3000, minTradingDays: 4, daysToPayout: 3, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
    ],
  },

  // ─── Legends Trading ──────────────────────────────────────────────────────
  {
    firmName: 'Legends Trading',
    prefixes: ['LEGENDS'],
    description: 'Static EOD. Instant funded options available. 7-day payouts.',
    plans: [
      { planId: 'legends-25k', label: '25K Instant', size: 25, evalCost: null, activationFee: 83.30, profitTarget: 1500, drawdown: 1250, drawdownType: 'static_eod', dailyLossLimit: 625, minTradingDays: 3, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '' },
      { planId: 'legends-50k-eval', label: '50K Evaluation', size: 50, evalCost: 41.30, activationFee: 99, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1000, minTradingDays: 1, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 36, consistencyRule: '' },
      { planId: 'legends-50k-instant', label: '50K Instant', size: 50, evalCost: null, activationFee: 105.70, profitTarget: 2700, drawdown: 2200, drawdownType: 'static_eod', dailyLossLimit: 1100, minTradingDays: 3, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '' },
      { planId: 'legends-100k-eval', label: '100K Evaluation', size: 100, evalCost: 74.90, activationFee: 129, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: 1500, minTradingDays: 1, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 65, consistencyRule: '' },
      { planId: 'legends-100k-instant', label: '100K Instant', size: 100, evalCost: null, activationFee: 158.90, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: 1500, minTradingDays: 3, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '' },
      { planId: 'legends-150k-eval', label: '150K Evaluation', size: 150, evalCost: 96.60, activationFee: 149, profitTarget: 9000, drawdown: 4000, drawdownType: 'static_eod', dailyLossLimit: 2000, minTradingDays: 1, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 83, consistencyRule: '' },
      { planId: 'legends-150k-instant', label: '150K Instant', size: 150, evalCost: null, activationFee: 242.90, profitTarget: 9000, drawdown: 4500, drawdownType: 'static_eod', dailyLossLimit: 2250, minTradingDays: 3, daysToPayout: 5, maxFundedAccounts: 5, resetFee: null, consistencyRule: '' },
    ],
  },

  // ─── Lucid Trading ────────────────────────────────────────────────────────
  {
    firmName: 'Lucid Trading',
    prefixes: ['LUCID', 'LFF'],
    description: 'Static EOD. Instant funded options. Competitive pricing.',
    plans: [
      { planId: 'lucid-25k', label: '25K Standard', size: 25, evalCost: 50, activationFee: null, profitTarget: 1250, drawdown: 1000, drawdownType: 'static_eod', dailyLossLimit: 500, minTradingDays: 2, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 60, consistencyRule: '' },
      { planId: 'lucid-25k-instant', label: '25K Instant', size: 25, evalCost: null, activationFee: 60, profitTarget: 1250, drawdown: 1000, drawdownType: 'static_eod', dailyLossLimit: 500, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 75, consistencyRule: '' },
      { planId: 'lucid-50k', label: '50K Standard', size: 50, evalCost: 65, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1000, minTradingDays: 2, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 85, consistencyRule: '' },
      { planId: 'lucid-50k-instant', label: '50K Instant', size: 50, evalCost: null, activationFee: 80, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1000, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 100, consistencyRule: '' },
      { planId: 'lucid-100k', label: '100K Standard', size: 100, evalCost: 112.50, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: 1500, minTradingDays: 2, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 140, consistencyRule: '' },
      { planId: 'lucid-100k-instant', label: '100K Instant', size: 100, evalCost: null, activationFee: 137.50, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: 1500, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 170, consistencyRule: '' },
      { planId: 'lucid-150k', label: '150K Standard', size: 150, evalCost: 172, activationFee: null, profitTarget: 9000, drawdown: 4500, drawdownType: 'static_eod', dailyLossLimit: 2250, minTradingDays: 2, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 225, consistencyRule: '' },
      { planId: 'lucid-150k-instant', label: '150K Instant', size: 150, evalCost: null, activationFee: 185, profitTarget: 9000, drawdown: 4500, drawdownType: 'static_eod', dailyLossLimit: 2250, minTradingDays: 1, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 225, consistencyRule: '' },
    ],
  },

  // ─── TradeDay ─────────────────────────────────────────────────────────────
  {
    firmName: 'TradeDay',
    prefixes: ['TD'],
    description: 'Multiple drawdown types. Same-day payout. Fast funding.',
    plans: [
      { planId: 'td-50k-intraday', label: '50K Intraday', size: 50, evalCost: 75, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_intraday', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 75, consistencyRule: '' },
      { planId: 'td-50k-static', label: '50K Static', size: 50, evalCost: 99, activationFee: null, profitTarget: 1500, drawdown: 500, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 99, consistencyRule: '' },
      { planId: 'td-50k-eod', label: '50K EOD', size: 50, evalCost: 105, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 99, consistencyRule: '' },
      { planId: 'td-100k-intraday', label: '100K Intraday', size: 100, evalCost: 120, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_intraday', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 119, consistencyRule: '' },
      { planId: 'td-100k-static', label: '100K Static', size: 100, evalCost: 150, activationFee: null, profitTarget: 2500, drawdown: 750, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 6, maxFundedAccounts: 1, resetFee: 119, consistencyRule: '' },
      { planId: 'td-100k-eod', label: '100K EOD', size: 100, evalCost: 165, activationFee: null, profitTarget: 6000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 119, consistencyRule: '' },
      { planId: 'td-150k-intraday', label: '150K Intraday', size: 150, evalCost: 180, activationFee: null, profitTarget: 9000, drawdown: 4000, drawdownType: 'static_intraday', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 139, consistencyRule: '' },
      { planId: 'td-150k-static', label: '150K Static', size: 150, evalCost: 210, activationFee: null, profitTarget: 3750, drawdown: 1000, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 139, consistencyRule: '' },
      { planId: 'td-150k-eod', label: '150K EOD', size: 150, evalCost: 225, activationFee: null, profitTarget: 9000, drawdown: 4000, drawdownType: 'static_eod', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 1, maxFundedAccounts: 6, resetFee: 139, consistencyRule: '' },
    ],
  },

  // ─── WarBux ────────────────────────────────────────────────────────────────
  {
    firmName: 'WarBux',
    prefixes: ['WRBX'],
    description: 'Crypto/futures hybrid. Static drawdown. Fast payouts.',
    plans: [
      { planId: 'wrbx-5k', label: '5K', size: 5, evalCost: 40, activationFee: null, profitTarget: 500, drawdown: 200, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 4, daysToPayout: 4, maxFundedAccounts: 1, resetFee: 40, consistencyRule: '' },
      { planId: 'wrbx-10k', label: '10K', size: 10, evalCost: 90, activationFee: null, profitTarget: 1000, drawdown: 400, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 4, daysToPayout: 4, maxFundedAccounts: 1, resetFee: 90, consistencyRule: '' },
      { planId: 'wrbx-25k', label: '25K', size: 25, evalCost: 200, activationFee: null, profitTarget: 2500, drawdown: 1000, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 4, daysToPayout: 4, maxFundedAccounts: 1, resetFee: 200, consistencyRule: '' },
      { planId: 'wrbx-50k', label: '50K', size: 50, evalCost: 390, activationFee: null, profitTarget: 5000, drawdown: 2000, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 4, daysToPayout: 4, maxFundedAccounts: 1, resetFee: 390, consistencyRule: '' },
      { planId: 'wrbx-100k', label: '100K', size: 100, evalCost: 730, activationFee: null, profitTarget: 10000, drawdown: 4000, drawdownType: 'static', dailyLossLimit: null, minTradingDays: 4, daysToPayout: 4, maxFundedAccounts: 1, resetFee: 730, consistencyRule: '' },
    ],
  },

  // ─── The5ers ───────────────────────────────────────────────────────────────
  {
    firmName: 'The5ers',
    prefixes: ['FIVE'],
    description: 'Scaling plan. Static EOD. No time limit for evaluation.',
    plans: [
      { planId: 'five-20k', label: '20K Low Risk', size: 20, evalCost: 95, activationFee: null, profitTarget: 1200, drawdown: 500, drawdownType: 'static_eod', dailyLossLimit: 200, minTradingDays: 3, daysToPayout: 14, maxFundedAccounts: 10, resetFee: 75, consistencyRule: 'No single trade may risk more than 1% of account balance' },
      { planId: 'five-100k', label: '100K Bootcamp', size: 100, evalCost: 285, activationFee: null, profitTarget: 8000, drawdown: 4000, drawdownType: 'static_eod', dailyLossLimit: 1500, minTradingDays: 3, daysToPayout: 14, maxFundedAccounts: 5, resetFee: 285, consistencyRule: 'No single trade may risk more than 2% of account balance' },
    ],
  },

  // ─── Funded Next ──────────────────────────────────────────────────────────
  {
    firmName: 'Funded Next',
    prefixes: ['FN'],
    description: 'Express and Standard evaluation models. Crypto & futures.',
    plans: [
      { planId: 'fn-25k', label: '25K', size: 25, evalCost: 59, activationFee: null, profitTarget: 2500, drawdown: 1500, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 80, consistencyRule: 'No single day should exceed 50% of the profit target' },
      { planId: 'fn-50k', label: '50K', size: 50, evalCost: 89, activationFee: null, profitTarget: 5000, drawdown: 3000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 120, consistencyRule: 'No single day should exceed 50% of the profit target' },
      { planId: 'fn-100k', label: '100K', size: 100, evalCost: 149, activationFee: null, profitTarget: 10000, drawdown: 5000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 200, consistencyRule: 'No single day should exceed 50% of the profit target' },
      { planId: 'fn-200k', label: '200K', size: 200, evalCost: 249, activationFee: null, profitTarget: 20000, drawdown: 8000, drawdownType: 'trailing', dailyLossLimit: null, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 350, consistencyRule: 'No single day should exceed 50% of the profit target' },
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
    description: 'Gauntlet Mini program. Trailing drawdown. Educational focus.',
    plans: [
      { planId: 'e2t-25k', label: '25K Gauntlet Mini', size: 25, evalCost: 150, activationFee: null, profitTarget: 1500, drawdown: 1500, drawdownType: 'trailing', dailyLossLimit: 500, minTradingDays: 15, daysToPayout: 14, maxFundedAccounts: 3, resetFee: 75, consistencyRule: 'Must trade at least 15 days; minimum 3 wins required' },
      { planId: 'e2t-50k', label: '50K Gauntlet Mini', size: 50, evalCost: 245, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'trailing', dailyLossLimit: 1000, minTradingDays: 15, daysToPayout: 14, maxFundedAccounts: 3, resetFee: 120, consistencyRule: 'Must trade at least 15 days; minimum 3 wins required' },
    ],
  },

  // ─── Leeloo Trading ────────────────────────────────────────────────────────
  {
    firmName: 'Leeloo Trading',
    prefixes: ['LEELOO'],
    description: 'Trailing and static options. All account sizes. Subscription-based.',
    plans: [
      { planId: 'leeloo-25k', label: '25K', size: 25, evalCost: 25, activationFee: null, profitTarget: 1750, drawdown: 1500, drawdownType: 'trailing', dailyLossLimit: 750, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day should represent more than 30% of total profits' },
      { planId: 'leeloo-50k', label: '50K', size: 50, evalCost: 50, activationFee: null, profitTarget: 3000, drawdown: 2500, drawdownType: 'trailing', dailyLossLimit: 1250, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day should represent more than 30% of total profits' },
      { planId: 'leeloo-100k', label: '100K', size: 100, evalCost: 100, activationFee: null, profitTarget: 6000, drawdown: 4500, drawdownType: 'trailing', dailyLossLimit: 2250, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day should represent more than 30% of total profits' },
      { planId: 'leeloo-150k', label: '150K', size: 150, evalCost: 150, activationFee: null, profitTarget: 9000, drawdown: 6000, drawdownType: 'trailing', dailyLossLimit: 3000, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day should represent more than 30% of total profits' },
      { planId: 'leeloo-250k', label: '250K', size: 250, evalCost: 250, activationFee: null, profitTarget: 15000, drawdown: 6500, drawdownType: 'trailing', dailyLossLimit: 3250, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: 'No single day should represent more than 30% of total profits' },
    ],
  },

  // ─── OneUp Trader ─────────────────────────────────────────────────────────
  {
    firmName: 'OneUp Trader',
    prefixes: ['ONEUP'],
    description: 'Trailing drawdown. Subscription model. Simple rules.',
    plans: [
      { planId: 'oneup-25k', label: '25K', size: 25, evalCost: 25, activationFee: null, profitTarget: 1500, drawdown: 1500, drawdownType: 'trailing', dailyLossLimit: 500, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: '' },
      { planId: 'oneup-50k', label: '50K', size: 50, evalCost: 50, activationFee: null, profitTarget: 3000, drawdown: 2500, drawdownType: 'trailing', dailyLossLimit: 1000, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: '' },
      { planId: 'oneup-100k', label: '100K', size: 100, evalCost: 100, activationFee: null, profitTarget: 6000, drawdown: 3500, drawdownType: 'trailing', dailyLossLimit: 2000, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: '' },
      { planId: 'oneup-150k', label: '150K', size: 150, evalCost: 150, activationFee: null, profitTarget: 9000, drawdown: 4500, drawdownType: 'trailing', dailyLossLimit: 3000, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 5, resetFee: null, consistencyRule: '' },
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

  // ─── Funded Trading Plus ───────────────────────────────────────────────────
  {
    firmName: 'Funded Trading Plus',
    prefixes: ['FTP', 'FTDF'],
    description: 'Multiple program tiers. Global reach.',
    plans: [
      { planId: 'ftp-25k', label: '25K', size: 25, evalCost: 99, activationFee: null, profitTarget: 2500, drawdown: 1500, drawdownType: 'static_eod', dailyLossLimit: 750, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 3, resetFee: 99, consistencyRule: '' },
      { planId: 'ftp-50k', label: '50K', size: 50, evalCost: 155, activationFee: null, profitTarget: 5000, drawdown: 3000, drawdownType: 'static_eod', dailyLossLimit: 1500, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 3, resetFee: 155, consistencyRule: '' },
      { planId: 'ftp-100k', label: '100K', size: 100, evalCost: 255, activationFee: null, profitTarget: 10000, drawdown: 5000, drawdownType: 'static_eod', dailyLossLimit: 2500, minTradingDays: 5, daysToPayout: 14, maxFundedAccounts: 3, resetFee: 255, consistencyRule: '' },
    ],
  },

  // ─── BluSky Trading ───────────────────────────────────────────────────────
  {
    firmName: 'BluSky Trading',
    prefixes: ['BLUSKY'],
    description: 'Simple evaluation rules. Static EOD drawdown.',
    plans: [
      { planId: 'blusky-25k', label: '25K', size: 25, evalCost: 69, activationFee: null, profitTarget: 1500, drawdown: 1250, drawdownType: 'static_eod', dailyLossLimit: 625, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 69, consistencyRule: '' },
      { planId: 'blusky-50k', label: '50K', size: 50, evalCost: 99, activationFee: null, profitTarget: 3000, drawdown: 2500, drawdownType: 'static_eod', dailyLossLimit: 1250, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 99, consistencyRule: '' },
      { planId: 'blusky-100k', label: '100K', size: 100, evalCost: 175, activationFee: null, profitTarget: 6000, drawdown: 4000, drawdownType: 'static_eod', dailyLossLimit: 2000, minTradingDays: 5, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 175, consistencyRule: '' },
    ],
  },

  // ─── DayTraders.com ────────────────────────────────────────────────────────
  {
    firmName: 'DayTraders.com',
    prefixes: ['DT'],
    description: 'Community-focused prop firm. EOD drawdown.',
    plans: [
      { planId: 'dt-25k', label: '25K', size: 25, evalCost: 59, activationFee: null, profitTarget: 1500, drawdown: 1250, drawdownType: 'static_eod', dailyLossLimit: 625, minTradingDays: 3, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 59, consistencyRule: '' },
      { planId: 'dt-50k', label: '50K', size: 50, evalCost: 99, activationFee: null, profitTarget: 3000, drawdown: 2000, drawdownType: 'static_eod', dailyLossLimit: 1000, minTradingDays: 3, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 99, consistencyRule: '' },
      { planId: 'dt-100k', label: '100K', size: 100, evalCost: 159, activationFee: null, profitTarget: 6000, drawdown: 3500, drawdownType: 'static_eod', dailyLossLimit: 1750, minTradingDays: 3, daysToPayout: 7, maxFundedAccounts: 5, resetFee: 159, consistencyRule: '' },
    ],
  },

  // ─── FastTrack Trading ────────────────────────────────────────────────────
  {
    firmName: 'FastTrack Trading',
    prefixes: ['FTT'],
    description: 'Fast-pass evaluation. Static EOD.',
    plans: [
      { planId: 'ftt-25k', label: '25K', size: 25, evalCost: 79, activationFee: null, profitTarget: 1500, drawdown: 1500, drawdownType: 'static_eod', dailyLossLimit: 750, minTradingDays: 3, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 79, consistencyRule: '' },
      { planId: 'ftt-50k', label: '50K', size: 50, evalCost: 125, activationFee: null, profitTarget: 3000, drawdown: 2500, drawdownType: 'static_eod', dailyLossLimit: 1250, minTradingDays: 3, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 125, consistencyRule: '' },
      { planId: 'ftt-100k', label: '100K', size: 100, evalCost: 199, activationFee: null, profitTarget: 6000, drawdown: 4000, drawdownType: 'static_eod', dailyLossLimit: 2000, minTradingDays: 3, daysToPayout: 5, maxFundedAccounts: 5, resetFee: 199, consistencyRule: '' },
    ],
  },

  // ─── TradeDay ─────────────────────────────────────────────────────────────
  // (Note: TradeDay prefix TD could conflict with TDY/Tradeify but prefix match is left-anchored)

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
