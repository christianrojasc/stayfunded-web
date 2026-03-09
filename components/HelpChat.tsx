'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircleQuestion, X, Send, ChevronRight, ArrowLeft, Search, Home, MessageSquare, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

// ── Knowledge Base ───────────────────────────────────────────────────────────

interface FAQ {
  q: string
  a: string
  keywords: string[]
}

const CATEGORIES = [
  {
    label: 'Getting Started',
    icon: '🚀',
    faqs: [
      { q: 'How do I import my trades?', a: 'Go to the Import page from the sidebar. Upload your Tradovate CSV export file — we support both the "Trade Log" and "Order History" formats. Your trades will be automatically parsed with correct P&L calculations.', keywords: ['import', 'csv', 'tradovate', 'upload', 'trades'] },
      { q: 'How do I create a prop firm account?', a: 'Go to Accounts → click "New Account". Select your prop firm from the list, choose your plan size, and set your account details. We have presets for 20+ firms including Apex, Tradeify, TopStep, and more.', keywords: ['account', 'prop', 'firm', 'create', 'new', 'add'] },
      { q: 'What are session dates?', a: 'Futures markets run from 6 PM EST (Sunday) to 5 PM EST (Friday). A "session date" groups trades by this schedule — so trades after 6 PM belong to the next day\'s session. This is how prop firms track your daily P&L.', keywords: ['session', 'date', '6pm', '5pm', 'futures', 'time'] },
    ],
  },
  {
    label: 'Accounts & Rules',
    icon: '📋',
    faqs: [
      { q: 'How does drawdown tracking work?', a: 'We track both trailing and static drawdowns based on your prop firm\'s rules. The trailing drawdown floor locks at your starting balance + $100 once you profit enough. You\'ll see it on your Trading Growth Curve and Account Health section.', keywords: ['drawdown', 'trailing', 'static', 'floor', 'loss'] },
      { q: 'What\'s the daily loss limit?', a: 'Each prop firm has a daily loss limit (usually $1,000-$2,500 depending on account size). We track your daily P&L against this limit in real-time. You\'ll see alerts when approaching the limit.', keywords: ['daily', 'loss', 'limit', 'alert'] },
      { q: 'How many accounts can I have?', a: 'Free plan: up to 3 accounts. Pro plan: unlimited accounts. Track evaluation, funded, and sim accounts all in one place.', keywords: ['accounts', 'limit', 'free', 'pro', 'how many'] },
      { q: 'Can I track multiple prop firms?', a: 'Yes! Create a separate account for each prop firm/evaluation. Use the account selector to switch between them, or select "All Accounts" for combined stats.', keywords: ['multiple', 'firms', 'switch', 'accounts'] },
    ],
  },
  {
    label: 'Features',
    icon: '✨',
    faqs: [
      { q: 'What is the Trading Growth Curve?', a: 'Your equity curve showing balance over time with drawdown floor and profit target overlaid. Green = balance, red dashed = drawdown floor, green dashed = profit target. Updates automatically as you add trades.', keywords: ['growth', 'curve', 'equity', 'chart', 'balance'] },
      { q: 'How does the journal work?', a: 'The Journal groups trades by session date. Click any day to see detailed stats, add notes, review trades, and track rule compliance. Click individual trades to see charts and running P&L.', keywords: ['journal', 'notes', 'daily', 'review'] },
      { q: 'What are AI Insights?', a: 'AI Insights analyzes your trading patterns — best/worst times, instrument performance, behavioral patterns, and "what-if" scenarios. Available on Pro plan.', keywords: ['insights', 'ai', 'patterns', 'analysis'] },
      { q: 'How does the checklist work?', a: 'Create trading rules (e.g., "Check economic calendar", "Set stop loss"), check them off each day. Consistency is tracked on the Progress page heatmap.', keywords: ['checklist', 'rules', 'daily', 'routine'] },
    ],
  },
  {
    label: 'Pro Plan',
    icon: '👑',
    faqs: [
      { q: 'What\'s included in Pro?', a: 'Pro unlocks: unlimited accounts, AI Trade Insights, trade charts with candlestick data. Everything else is free forever — dashboard, analytics, journal, calendar, progress tracker, CSV import.', keywords: ['pro', 'plan', 'features', 'upgrade'] },
      { q: 'How much does Pro cost?', a: '$14/month or $99/year (save 41%). No commitment — cancel anytime. Payments processed through Stripe.', keywords: ['price', 'cost', 'monthly', 'yearly'] },
      { q: 'Can I cancel anytime?', a: 'Yes — cancel from Settings → Subscription. You keep Pro access until the end of your billing period.', keywords: ['cancel', 'subscription', 'billing'] },
    ],
  },
  {
    label: 'Troubleshooting',
    icon: '🔧',
    faqs: [
      { q: 'My CSV import isn\'t working', a: 'Export from Tradovate → Reports → Trade Log → Export as CSV. We support both "Trade Log" and "Order History" formats. Check date format is MM/DD/YYYY.', keywords: ['csv', 'import', 'error', 'not working'] },
      { q: 'My P&L numbers look wrong', a: 'P&L uses contract specs (ES=$50/pt, NQ=$20/pt, MES=$5/pt). Check: 1) Right symbol detected? 2) Fees included? Toggle auto-fees in Settings.', keywords: ['pnl', 'wrong', 'numbers', 'calculation'] },
      { q: 'How do I contact support?', a: 'Go to Settings → Contact Us to send a message directly to our team. You can also email support@stayfunded.app.', keywords: ['support', 'contact', 'email', 'help'] },
    ],
  },
]

const POPULAR_ARTICLES = [
  { q: 'How do I import my trades?', category: 'Getting Started' },
  { q: 'How does drawdown tracking work?', category: 'Accounts & Rules' },
  { q: 'What\'s included in Pro?', category: 'Pro Plan' },
  { q: 'My CSV import isn\'t working', category: 'Troubleshooting' },
]

const ALL_FAQS: FAQ[] = CATEGORIES.flatMap(c => c.faqs)

function searchFAQs(query: string): FAQ[] {
  const q = query.toLowerCase()
  const scored = ALL_FAQS.map(faq => {
    let score = 0
    if (faq.q.toLowerCase().includes(q)) score += 3
    if (faq.a.toLowerCase().includes(q)) score += 1
    for (const kw of faq.keywords) {
      if (q.includes(kw)) score += 2
    }
    return { faq, score }
  }).filter(s => s.score > 0)
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 4).map(s => s.faq)
}

// ── Component ────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'bot'
  text: string
  faqs?: FAQ[]
}

type View = 'home' | 'category' | 'chat' | 'messages'

export default function HelpChat() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('home')
  const [selectedCat, setSelectedCat] = useState<typeof CATEGORIES[0] | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const firstName = user?.user_metadata?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const searchResults = search.trim() ? searchFAQs(search) : []

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() }
    const results = searchFAQs(input.trim())
    const botMsg: Message = results.length > 0
      ? { id: (Date.now() + 1).toString(), role: 'bot', text: 'Here\'s what I found:', faqs: results }
      : { id: (Date.now() + 1).toString(), role: 'bot', text: 'I couldn\'t find an answer for that. Go to Settings → Contact Us to reach our support team directly.' }
    setMessages(prev => [...prev, userMsg, botMsg])
    setInput('')
    setView('chat')
  }

  const handleFAQClick = (faq: FAQ) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'user', text: faq.q },
      { id: (Date.now() + 1).toString(), role: 'bot', text: faq.a },
    ])
    setView('chat')
    setSearch('')
  }

  const goHome = () => { setView('home'); setSelectedCat(null); setSearch('') }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-[#4ADE80] to-[#16A34A] text-black shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-200 flex items-center justify-center"
        >
          <MessageCircleQuestion size={24} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[100] w-[400px] h-[560px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 flex flex-col border border-[#1E293B]"
          style={{ background: '#0B0F1A' }}
        >
          {/* Header — welcome area */}
          {view === 'home' && (
            <div className="px-6 pt-6 pb-5 relative" style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #0B0F1A 100%)' }}>
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} className="text-[#94A3B8]" />
              </button>
              <p className="text-2xl font-bold text-white leading-tight">
                Hi {firstName} 👋
              </p>
              <p className="text-lg text-white/80 mt-1">How can we help?</p>
            </div>
          )}

          {/* Header — other views */}
          {view !== 'home' && (
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E293B]" style={{ background: '#0d1220' }}>
              <div className="flex items-center gap-3">
                <button onClick={view === 'chat' ? goHome : goHome} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                  <ArrowLeft size={16} className="text-[#94A3B8]" />
                </button>
                <h3 className="text-sm font-bold text-white">
                  {view === 'chat' ? 'Conversation' : view === 'category' ? selectedCat?.label : 'Messages'}
                </h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} className="text-[#94A3B8]" />
              </button>
            </div>
          )}

          {/* Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {view === 'home' && (
              <div className="p-4 space-y-3">
                {/* Ask a question CTA */}
                <button
                  onClick={() => setView('chat')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#1E293B] hover:border-[#4ADE80]/30 bg-[#0d1220] hover:bg-[#111827] transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#4ADE80]/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={18} className="text-[#4ADE80]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Ask a question</p>
                    <p className="text-xs text-[#64748B]">Our team can help</p>
                  </div>
                  <ChevronRight size={14} className="text-[#475569] group-hover:text-[#4ADE80] transition-colors" />
                </button>

                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search for help"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#1E293B] bg-[#0d1220] text-sm text-white placeholder-[#475569] outline-none focus:border-[#4ADE80]/40 transition-colors"
                  />
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    {searchResults.map(faq => (
                      <button
                        key={faq.q}
                        onClick={() => handleFAQClick(faq)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-all text-left"
                      >
                        <p className="text-sm text-[#E2E8F0] pr-2">{faq.q}</p>
                        <ChevronRight size={12} className="text-[#475569] flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular articles (show when not searching) */}
                {!search.trim() && (
                  <>
                    <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider px-1 pt-2">Popular Articles</p>
                    {POPULAR_ARTICLES.map(article => {
                      const faq = ALL_FAQS.find(f => f.q === article.q)
                      return faq ? (
                        <button
                          key={faq.q}
                          onClick={() => handleFAQClick(faq)}
                          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#1E293B] hover:border-[#334155] bg-[#0d1220] hover:bg-[#111827] transition-all text-left group"
                        >
                          <div className="pr-2">
                            <p className="text-sm font-medium text-[#E2E8F0]">{faq.q}</p>
                            <p className="text-[10px] text-[#475569] mt-0.5">{article.category}</p>
                          </div>
                          <ChevronRight size={12} className="text-[#475569] group-hover:text-[#94A3B8] flex-shrink-0 transition-colors" />
                        </button>
                      ) : null
                    })}

                    {/* Browse categories */}
                    <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider px-1 pt-2">Browse Topics</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.label}
                          onClick={() => { setSelectedCat(cat); setView('category') }}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-[#1E293B] hover:border-[#334155] bg-[#0d1220] hover:bg-[#111827] transition-all text-left"
                        >
                          <span className="text-base">{cat.icon}</span>
                          <span className="text-xs font-medium text-[#CBD5E1]">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {view === 'category' && selectedCat && (
              <div className="p-4 space-y-2">
                {selectedCat.faqs.map(faq => (
                  <button
                    key={faq.q}
                    onClick={() => handleFAQClick(faq)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.02] transition-all text-left group"
                  >
                    <p className="text-sm text-[#E2E8F0] pr-2">{faq.q}</p>
                    <ChevronRight size={12} className="text-[#475569] group-hover:text-[#94A3B8] flex-shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {view === 'chat' && (
              <div className="p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#4ADE80]/10 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare size={20} className="text-[#4ADE80]" />
                    </div>
                    <p className="text-sm font-medium text-[#E2E8F0]">How can we help?</p>
                    <p className="text-xs text-[#475569] mt-1">Type your question below</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%]">
                      {msg.role === 'bot' && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-5 h-5 rounded-full bg-[#4ADE80]/20 flex items-center justify-center">
                            <Sparkles size={9} className="text-[#4ADE80]" />
                          </div>
                          <span className="text-[10px] font-semibold text-[#4ADE80]">StayFunded</span>
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#4ADE80] text-black font-medium'
                          : 'bg-[#1E293B] text-[#E2E8F0]'
                      }`}>
                        <p>{msg.text}</p>
                        {msg.faqs && (
                          <div className="mt-2.5 space-y-1.5">
                            {msg.faqs.map(faq => (
                              <button
                                key={faq.q}
                                onClick={() => handleFAQClick(faq)}
                                className="w-full text-left p-2.5 rounded-lg bg-[#0B0F1A] hover:bg-[#131829] transition-colors border border-[#1E293B]/50"
                              >
                                <p className="text-xs text-[#4ADE80] font-medium">{faq.q}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'messages' && (
              <div className="p-4">
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center">
                    <MessageSquare size={20} className="text-[#475569]" />
                  </div>
                  <p className="text-sm text-[#94A3B8]">No messages yet</p>
                  <p className="text-xs text-[#475569]">Send us a message from Settings → Contact Us</p>
                </div>
              </div>
            )}
          </div>

          {/* Input (only in chat view) */}
          {view === 'chat' && (
            <div className="p-3 border-t border-[#1E293B]">
              <form
                onSubmit={e => { e.preventDefault(); handleSend() }}
                className="flex items-center gap-2 bg-[#131829] rounded-xl px-3.5 py-2.5 border border-[#1E293B] focus-within:border-[#4ADE80]/40 transition-colors"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#475569] outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-1.5 rounded-lg text-[#4ADE80] hover:bg-[#4ADE80]/10 transition-colors disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* Bottom tabs */}
          <div className="flex border-t border-[#1E293B]" style={{ background: '#0d1220' }}>
            <button
              onClick={goHome}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${view === 'home' || view === 'category' ? 'text-[#4ADE80]' : 'text-[#475569] hover:text-[#94A3B8]'}`}
            >
              <Home size={16} />
              <span className="text-[10px] font-semibold">Home</span>
            </button>
            <button
              onClick={() => setView('messages')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${view === 'messages' ? 'text-[#4ADE80]' : 'text-[#475569] hover:text-[#94A3B8]'}`}
            >
              <MessageSquare size={16} />
              <span className="text-[10px] font-semibold">Messages</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
