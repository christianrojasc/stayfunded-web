import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function getUser(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll() }, setAll() {} } }
  )
  return supabase.auth.getUser()
}

// GET — fetch user's tickets + messages
export async function GET(req: NextRequest) {
  const { data: { user } } = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's tickets
  const { data: tickets } = await adminSupabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!tickets?.length) return NextResponse.json({ tickets: [], messages: [] })

  // Get messages for all tickets
  const ticketIds = tickets.map(t => t.id)
  const { data: messages } = await adminSupabase
    .from('support_messages')
    .select('*')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: true })

  return NextResponse.json({ tickets, messages: messages || [] })
}

// POST — send a new support message
export async function POST(req: NextRequest) {
  const { data: { user } } = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, ticketId } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  let activeTicketId = ticketId

  // Create new ticket if none provided
  if (!activeTicketId) {
    const { data: ticket, error: ticketErr } = await adminSupabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.display_name || user.email?.split('@')[0],
        status: 'open',
      })
      .select('id')
      .single()

    if (ticketErr) return NextResponse.json({ error: ticketErr.message }, { status: 500 })
    activeTicketId = ticket.id
  }

  // Insert message
  const { data: msg, error: msgErr } = await adminSupabase
    .from('support_messages')
    .insert({
      ticket_id: activeTicketId,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.display_name || user.email?.split('@')[0],
      role: 'user',
      message: message.trim(),
    })
    .select()
    .single()

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 })

  // Update ticket timestamp
  await adminSupabase
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString(), status: 'open' })
    .eq('id', activeTicketId)

  return NextResponse.json({ ticket_id: activeTicketId, message: msg })
}
