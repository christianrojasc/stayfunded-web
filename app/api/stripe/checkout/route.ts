import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'

// Only these price IDs are valid
const ALLOWED_PRICES = new Set([
  process.env.STRIPE_PRICE_MONTHLY,
  process.env.STRIPE_PRICE_YEARLY,
])

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate — reject anonymous requests
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate priceId against allowlist
    const { priceId } = await req.json()
    if (!priceId || !ALLOWED_PRICES.has(priceId)) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || 'https://stayfunded.app'

    // 3. Use server-authenticated user identity — never trust client-provided userId
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: user.id },
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url: `${origin}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
