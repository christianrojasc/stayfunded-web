import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

/*
 * Run in Supabase SQL Editor:
 * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
 * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
 */

// Fail hard if service role key is missing — never fall back to anon key
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceKey) {
  console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY is not set')
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceKey || 'missing',
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  // Fail hard if webhook secret is missing — never accept unsigned payloads
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('FATAL: STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (userId) {
        await supabaseAdmin.from('profiles').update({
          plan: 'pro',
          stripe_customer_id: session.customer as string,
        }).eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      await supabaseAdmin.from('profiles').update({ plan: 'free' }).eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const plan = sub.status === 'active' ? 'pro' : 'free'
      await supabaseAdmin.from('profiles').update({ plan }).eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
