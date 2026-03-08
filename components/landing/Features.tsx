"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  Clock, Shield, Upload, TrendingUp, ChevronRight, BarChart2,
  Calendar, FileText, Bell, Target, Layers, Activity, Zap,
  CheckCircle2, ArrowRight, Eye
} from "lucide-react";

/* ─── Feature Data ─── */

const mainFeatures = [
  {
    id: "sessions",
    icon: Clock,
    tag: "Futures Native",
    tagColor: "blue",
    title: "Session-Aware Tracking",
    headline: "Futures run 6 PM–5 PM EST. Your journal finally knows that.",
    description:
      "Most trading journals treat midnight as the day boundary. That's wrong for futures. StayFunded understands overnight sessions, rollover days, and CME session boundaries — so your P&L is always grouped by the correct trading day.",
    longDescription:
      "When you import a trade executed at 2:00 AM, it belongs to the previous day's session — not the new calendar day. StayFunded automatically assigns every trade to the correct session date using the 6 PM → 5 PM EST window. No manual adjustments. No wrong days on your calendar.",
    details: [
      { icon: Clock, text: "6 PM → 5 PM session boundaries (23-hour window)" },
      { icon: Calendar, text: "Calendar groups by session date, not trade date" },
      { icon: Layers, text: "Overnight, AM, and PM session breakdowns" },
      { icon: Activity, text: "Session countdown timer on dashboard" },
      { icon: BarChart2, text: "P&L breakdown per session (best/worst)" },
      { icon: Zap, text: "Auto-detects EST timezone for all calculations" },
    ],
    visual: "session",
  },
  {
    id: "compliance",
    icon: Shield,
    tag: "Risk Management",
    tagColor: "green",
    title: "Prop Firm Compliance",
    headline: "Daily loss limits, max drawdown, trailing vs static — auto-tracked.",
    description:
      "Every prop firm has different rules. Apex uses trailing drawdown. Tradeify uses static EOD with daily limits. TopStep has consistency rules. StayFunded knows them all and tracks your compliance in real-time.",
    longDescription:
      "When you create an account, StayFunded auto-fills the drawdown type, daily loss limit, profit target, and consistency rules for your specific firm and plan. As you import trades, it continuously calculates where you stand — and warns you before you cross the line.",
    details: [
      { icon: Shield, text: "Trailing, static, and EOD drawdown calculations" },
      { icon: Bell, text: "Real-time alerts when approaching limits (50%, 80%)" },
      { icon: Target, text: "Profit target progress tracking" },
      { icon: FileText, text: "Consistency rule monitoring (30% / 40% rules)" },
      { icon: Activity, text: "Daily loss limit tracking with visual bars" },
      { icon: CheckCircle2, text: "8+ prop firm presets with auto-detection" },
    ],
    visual: "compliance",
  },
  {
    id: "import",
    icon: Upload,
    tag: "Zero Manual Work",
    tagColor: "purple",
    title: "One-Click CSV Import",
    headline: "Drop your Tradovate CSV. We handle everything else.",
    description:
      "Account auto-detection, FIFO P&L matching, fee calculation, duplicate detection, session date assignment — all handled automatically in seconds. No manual entry. No spreadsheets. No errors.",
    longDescription:
      "Just export your CSV from Tradovate and drag it into StayFunded. We parse every column, match entries to exits using FIFO ordering, calculate your real P&L including commissions, detect duplicate imports, and assign each trade to the correct session date. If the account is new, we'll create it for you with the right prop firm settings.",
    details: [
      { icon: Upload, text: "Drag & drop or click to upload CSV files" },
      { icon: Layers, text: "FIFO matching for accurate entry/exit P&L" },
      { icon: Zap, text: "Auto-detect account number and prop firm" },
      { icon: Shield, text: "Duplicate trade detection (won't double-count)" },
      { icon: BarChart2, text: "Commission & fee auto-calculation" },
      { icon: CheckCircle2, text: "New account wizard if account not found" },
    ],
    visual: "import",
  },
  {
    id: "analytics",
    icon: TrendingUp,
    tag: "Visual Analytics",
    tagColor: "green",
    title: "Trading Growth Curve",
    headline: "See your equity, drawdown floor, and profit target — all in one chart.",
    description:
      "A live equity curve that overlays your drawdown floor and profit target. Watch your account grow day by day. Know exactly where you stand relative to your limits. Make decisions from data, not emotion.",
    longDescription:
      "The Trading Growth Curve is the centerpiece of your dashboard. It shows your account balance over time as a smooth line, with the drawdown floor rendered below (adjusting for trailing accounts) and your profit target above. KPI cards show net P&L, current equity, max drawdown used, and account status at a glance.",
    details: [
      { icon: TrendingUp, text: "Equity curve with daily data points" },
      { icon: Shield, text: "Drawdown floor line (trailing adjusts with highs)" },
      { icon: Target, text: "Profit target line with progress percentage" },
      { icon: Activity, text: "Win rate, avg win/loss, profit factor KPIs" },
      { icon: Eye, text: "Per-trade charts with simulated candles" },
      { icon: Calendar, text: "Calendar heatmap showing green/red days" },
    ],
    visual: "analytics",
  },
];

const additionalFeatures = [
  { icon: Calendar, title: "Trading Calendar", description: "Visual heatmap of your trading days. Green for profits, red for losses. See patterns at a glance." },
  { icon: FileText, title: "Trade Journal", description: "Add notes, screenshots, and tags to every trade. Build your playbook from experience." },
  { icon: BarChart2, title: "Performance Analytics", description: "Win rate, profit factor, avg R:R, best/worst days — all calculated automatically." },
  { icon: Layers, title: "Multi-Account Support", description: "Track multiple prop firm accounts side-by-side. Switch between them instantly." },
  { icon: Bell, title: "Smart Alerts", description: "Get notified when you're approaching drawdown limits, daily loss caps, or consistency violations." },
  { icon: Target, title: "Daily Checklist", description: "Pre-trade routine checklist to keep you disciplined. Check off items before you trade." },
  { icon: Eye, title: "Trade Charts", description: "TradingView-style charts for every trade showing entry, exit, and price action." },
  { icon: Zap, title: "Instant Setup", description: "No account required to start. Import your first CSV in under 60 seconds. Free forever." },
];

const colorMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", icon: "bg-blue-500/20 text-blue-400" },
  green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", icon: "bg-green-500/20 text-green-400" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", icon: "bg-purple-500/20 text-purple-400" },
};

/* ─── Mini Visual Components ─── */

function SessionVisual() {
  return (
    <div className="bg-[#060a12] rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] text-gray-500 font-mono">Live Session Timer</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Overnight", time: "6PM–9:30AM", pnl: "+$185", color: "text-green-400" },
          { label: "AM Session", time: "9:30AM–12PM", pnl: "+$620", color: "text-green-400" },
          { label: "PM Session", time: "12PM–5PM", pnl: "-$45", color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 text-center">
            <div className="text-[9px] text-gray-600 mb-1">{s.label}</div>
            <div className={`text-xs font-bold ${s.color}`}>{s.pnl}</div>
            <div className="text-[8px] text-gray-700 mt-1">{s.time}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between bg-white/[0.02] rounded-lg p-2">
        <span className="text-[10px] text-gray-500">Session ends in</span>
        <span className="text-xs font-mono font-bold text-green-400">04:23:17</span>
      </div>
    </div>
  );
}

function ComplianceVisual() {
  return (
    <div className="bg-[#060a12] rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-gray-500 font-mono">APEX-48291 · 100K</span>
        <span className="text-[9px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">SAFE</span>
      </div>
      {[
        { label: "Max Drawdown", used: "$847", total: "$3,000", pct: 28, color: "from-green-600 to-green-400" },
        { label: "Daily Loss", used: "$312", total: "$1,500", pct: 21, color: "from-green-600 to-green-400" },
        { label: "Profit Target", used: "$4,200", total: "$6,000", pct: 70, color: "from-blue-600 to-blue-400" },
      ].map((bar) => (
        <div key={bar.label} className="mb-3">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-gray-400">{bar.label}</span>
            <span className="text-gray-300">{bar.used} / {bar.total}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${bar.color}`} style={{ width: `${bar.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ImportVisual() {
  return (
    <div className="bg-[#060a12] rounded-2xl p-4 border border-white/5">
      <div className="border-2 border-dashed border-green-500/30 rounded-xl p-4 text-center mb-3 bg-green-500/5">
        <Upload className="w-5 h-5 text-green-400 mx-auto mb-1" />
        <span className="text-[10px] text-green-400 font-medium">tradovate_trades.csv</span>
      </div>
      <div className="space-y-1.5">
        {[
          { step: "Parsing CSV...", done: true },
          { step: "Account: APEX-48291 detected", done: true },
          { step: "42 trades found (3 duplicates skipped)", done: true },
          { step: "FIFO P&L calculated", done: true },
          { step: "Session dates assigned", done: true },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
            <span className="text-[10px] text-gray-400">{s.step}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-white/5 text-center">
        <span className="text-[10px] text-green-400 font-bold">✓ Import complete in 3.2s</span>
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  return (
    <div className="bg-[#060a12] rounded-2xl p-4 border border-white/5">
      {/* Mini equity curve */}
      <div className="relative h-20 mb-3 rounded-lg bg-white/[0.02] overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 80">
          <defs>
            <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M0,60 C20,55 40,50 60,42 C80,34 100,38 120,28 C140,18 160,22 180,14 L200,10 L200,80 L0,80 Z" fill="url(#miniGrad)" />
          <path d="M0,60 C20,55 40,50 60,42 C80,34 100,38 120,28 C140,18 160,22 180,14 L200,10" fill="none" stroke="#4ADE80" strokeWidth="2" />
          <line x1="0" y1="70" x2="200" y2="68" stroke="#EF4444" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
        </svg>
      </div>
      {/* Mini KPI cards */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Win Rate", value: "68.4%", color: "text-green-400" },
          { label: "Profit Factor", value: "2.31", color: "text-green-400" },
          { label: "Avg Win", value: "+$187", color: "text-green-400" },
          { label: "Avg Loss", value: "-$81", color: "text-red-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/[0.03] rounded-lg p-2">
            <div className="text-[8px] text-gray-600">{kpi.label}</div>
            <div className={`text-xs font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const visuals: Record<string, () => JSX.Element> = {
  session: SessionVisual,
  compliance: ComplianceVisual,
  import: ImportVisual,
  analytics: AnalyticsVisual,
};

/* ─── Main Component ─── */

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeFeature, setActiveFeature] = useState(0);

  const active = mainFeatures[activeFeature];
  const colors = colorMap[active.tagColor];
  const ActiveIcon = active.icon;
  const VisualComponent = visuals[active.visual];

  return (
    <section id="features" ref={ref} className="relative py-32 md:py-40 bg-[#0A0E17] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-green-500/20 mb-6"
          >
            <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">
              Built Different
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 1.11, 0.81, 0.99] }}
            className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-tight text-white font-display mb-6"
          >
            Everything a{" "}
            <span className="gradient-text">prop trader</span>
            <br />
            actually needs.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-xl mx-auto"
          >
            Not a generic spreadsheet. Not a bloated platform. 
            A precision tool designed for futures prop trading from the ground up.
          </motion.p>
        </div>

        {/* ─── Feature Tabs + Detail View ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {/* Tab buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {mainFeatures.map((f, i) => {
              const Icon = f.icon;
              const c = colorMap[f.tagColor];
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFeature(i)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    activeFeature === i
                      ? `${c.bg} ${c.text} border ${c.border} shadow-lg`
                      : "bg-white/5 text-gray-400 border border-white/5 hover:border-white/10 hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {f.title}
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="glass rounded-3xl border border-white/10 overflow-hidden"
            >
              <div className="grid lg:grid-cols-5 gap-0">
                {/* Left: Content (3 cols) */}
                <div className="lg:col-span-3 p-8 lg:p-10">
                  {/* Tag */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border mb-6 ${colors.bg} ${colors.text} ${colors.border}`}>
                    {active.tag}
                  </span>

                  {/* Headline */}
                  <h3 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-4 font-display">
                    {active.headline}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">
                    {active.description}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    {active.longDescription}
                  </p>

                  {/* Detail grid */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {active.details.map((d, i) => {
                      const DIcon = d.icon;
                      return (
                        <motion.div
                          key={d.text}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.06 }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                        >
                          <DIcon className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                          <span className="text-gray-300 text-xs leading-relaxed">{d.text}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Visual (2 cols) */}
                <div className="lg:col-span-2 p-6 lg:p-8 bg-white/[0.01] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col justify-center">
                  <motion.div
                    key={active.id + "-visual"}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <VisualComponent />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ─── Additional Features Grid ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20"
        >
          <h3 className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">
            Plus everything else you need
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {additionalFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.07 }}
                  className="glass glass-hover rounded-2xl p-5 border border-white/5 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
                    <Icon className="w-5 h-5 text-green-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">{f.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-16"
        >
          <a
            href="/dashboard"
            className="landing-btn-primary group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg"
          >
            See It In Action
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
