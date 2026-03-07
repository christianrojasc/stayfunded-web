import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol') ?? 'NQ=F'
  const interval = searchParams.get('interval') ?? '1m'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

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
