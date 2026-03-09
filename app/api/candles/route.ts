import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ALLOWED_INTERVALS = new Set(['1m', '2m', '5m', '15m', '30m', '60m', '1h', '1d', '1wk', '1mo'])

export async function GET(req: NextRequest) {
  // Authenticate
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol') ?? 'NQ=F'
  const interval = searchParams.get('interval') ?? '1m'
  const from = parseInt(searchParams.get('from') ?? '0')
  const to = parseInt(searchParams.get('to') ?? '0')

  // Validate interval
  if (!ALLOWED_INTERVALS.has(interval)) {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })
  }

  // Validate timestamps
  if (isNaN(from) || isNaN(to) || from <= 0 || to <= 0) {
    return NextResponse.json({ error: 'Invalid time range' }, { status: 400 })
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&period1=${from}&period2=${to}&includePrePost=true`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      next: { revalidate: 60 }
    })
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
