export function formatAccountNumber(accountNumber?: string | null): string {
  if (!accountNumber) return ''
  return accountNumber.length > 7
    ? `${accountNumber.slice(0, 3)}xxxx${accountNumber.slice(-4)}`
    : accountNumber
}

export function toYahooSymbol(symbol: string): string {
  const s = symbol.toUpperCase().replace(/H\d+|M\d+|U\d+|Z\d+/g, '')
  const map: Record<string, string> = {
    NQ: 'NQ=F', MNQ: 'MNQ=F', ES: 'ES=F', MES: 'MES=F',
    YM: 'YM=F', MYM: 'MYM=F', RTY: 'RTY=F', M2K: 'M2K=F',
    CL: 'CL=F', MCL: 'MCL=F', GC: 'GC=F', MGC: 'MGC=F',
    '6E': '6E=F', '6J': '6J=F',
  }
  return map[s] ?? `${s}=F`
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
