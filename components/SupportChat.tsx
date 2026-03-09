'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

interface Message {
  id: string
  ticket_id: string
  role: 'user' | 'admin'
  message: string
  created_at: string
  user_name?: string
}

interface Ticket {
  id: string
  status: string
  created_at: string
  updated_at: string
}

export default function SupportChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load existing conversations
  useEffect(() => {
    if (!user) return
    fetch('/api/support')
      .then(r => r.json())
      .then(data => {
        setTickets(data.tickets || [])
        setMessages(data.messages || [])
        if (data.tickets?.length > 0) {
          setActiveTicketId(data.tickets[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])



  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), ticketId: activeTicketId }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, data.message])
        if (!activeTicketId) setActiveTicketId(data.ticket_id)
      }
      setInput('')
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }

  const filteredMessages = activeTicketId
    ? messages.filter(m => (m as any).ticket_id === activeTicketId)
    : messages

  const activeTicket = tickets.find(t => t.id === activeTicketId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#4ADE80] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Contact Support</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Send us a message and we&apos;ll get back to you as soon as possible.</p>
      </div>

      {/* Status badge */}
      {activeTicket && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeTicket.status === 'open' ? 'bg-[#4ADE80]' : activeTicket.status === 'pending' ? 'bg-yellow-400' : 'bg-[var(--text-muted)]'}`} />
          <span className="text-xs text-[var(--text-secondary)] capitalize">{activeTicket.status} ticket</span>
          <span className="text-xs text-[var(--text-muted)]">·</span>
          <Clock size={12} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">
            {new Date(activeTicket.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* Chat area */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        {/* Messages */}
        <div ref={scrollRef} className="h-[360px] overflow-y-auto p-5 space-y-4">
          {filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center">
                <MessageCircle size={24} className="text-[#4ADE80]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Start a conversation</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs">
                  Describe your issue or question below. Our support team typically responds within a few hours.
                </p>
              </div>
            </div>
          )}

          {filteredMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? '' : ''}`}>
                {msg.role === 'admin' && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-[#4ADE80]/20 flex items-center justify-center">
                      <CheckCircle2 size={10} className="text-[#4ADE80]" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#4ADE80]">StayFunded Support</span>
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#4ADE80] text-black'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)]'
                }`}>
                  {msg.message}
                </div>
                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'} text-[var(--text-muted)]`}>
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--border)]">
          <form
            onSubmit={e => { e.preventDefault(); handleSend() }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#4ADE80]/40 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="p-3 rounded-xl bg-[#4ADE80] text-black hover:bg-[#22C55E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <a href="mailto:support@stayfunded.app"
          className="p-3 rounded-xl border border-[var(--border)] hover:border-[#4ADE80]/30 transition-colors text-center"
          style={{ background: 'var(--bg-card)' }}>
          <p className="text-xs font-semibold text-[var(--text-primary)]">📧 Email Us</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">support@stayfunded.app</p>
        </a>
        <a href="https://x.com/StayFundedApp" target="_blank" rel="noopener noreferrer"
          className="p-3 rounded-xl border border-[var(--border)] hover:border-[#1DA1F2]/30 transition-colors text-center"
          style={{ background: 'var(--bg-card)' }}>
          <p className="text-xs font-semibold text-[var(--text-primary)]">𝕏 Twitter</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">@StayFundedApp</p>
        </a>
      </div>
    </div>
  )
}
