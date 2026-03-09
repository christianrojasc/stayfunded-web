'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle2, Phone, Mail, Globe } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

export default function SupportChat() {
  const { user } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: user?.email || '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.message.trim() || !form.email.trim()) return
    setSending(true)
    setError('')

    try {
      const fullMessage = [
        `From: ${form.firstName} ${form.lastName}`.trim(),
        `Email: ${form.email}`,
        form.subject ? `Subject: ${form.subject}` : '',
        '',
        form.message,
      ].filter(Boolean).join('\n')

      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullMessage }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send')
      }

      setSent(true)
      setForm({ firstName: '', lastName: '', email: user?.email || '', subject: '', message: '' })
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#4ADE80]/10 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-[#4ADE80]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Message Sent!</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
          Thanks for reaching out. We&apos;ll get back to you as soon as possible — usually within 24 hours.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-[#4ADE80] bg-[#4ADE80]/10 border border-[#4ADE80]/20 hover:bg-[#4ADE80]/20 transition-colors"
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
      {/* Left — Info */}
      <div className="flex flex-col gap-8 lg:max-w-xs">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Contact Us</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Have a question, feedback, or need help with your account? We&apos;re here for you — send us a message and we&apos;ll get back to you shortly.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Contact Details</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4ADE80]/10 flex items-center justify-center flex-shrink-0">
                <Mail size={14} className="text-[#4ADE80]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Email</p>
                <a href="mailto:support@stayfunded.app" className="text-sm text-[var(--text-primary)] hover:text-[#4ADE80] transition-colors">
                  support@stayfunded.app
                </a>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4ADE80]/10 flex items-center justify-center flex-shrink-0">
                <Globe size={14} className="text-[#4ADE80]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Web</p>
                <a href="https://stayfunded.app" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-primary)] hover:text-[#4ADE80] transition-colors">
                  stayfunded.app
                </a>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1DA1F2]/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Twitter / X</p>
                <a href="https://x.com/StayFundedApp" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-primary)] hover:text-[#1DA1F2] transition-colors">
                  @StayFundedApp
                </a>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] p-6 lg:p-8 space-y-5" style={{ background: 'var(--bg-card)' }}>
          {/* Name row */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="sf-firstname" className="text-xs font-medium text-[var(--text-secondary)]">First Name</label>
              <input
                id="sf-firstname"
                type="text"
                placeholder="First Name"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#4ADE80]/40 transition-colors"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label htmlFor="sf-lastname" className="text-xs font-medium text-[var(--text-secondary)]">Last Name</label>
              <input
                id="sf-lastname"
                type="text"
                placeholder="Last Name"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#4ADE80]/40 transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="sf-email" className="text-xs font-medium text-[var(--text-secondary)]">Email <span className="text-[#EF4444]">*</span></label>
            <input
              id="sf-email"
              type="email"
              required
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#4ADE80]/40 transition-colors"
            />
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label htmlFor="sf-subject" className="text-xs font-medium text-[var(--text-secondary)]">Subject</label>
            <input
              id="sf-subject"
              type="text"
              placeholder="What's this about?"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#4ADE80]/40 transition-colors"
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label htmlFor="sf-message" className="text-xs font-medium text-[var(--text-secondary)]">Message <span className="text-[#EF4444]">*</span></label>
            <textarea
              id="sf-message"
              required
              placeholder="Type your message here..."
              rows={5}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[#4ADE80]/40 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-[#EF4444]">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!form.message.trim() || !form.email.trim() || sending}
            className="w-full h-11 rounded-xl bg-[#4ADE80] text-black font-semibold text-sm hover:bg-[#22C55E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <><Loader2 size={16} className="animate-spin" /> Sending...</>
            ) : (
              <><Send size={16} /> Send Message</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
