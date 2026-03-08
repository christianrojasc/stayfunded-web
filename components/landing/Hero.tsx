"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, BarChart2, Shield, TrendingUp, Activity } from "lucide-react";
import { GLSLHills } from '@/components/ui/glsl-hills';

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-grid w-full">
      {/* Background radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-green-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-green-600/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[80px]" />
        <div className="absolute inset-0 pointer-events-none" style={{overflow:"hidden"}}>
          <GLSLHills speed={0.4} cameraZ={130} planeSize={256} />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-24 pb-12 md:pt-32 md:pb-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-green-500/20 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">
            #1 Trading Journal for Prop Traders
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.21, 1.11, 0.81, 0.99] }}
          className="text-[clamp(2.4rem,7vw,6rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white mb-6 font-display"
        >
          <span className="block text-white">Stop Blowing</span>
          <span className="block gradient-text-animated">Prop Accounts.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-[clamp(1rem,2.5vw,1.25rem)] text-gray-400 max-w-2xl mx-auto leading-[1.7] mb-10 font-normal"
        >
          The smartest trading journal for futures prop traders. Track drawdown, follow your rules, and <span className="text-white font-medium">stay funded longer.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 md:mb-16"
        >
          <a
            href="/login"
            className="landing-btn-primary pulse-glow group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg"
          >
            Start Tracking — It&apos;s Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="/how-it-works"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-gray-300 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300"
          >
            See the Dashboard
          </a>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-8 mb-12 md:mb-20">
          {[
            { value: "All Firms", label: "Supported*" },
            { value: "93%", label: "Traders Fail Without a Journal" },
            { value: "Free", label: "No Credit Card Needed" },
            { value: "CSV", label: "Tradovate Import in Seconds" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl font-bold gradient-text mb-1 font-display tracking-tight">{stat.value}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Prop firm marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mb-10 md:mb-20 overflow-hidden relative"
        >
          <p className="text-center text-gray-600 text-xs uppercase tracking-widest mb-4">
            Supports All Major Prop Firms
          </p>
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0A0E17] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0A0E17] to-transparent z-10" />
            <div className="flex animate-marquee whitespace-nowrap gap-12">
              {["Apex Trader Funding", "Take Profit Trader", "My Funded Futures", "Tradeify", "Lucid Trading", "Alpha Futures", "Funded Futures Network", "TopStep", "Fast Track Trading",
                "Apex Trader Funding", "Take Profit Trader", "My Funded Futures", "Tradeify", "Lucid Trading", "Alpha Futures", "Funded Futures Network", "TopStep", "Fast Track Trading"
              ].map((name, i) => (
                <span key={i} className="text-gray-500 text-sm font-semibold flex items-center gap-2 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-green-500/30" />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Floating card - top left */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-8 top-12 z-20 glass rounded-2xl p-4 border border-green-500/20 shadow-2xl hidden lg:block w-48"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              </div>
              <span className="text-xs text-gray-400 font-medium">Today&apos;s P&L</span>
            </div>
            <div className="text-2xl font-bold text-green-400">+$847</div>
            <div className="text-xs text-gray-500 mt-1">+3.4% account</div>
            <div className="mt-2 flex gap-1">
              {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                <div key={i} className="flex-1 bg-green-500/20 rounded-sm" style={{ height: `${h * 0.3}px` }} />
              ))}
            </div>
          </motion.div>

          {/* Floating card - top right */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-8 top-8 z-20 glass rounded-2xl p-4 border border-white/10 shadow-2xl hidden lg:block w-52"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Drawdown Status</span>
              <Shield className="w-3.5 h-3.5 text-green-400" />
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Daily Limit</span>
                  <span className="text-green-400">$312 / $1,500</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[21%] bg-gradient-to-r from-green-600 to-green-400 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Max Drawdown</span>
                  <span className="text-green-400">$1,240 / $3,000</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[41%] bg-gradient-to-r from-green-600 to-green-400 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating card - bottom right */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -right-4 bottom-16 z-20 glass rounded-2xl p-3 border border-white/10 shadow-2xl hidden lg:block w-44"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-gray-400">Win Rate</span>
            </div>
            <div className="text-xl font-bold text-white">68.4%</div>
            <div className="text-xs text-gray-500 mt-0.5">Last 30 days</div>
          </motion.div>

          {/* Main dashboard mockup */}
          <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(74,222,80,0.08)] relative">
            {/* Window bar */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <div className="flex-1 mx-4 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                <span className="text-[10px] text-gray-500 font-mono">app.stayfunded.app/dashboard</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-4 md:p-6 bg-[#0A0E17]/60">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Account: APEX-48291</div>
                  <div className="text-2xl font-bold text-white">$52,340 <span className="text-green-400 text-base font-bold">+$847 today</span></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["1D", "1W", "1M", "All"].map((t, i) => (
                    <button key={t} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${i === 0 ? "bg-green-500/20 text-green-400 border border-green-500/30" : "text-gray-500 hover:text-gray-300"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equity chart placeholder */}
              <div className="relative h-40 mb-6 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 160">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,120 C20,115 40,108 60,100 C80,92 100,95 120,85 C140,75 160,80 180,68 C200,56 220,60 240,50 C260,40 280,45 300,32 C320,19 340,22 360,18 C380,14 400,10 400,10 L400,160 L0,160 Z"
                    fill="url(#chartGrad)"
                  />
                  <path
                    d="M0,120 C20,115 40,108 60,100 C80,92 100,95 120,85 C140,75 160,80 180,68 C200,56 220,60 240,50 C260,40 280,45 300,32 C320,19 340,22 360,18 C380,14 400,10 400,10"
                    fill="none"
                    stroke="#4ADE80"
                    strokeWidth="2"
                  />
                  {/* Drawdown floor line */}
                  <line x1="0" y1="140" x2="400" y2="140" stroke="#EF4444" strokeWidth="1" strokeDasharray="6,4" opacity="0.5" />
                </svg>
                <div className="absolute bottom-2 right-3 text-[10px] text-red-400/70 font-mono">— drawdown floor</div>
                <div className="absolute top-2 left-3 text-[10px] text-green-400/70 font-mono">equity curve</div>
              </div>

              {/* Bottom stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: BarChart2, label: "Trades Today", value: "7", sub: "5W / 2L" },
                  { icon: TrendingUp, label: "Profit Target", value: "84%", sub: "$4,200 / $5,000" },
                  { icon: Shield, label: "Daily Loss", value: "21%", sub: "$312 used" },
                  { icon: Activity, label: "Consistency", value: "A+", sub: "Top 8%" },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} className="glass rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon className="w-3.5 h-3.5 text-green-400/70" />
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{label}</span>
                    </div>
                    <div className="text-lg font-bold text-white">{value}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Glow under mockup */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-green-500/10 blur-3xl rounded-full" />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-gray-600 font-medium uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </motion.div>
      </motion.div>
    </section>
  );
}
