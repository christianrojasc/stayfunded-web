import { Trade } from './types'
import { v4 as uuidv4 } from 'uuid'
import { getSettings } from './storage'

interface ParseResult {
  trades: Trade[]
  errors: string[]
  skipped: number
  detectedFirm?: string
  detectedAccountNumber?: string
}

// Tradovate contract specs (point value per contract)
const CONTRACT_SPECS: Record<string, number> = {
  ES: 50, MES: 5, NQ: 20, MNQ: 2, YM: 5, MYM: 0.5,
  RTY: 50, M2K: 5, CL: 1000, MCL: 100, GC: 100, MGC: 10,
  SI: 5000, ZB: 1000, ZN: 1000, ZC: 50, ZS: 50, ZW: 50,
  '6E': 125000, '6J': 12500000,
}

// Account prefix → firm name detection (longest prefix first to avoid false matches)
const ACCOUNT_FIRM_PREFIXES: { prefix: string; firm: string }[] = [
  { prefix: 'APEX',    firm: 'Apex Trader Funding' },
  { prefix: 'MFFU',   firm: 'My Funded Futures' },
  { prefix: 'FTDFYSLD', firm: 'Tradeify' },
  { prefix: 'FTDFYG', firm: 'Tradeify' },
  { prefix: 'FTDFYL', firm: 'Tradeify' },
  { prefix: 'TDFYSL', firm: 'Tradeify' },
  { prefix: 'FTDFY', firm: 'Tradeify' },
  { prefix: 'TDYG',  firm: 'Tradeify' },
  { prefix: 'TDYS',  firm: 'Tradeify' },
  { prefix: 'TDY',   firm: 'Tradeify' },
  { prefix: 'FTD',   firm: 'Tradeify' },
  { prefix: 'TPT',    firm: 'Take Profit Trader' },
  { prefix: 'FFN',    firm: 'Funded Futures Network' },
  { prefix: 'LEGENDS',firm: 'Legends Trading' },
  { prefix: 'LUCID',  firm: 'Lucid Trading' },
  { prefix: 'WRBX',   firm: 'WarBux' },
  { prefix: 'LEELOO', firm: 'Leeloo Trading' },
  { prefix: 'ONEUP',  firm: 'OneUp Trader' },
  { prefix: 'UPROF',  firm: 'UProfit' },
  { prefix: 'FIVE',   firm: 'The5ers' },
  { prefix: 'E2T',    firm: 'Earn2Trade' },
  { prefix: 'ETF',    firm: 'Elite Trader Funding' },
  { prefix: 'FTMO',   firm: 'FTMO' },
  { prefix: 'FTDF',   firm: 'Funded Trading Plus' },  // FTDF is shared — ask user
  { prefix: 'FTP',    firm: 'Funded Trading Plus' },
  { prefix: 'FTT',    firm: 'FastTrack Trading' },
  { prefix: 'FN',     firm: 'Funded Next' },
  { prefix: 'BLX',    firm: 'Bulenox' },
  { prefix: 'BLUSKY', firm: 'BluSky Trading' },
  { prefix: 'DT',     firm: 'DayTraders.com' },
  // TopStep and TradeDay are tricky — TS could clash, TD could clash with TDY
  { prefix: 'TS',     firm: 'TopStep' },
  { prefix: 'TD',     firm: 'TradeDay' },
  { prefix: 'LFF',    firm: 'Lucid Trading' },
]

export function detectFirmFromAccount(accountSpec: string): { firm: string; accountNumber: string } | null {
  if (!accountSpec) return null
  const upper = accountSpec.trim().toUpperCase()
  for (const { prefix, firm } of ACCOUNT_FIRM_PREFIXES) {
    if (upper.startsWith(prefix)) {
      return { firm, accountNumber: accountSpec.trim() }
    }
  }
  // Unknown firm prefix — still return the account number so the wizard shows
  if (accountSpec.trim().length >= 6) {
    return { firm: 'Unknown Firm', accountNumber: accountSpec.trim() }
  }
  return null
}

function getFeePerSide(sym: string): number {
  try {
    const settings = getSettings()
    const schedule = settings.feeSchedule
    return schedule[sym] ?? 0
  } catch {
    return 0
  }
}

function calcAutoFees(sym: string, contracts: number): number {
  const feePerSide = getFeePerSide(sym)
  if (!feePerSide) return 0
  // 2 sides per round-trip (entry + exit)
  return parseFloat((feePerSide * 2 * contracts).toFixed(2))
}

function isAutoFeesEnabled(): boolean {
  try {
    const settings = getSettings()
    return settings.autoFees !== false
  } catch {
    return true
  }
}

function getBaseSymbol(sym: string): string {
  // Strip expiration codes: ESH24 -> ES, NQZ23 -> NQ
  return sym.replace(/[A-Z]\d{2}$/, '').replace(/\d+$/, '')
}

/**
 * Get the trading session date for a given timestamp.
 * Futures sessions run 6:00 PM – 5:00 PM Eastern Time (EST/EDT).
 * A trade at 8 PM ET belongs to the NEXT calendar day's session.
 * Uses Intl.DateTimeFormat with America/New_York to handle DST correctly
 * for all users regardless of their browser's local timezone.
 */
function getFuturesSessionDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr.split('T')[0] || dateStr

    // Get wall-clock hour in Eastern Time (handles DST automatically)
    const estParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d)

    const get = (type: string) => parseInt(
      estParts.find(p => p.type === type)?.value ?? '0', 10
    )
    const estHour = get('hour') === 24 ? 0 : get('hour')
    let year  = get('year')
    let month = get('month') - 1  // 0-indexed
    let day   = get('day')

    // Session date = the date the session ENDS (at 5PM).
    // Trades at or after 6PM ET → session ends next day at 5PM → bump to next day.
    // Trades before 6PM ET → session ends same day at 5PM → keep same day.
    if (estHour >= 18) {
      const next = new Date(Date.UTC(year, month, day + 1))
      year  = next.getUTCFullYear()
      month = next.getUTCMonth()
      day   = next.getUTCDate()
    }

    // Skip to Monday if the resulting session date falls on a weekend
    const probe = new Date(Date.UTC(year, month, day))
    const dow = probe.getUTCDay()
    if (dow === 6) { // Saturday → Monday
      probe.setUTCDate(probe.getUTCDate() + 2)
    } else if (dow === 0) { // Sunday → Monday
      probe.setUTCDate(probe.getUTCDate() + 1)
    }

    const y  = probe.getUTCFullYear()
    const mm = String(probe.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(probe.getUTCDate()).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  } catch {
    return dateStr.split('T')[0] || dateStr
  }
}

// Format 1: Tradovate Account Statement CSV
// Columns: Account,Date/Time,Buy/Sell,Qty,Symbol,Expiry,Strike,Type,Price,Exec. Broker,Comm,Fees,Closed P&L
function parseTradovateStatement(rows: string[][]): ParseResult {
  const trades: Trade[] = []
  const errors: string[] = []
  let skipped = 0
  let detectedFirm: string | undefined
  let detectedAccountNumber: string | undefined

  const header = rows[0].map(h => h.trim().toLowerCase())
  const col = (name: string) => header.findIndex(h => h.includes(name))

  const colAccount = col('account')
  const colDate = col('date')
  const colSide = col('buy')
  const colQty = col('qty')
  const colSym = col('symbol')
  const colPrice = col('price')
  const colComm = col('comm')
  const colFees = col('fees')
  const colPnl = col('closed')

  if (colDate === -1 || colSym === -1) {
    return { trades: [], errors: ['Unrecognized CSV format'], skipped: 0 }
  }

  const autoFees = isAutoFeesEnabled()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 5 || !row[colSym]) { skipped++; continue }

    try {
      const rawSym = row[colSym]?.trim() || ''
      const sym = getBaseSymbol(rawSym)
      const side = row[colSide]?.trim().toLowerCase().includes('buy') ? 'Long' : 'Short'
      const qty = parseInt(row[colQty] || '1')
      const price = parseFloat(row[colPrice] || '0')
      const comm = parseFloat(row[colComm] || '0')
      const csvFees = parseFloat(row[colFees] || '0')
      const pnl = parseFloat(row[colPnl] || '0')
      const dateRaw = row[colDate]?.trim() || ''
      const date = dateRaw.split('T')[0] || dateRaw.split(' ')[0]

      // Account detection
      if (colAccount !== -1 && !detectedFirm) {
        const acct = row[colAccount]?.trim() || ''
        const detected = detectFirmFromAccount(acct)
        if (detected) {
          detectedFirm = detected.firm
          detectedAccountNumber = detected.accountNumber
        }
      }

      if (!sym || isNaN(price)) { skipped++; continue }
      if (isNaN(pnl)) { skipped++; continue }

      const csvTotalFees = (isNaN(comm) ? 0 : comm) + (isNaN(csvFees) ? 0 : csvFees)
      const autoCalcFees = autoFees ? calcAutoFees(sym, qty) : 0
      const totalFees = autoCalcFees > 0 ? autoCalcFees : csvTotalFees
      const sessionDate = getFuturesSessionDate(dateRaw)

      trades.push({
        id: uuidv4(),
        date,
        sessionDate,
        symbol: sym,
        side,
        contracts: qty,
        entryPrice: price,
        exitPrice: price,
        pnl,
        fees: totalFees,
        netPnl: parseFloat((pnl - totalFees).toFixed(2)),
        status: 'closed',
        notes: '',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e}`)
    }
  }

  return { trades, errors, skipped, detectedFirm, detectedAccountNumber }
}

// Format 2: Tradovate Trades Export CSV
// Columns: accountSpec,name,contractName,orderId,fillId,action,qty,price,fees,profitAndLoss,commissions,tradeTime,openClose,expiration,strike,right
function parseTradovateTradesExport(rows: string[][]): ParseResult {
  const trades: Trade[] = []
  const errors: string[] = []
  let skipped = 0
  let detectedFirm: string | undefined
  let detectedAccountNumber: string | undefined

  const header = rows[0].map(h => h.trim().toLowerCase())
  const col = (name: string) => header.findIndex(h => h.includes(name))

  const colAccountSpec = col('accountspec')
  const colSym = col('contractname')
  const colAction = col('action')
  const colQty = col('qty')
  const colPrice = col('price')
  const colFees = col('fee')
  const colComm = col('commission')
  const colPnl = col('profitandloss')
  const colTime = col('tradetime')
  const colOpenClose = col('openclose')

  if (colSym === -1 || colAction === -1) {
    return parseTradovateStatement(rows) // fallback
  }

  const autoFees = isAutoFeesEnabled()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 5 || !row[colSym]) { skipped++; continue }

    try {
      const rawSym = row[colSym]?.trim() || ''
      const sym = getBaseSymbol(rawSym)
      const action = row[colAction]?.trim().toLowerCase()

      // Account detection
      if (colAccountSpec !== -1 && !detectedFirm) {
        const acct = row[colAccountSpec]?.trim() || ''
        const detected = detectFirmFromAccount(acct)
        if (detected) {
          detectedFirm = detected.firm
          detectedAccountNumber = detected.accountNumber
        }
      }

      // Only process closing trades to capture P&L
      if (colOpenClose !== -1) {
        const oc = row[colOpenClose]?.trim().toLowerCase()
        if (oc === 'open') { skipped++; continue }
      }

      const side = action.includes('buy') ? 'Long' : 'Short'
      const qty = parseInt(row[colQty] || '1')
      const price = parseFloat(row[colPrice] || '0')
      const fees = parseFloat(row[colFees] || '0')
      const comm = parseFloat(row[colComm] || '0')
      const pnl = parseFloat(row[colPnl] || '0')
      const timeRaw = row[colTime]?.trim() || ''

      if (!sym || isNaN(pnl)) { skipped++; continue }

      const csvTotalFees = (isNaN(fees) ? 0 : fees) + (isNaN(comm) ? 0 : comm)
      const autoCalcFees = autoFees ? calcAutoFees(sym, qty) : 0
      const totalFees = autoCalcFees > 0 ? autoCalcFees : csvTotalFees
      const date = timeRaw.split('T')[0] || timeRaw.split(' ')[0]
      const sessionDate = getFuturesSessionDate(timeRaw)
      const entryTime = timeRaw.includes('T') ? timeRaw.split('T')[1]?.slice(0, 5) : undefined

      trades.push({
        id: uuidv4(),
        date,
        sessionDate,
        symbol: sym,
        side,
        contracts: qty,
        entryPrice: price,
        exitPrice: price,
        pnl,
        fees: totalFees,
        netPnl: parseFloat((pnl - totalFees).toFixed(2)),
        entryTime,
        status: 'closed',
        notes: '',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e}`)
    }
  }

  return { trades, errors, skipped, detectedFirm, detectedAccountNumber }
}

// Sanitize a CSV cell to prevent formula injection (=, +, -, @, \t, \r)
function sanitizeCell(val: string): string {
  const trimmed = val.trim()
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return trimmed.replace(/^[=+\-@\t\r]+/, '')
  }
  return trimmed
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let cur = ''
  let inQuote = false
  let row: string[] = []

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (ch === '"') {
      if (inQuote && next === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      row.push(cur); cur = ''
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && next === '\n') i++
      row.push(cur); cur = ''
      if (row.some(c => c.trim())) rows.push(row)
      row = []
    } else {
      cur += ch
    }
  }
  if (cur || row.length) { row.push(cur); if (row.some(c => c.trim())) rows.push(row) }
  // Sanitize all cells against CSV injection
  return rows.map(r => r.map(sanitizeCell))
}

// Format 3: Tradovate Orders Export CSV
// Columns: orderId,Account,Order ID,B/S,Contract,Product,...,avgPrice,filledQty,Fill Time,...,Status,...
// No P&L column — must pair entries/exits and compute P&L via FIFO
function parseTradovateOrders(rows: string[][]): ParseResult {
  const trades: Trade[] = []
  const errors: string[] = []
  let skipped = 0
  let detectedFirm: string | undefined
  let detectedAccountNumber: string | undefined

  const header = rows[0].map(h => h.trim().toLowerCase())
  const col = (name: string) => header.findIndex(h => h.trim() === name)

  const colBS = col('b/s')
  const colProduct = col('product')
  const colAvgPrice = col('avgprice')
  const colFilledQty = col('filledqty')
  const colFillTime = col('fill time')
  const colStatus = col('status')
  const colTimestamp = col('timestamp')
  const colText = col('text')
  const colDecimalFillAvg = col('decimalfillavg')
  const colAccount = col('account')
  const colOrderId = col('orderid')

  if (colBS === -1 || colProduct === -1 || colStatus === -1) {
    return { trades: [], errors: ['Unrecognized Tradovate Orders format'], skipped: 0 }
  }

  const autoFees = isAutoFeesEnabled()

  // Collect filled orders
  interface Fill {
    side: 'Buy' | 'Sell'
    symbol: string
    qty: number
    price: number
    time: string
    text: string
    orderId: string
  }

  const fills: Fill[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 5) { skipped++; continue }

    const status = (row[colStatus] || '').trim()
    if (status !== 'Filled') { skipped++; continue }

    // Account detection from any row
    if (colAccount !== -1 && !detectedFirm) {
      const acct = row[colAccount]?.trim() || ''
      const detected = detectFirmFromAccount(acct)
      if (detected) {
        detectedFirm = detected.firm
        detectedAccountNumber = detected.accountNumber
      }
    }

    const sideRaw = (row[colBS] || '').trim()
    const side = sideRaw.includes('Buy') ? 'Buy' as const : 'Sell' as const
    const symbol = (row[colProduct] || '').trim()
    const price = parseFloat(row[colDecimalFillAvg] || row[colAvgPrice] || '0')
    const orderId = (colOrderId !== -1 ? row[colOrderId]?.trim() : '') || ''
    const qty = parseInt(row[colFilledQty] || '1')
    const time = (row[colFillTime] || row[colTimestamp] || '').trim()
    const text = (row[colText] || '').trim()

    if (!symbol || isNaN(price) || price === 0 || qty === 0) { skipped++; continue }

    fills.push({ side, symbol, qty, price, time, text, orderId })
  }

  // FIFO position matching per symbol
  const positions: Record<string, { side: 'Buy' | 'Sell'; price: number; qty: number; time: string; orderId: string }[]> = {}

  for (const fill of fills) {
    const sym = fill.symbol
    if (!positions[sym]) positions[sym] = []

    const pos = positions[sym]
    const pointValue = CONTRACT_SPECS[sym] || 20

    // Check if this fill closes existing position (opposite side)
    if (pos.length > 0 && pos[0].side !== fill.side) {
      let remaining = fill.qty
      while (remaining > 0 && pos.length > 0 && pos[0].side !== fill.side) {
        const entry = pos[0]
        const matched = Math.min(remaining, entry.qty)

        // Calculate P&L
        let pnl: number
        if (entry.side === 'Buy') {
          // Was long, closing with sell
          pnl = (fill.price - entry.price) * matched * pointValue
        } else {
          // Was short, closing with buy
          pnl = (entry.price - fill.price) * matched * pointValue
        }

        const entryDate = entry.time.split(' ')[0] || entry.time
        const sessionDate = getFuturesSessionDate(entry.time)

        // Parse dates for display
        let dateStr = ''
        try {
          const parts = entryDate.split('/')
          if (parts.length === 3) {
            const m = parts[0].padStart(2, '0')
            const d = parts[1].padStart(2, '0')
            const y = parts[2].length === 2 ? '20' + parts[2] : parts[2]
            dateStr = `${y}-${m}-${d}`
          } else {
            dateStr = entryDate
          }
        } catch { dateStr = entryDate }

        // Auto-calculate fees for this matched trade
        const fees = autoFees ? calcAutoFees(sym, matched) : 0

        // Extract HH:MM:SS from fill times e.g. "03/01/2026 20:26:51"
        const entryTimePart = entry.time.includes(' ') ? entry.time.split(' ')[1] : undefined
        const exitTimePart = fill.time.includes(' ') ? fill.time.split(' ')[1] : undefined

        trades.push({
          id: uuidv4(),
          date: dateStr,
          sessionDate,
          symbol: sym,
          side: entry.side === 'Buy' ? 'Long' : 'Short',
          contracts: matched,
          entryPrice: entry.price,
          exitPrice: fill.price,
          entryTime: entryTimePart,
          exitTime: exitTimePart,
          pnl: parseFloat(pnl.toFixed(2)),
          fees,
          netPnl: parseFloat((pnl - fees).toFixed(2)),
          status: 'closed',
          orderId: `${entry.orderId}-${fill.orderId}`,
          notes: fill.text === 'AutoLiq' ? 'Auto-liquidated' : '',
          tags: fill.text === 'AutoLiq' ? ['autoliq'] : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        remaining -= matched
        entry.qty -= matched
        if (entry.qty <= 0) pos.shift()
      }

      // If remaining, this fill also opens a new position
      if (remaining > 0) {
        pos.push({ side: fill.side, price: fill.price, qty: remaining, time: fill.time, orderId: fill.orderId })
      }
    } else {
      // Same side or empty — add to position
      pos.push({ side: fill.side, price: fill.price, qty: fill.qty, time: fill.time, orderId: fill.orderId })
    }
  }

  return { trades, errors, skipped, detectedFirm, detectedAccountNumber }
}

export function parseTradovateCSV(text: string): ParseResult {
  const rows = parseCSV(text)
  if (rows.length < 2) return { trades: [], errors: ['Empty or invalid CSV'], skipped: 0 }

  const header = rows[0].map(h => h.trim().toLowerCase()).join(',')

  // Format 3: Orders export (has b/s, product, status columns)
  if (header.includes('b/s') && header.includes('product') && header.includes('status')) {
    return parseTradovateOrders(rows)
  }
  // Format 2: Trades export
  if (header.includes('contractname') || header.includes('tradetime') || header.includes('openclose')) {
    return parseTradovateTradesExport(rows)
  }
  // Format 1: Account statement
  return parseTradovateStatement(rows)
}

export type { ParseResult }
