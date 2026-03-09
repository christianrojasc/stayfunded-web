'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircleQuestion, X, Send, ChevronRight, ArrowLeft } from 'lucide-react'

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
      { q: 'How does drawdown tracking work?', a: 'We track both trailing and static drawdowns based on your prop firm\'s rules. The drawdown floor updates automatically as your balance grows (trailing) or stays fixed from your starting balance (static). You\'ll see it on your Trading Growth Curve chart.', keywords: ['drawdown', 'trailing', 'static', 'floor', 'loss'] },
      { q: 'What\'s the daily loss limit?', a: 'Each prop firm has a daily loss limit (usually $1,000-$2,500 depending on account size). We track your daily P&L against this limit in real-time. You\'ll see alerts when you\'re approaching the limit on your dashboard.', keywords: ['daily', 'loss', 'limit', 'alert'] },
      { q: 'How many accounts can I have?', a: 'Free plan: up to 3 accounts. Pro plan: unlimited accounts. You can track evaluation, funded, and sim accounts all in one place.', keywords: ['accounts', 'limit', 'free', 'pro', 'how many'] },
      { q: 'Can I track multiple prop firms?', a: 'Yes! Create a separate account for each prop firm/evaluation. Use the account selector at the top to switch between them, or select "All Accounts" to see combined stats.', keywords: ['multiple', 'firms', 'switch', 'accounts'] },
    ],
  },
  {
    label: 'Features',
    icon: '✨',
    faqs: [
      { q: 'What is the Trading Growth Curve?', a: 'It\'s your equity curve showing balance over time, with your drawdown floor and profit target overlaid. Green line = your balance, red dashed = drawdown floor, green dashed = profit target. It updates automatically as you add trades.', keywords: ['growth', 'curve', 'equity', 'chart', 'balance'] },
      { q: 'How does the journal work?', a: 'The Journal groups your trades by session date. Click any day to see detailed stats, add notes, review trades, and track rule compliance. You can also click individual trades to see the chart and running P&L.', keywords: ['journal', 'notes', 'daily', 'review'] },
      { q: 'What are AI Insights?', a: 'AI Insights analyzes your trading patterns — best/worst times to trade, instrument performance, behavioral patterns, and "what-if" scenarios. It\'s available on the Pro plan and helps you find edges in your data.', keywords: ['insights', 'ai', 'patterns', 'analysis'] },
      { q: 'How does the checklist work?', a: 'The daily checklist helps you follow your trading rules before each session. Create your rules (e.g., "Check economic calendar", "Set stop loss"), and check them off each day. Your consistency is tracked on the Progress page heatmap.', keywords: ['checklist', 'rules', 'daily', 'routine', 'discipline'] },
      { q: 'What does the Progress Tracker show?', a: 'It shows your rule compliance over time with a GitHub-style heatmap, your current streak, and a weekly report card. It helps you build and maintain trading discipline.', keywords: ['progress', 'tracker', 'heatmap', 'streak', 'discipline'] },
    ],
  },
  {
    label: 'Pro Plan',
    icon: '👑',
    faqs: [
      { q: 'What\'s included in Pro?', a: 'Pro unlocks: unlimited accounts, AI Trade Insights, trade charts with candlestick data, and priority support. Everything else (dashboard, analytics, journal, calendar, progress tracker, CSV import) is free forever.', keywords: ['pro', 'plan', 'features', 'upgrade', 'price', 'cost'] },
      { q: 'How much does Pro cost?', a: 'Pro is $14/month or $99/year (save 41%). No commitment — cancel anytime. All payments are processed securely through Stripe.', keywords: ['price', 'cost', 'monthly', 'yearly', 'payment', 'stripe'] },
      { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your Pro subscription at any time from Settings → Subscription. You\'ll keep Pro access until the end of your billing period.', keywords: ['cancel', 'subscription', 'billing'] },
    ],
  },
  {
    label: 'Troubleshooting',
    icon: '🔧',
    faqs: [
      { q: 'My CSV import isn\'t working', a: 'Make sure you\'re exporting from Tradovate as CSV. Go to Tradovate → Reports → Trade Log → Export. We support both "Trade Log" and "Order History" formats. If trades look wrong, check that the date format matches (MM/DD/YYYY).', keywords: ['csv', 'import', 'error', 'not working', 'tradovate', 'format'] },
      { q: 'My P&L numbers look wrong', a: 'P&L is calculated using contract specs (ES=$50/point, NQ=$20/point, etc.). Check: 1) Is the right symbol detected? 2) Are fees included? You can toggle auto-fees in Settings. 3) For micros, the multiplier is different (MES=$5/point).', keywords: ['pnl', 'wrong', 'numbers', 'calculation', 'fees', 'incorrect'] },
      { q: 'How do I contact support?', a: 'Email us at support@stayfunded.app — we typically respond within 24 hours. You can also reach out on Twitter/X @StayFundedApp.', keywords: ['support', 'contact', 'email', 'help'] },
    ],
  },
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
  return scored.slice(0, 3).map(s => s.faq)
}

// ── Component ────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'bot'
  text: string
  faqs?: FAQ[]
}

export default function HelpChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [view, setView] = useState<'home' | 'category' | 'chat'>('home')
  const [selectedCat, setSelectedCat] = useState<typeof CATEGORIES[0] | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() }
    const results = searchFAQs(input.trim())
    const botMsg: Message = results.length > 0
      ? { id: (Date.now() + 1).toString(), role: 'bot', text: 'Here\'s what I found:', faqs: results }
      : { id: (Date.now() + 1).toString(), role: 'bot', text: 'I couldn\'t find an answer for that. Try browsing the categories or email us at support@stayfunded.app for help.' }
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
  }

  const goHome = () => { setView('home'); setSelectedCat(null) }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-200 flex items-center justify-center"
        >
          <MessageCircleQuestion size={24} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[100] w-[380px] h-[520px] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 flex flex-col border border-[#1E293B]"
          style={{ background: '#0B0F1A' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]"
            style={{ background: 'linear-gradient(135deg, #0f1629 0%, #0B0F1A 100%)' }}
          >
            <div className="flex items-center gap-3">
              {view !== 'home' && (
                <button onClick={goHome} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                  <ArrowLeft size={16} className="text-[#94A3B8]" />
                </button>
              )}
              <div>
                <h3 className="text-sm font-bold text-white">Help Center</h3>
                <p className="text-[10px] text-[#64748B]">We typically reply instantly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X size={16} className="text-[#94A3B8]" />
            </button>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {view === 'home' && (
              <div className="p-4 space-y-3">
                <p className="text-[#94A3B8] text-xs font-medium px-1">Browse topics or ask a question</p>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => { setSelectedCat(cat); setView('category') }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.02] transition-all text-left group"
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="flex-1 text-sm font-medium text-[#E2E8F0]">{cat.label}</span>
                    <ChevronRight size={14} className="text-[#475569] group-hover:text-[#94A3B8] transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {view === 'category' && selectedCat && (
              <div className="p-4 space-y-2">
                <p className="text-[#94A3B8] text-xs font-medium px-1 mb-3">{selectedCat.icon} {selectedCat.label}</p>
                {selectedCat.faqs.map(faq => (
                  <button
                    key={faq.q}
                    onClick={() => handleFAQClick(faq)}
                    className="w-full text-left p-3.5 rounded-xl border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.02] transition-all"
                  >
                    <p className="text-sm text-[#E2E8F0]">{faq.q}</p>
                  </button>
                ))}
              </div>
            )}

            {view === 'chat' && (
              <div className="p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#4ADE80] text-black font-medium'
                        : 'bg-[#1E293B] text-[#E2E8F0]'
                    }`}>
                      <p>{msg.text}</p>
                      {msg.faqs && (
                        <div className="mt-2 space-y-1.5">
                          {msg.faqs.map(faq => (
                            <button
                              key={faq.q}
                              onClick={() => handleFAQClick(faq)}
                              className="w-full text-left p-2.5 rounded-lg bg-[#0B0F1A] hover:bg-[#131829] transition-colors"
                            >
                              <p className="text-xs text-[#4ADE80] font-medium">{faq.q}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#1E293B]">
            <form
              onSubmit={e => { e.preventDefault(); handleSend() }}
              className="flex items-center gap-2 bg-[#131829] rounded-xl px-3 py-2 border border-[#1E293B] focus-within:border-[#4ADE80]/40 transition-colors"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-transparent text-sm text-white placeholder-[#475569] outline-none"
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
        </div>
      )}
    </>
  )
}
