"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BarChart2, TrendingUp, Shield, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

const trades = [
  { symbol: "MNQ", side: "Long", qty: 2, entry: "15,842.25", exit: "15,868.75", pnl: "+$265.00", win: true, time: "09:32" },
  { symbol: "MES", side: "Short", qty: 5, entry: "4,512.50", exit: "4,498.25", pnl: "+$355.00", win: true, time: "10:18" },
  { symbol: "MNQ", side: "Long", qty: 1, entry: "15,891.00", exit: "15,876.50", pnl: "-$72.50", win: false, time: "11:05" },
  { symbol: "MNQ", side: "Long", qty: 3, entry: "15,902.25", exit: "15,934.00", pnl: "+$477.75", win: true, time: "13:42" },
];

export function Dashboard() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="dashboard" ref={ref} className="relative py-32 md:py-40 bg-[#060a12] overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Green glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6"
          >
            <span className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
              Dashboard Preview
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 1.11, 0.81, 0.99] }}
            className="text-[clamp(2.5rem,5vw,4rem)] font-black leading-tight text-white font-display mb-6"
          >
            Your trading command{" "}
            <span className="gradient-text">center.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-xl mx-auto"
          >
            Everything you need to know about your account, your performance, 
            and your limits — in one clean dashboard.
          </motion.p>
        </div>

        {/* Main dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative"
        >
          <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_120px_rgba(74,222,80,0.07)]">
            {/* Top bar */}
            <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="text-xs text-gray-500 font-mono ml-2">StayFunded Dashboard</div>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Live</span>
              </div>
            </div>

            {/* Dashboard body */}
            <div className="p-4 md:p-6 lg:p-8 bg-[#0A0E17]/80">
              {/* Top stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: BarChart2, label: "Account Balance", value: "$52,340", change: "+$1,025 today", up: true },
                  { icon: TrendingUp, label: "Profit Target", value: "84%", change: "$4,200 / $5,000", up: true },
                  { icon: Shield, label: "Daily Loss Used", value: "21%", change: "$312 of $1,500", up: false },
                  { icon: Activity, label: "Win Rate (30d)", value: "68.4%", change: "37 wins / 17 losses", up: true },
                ].map(({ icon: Icon, label, value, change, up }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                    className="glass rounded-2xl p-4 border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500 font-medium">{label}</span>
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-2xl font-black text-white mb-1">{value}</div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-green-400" : "text-orange-400"}`}>
                      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {change}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Main content grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Equity curve - spans 2 cols */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.55 }}
                  className="lg:col-span-2 glass rounded-2xl p-5 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Equity Curve</h3>
                      <p className="text-xs text-gray-500 mt-0.5">vs Drawdown Floor</p>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-green-400 rounded-full" />
                        <span className="text-gray-500">Equity</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-red-400/60 rounded-full" style={{ borderTop: "1px dashed" }} />
                        <span className="text-gray-500">Drawdown Floor</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-44 rounded-xl bg-[#060a12]/60 overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 176">
                      <defs>
                        <linearGradient id="equityGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      {[44, 88, 132].map((y) => (
                        <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                      ))}
                      {/* Equity area */}
                      <path
                        d="M0,140 C30,135 55,128 80,120 C105,112 125,118 150,105 C175,92 200,98 225,84 C250,70 270,75 295,60 C320,45 345,50 370,38 C395,26 420,30 445,22 C460,17 480,14 500,10 L500,176 L0,176 Z"
                        fill="url(#equityGrad2)"
                      />
                      <path
                        d="M0,140 C30,135 55,128 80,120 C105,112 125,118 150,105 C175,92 200,98 225,84 C250,70 270,75 295,60 C320,45 345,50 370,38 C395,26 420,30 445,22 C460,17 480,14 500,10"
                        fill="none"
                        stroke="#4ADE80"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Drawdown floor line */}
                      <path
                        d="M0,162 C100,158 200,155 300,153 C400,151 450,152 500,152"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="1.5"
                        strokeDasharray="8,5"
                        opacity="0.5"
                      />
                      {/* Profit target line */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="#4ADE80" strokeWidth="1" strokeDasharray="6,4" opacity="0.3" />
                    </svg>
                    <div className="absolute top-2 right-3 text-[9px] text-green-400/50 font-mono">— profit target</div>
                    <div className="absolute bottom-2 left-3 text-[9px] text-red-400/50 font-mono">- - drawdown floor</div>
                  </div>
                </motion.div>

                {/* Session breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.65 }}
                  className="glass rounded-2xl p-5 border border-white/5"
                >
                  <h3 className="text-sm font-bold text-white mb-4">Session Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { session: "Overnight", pnl: "+$185", trades: 3, pct: 18 },
                      { session: "AM", pnl: "+$620", trades: 12, pct: 61 },
                      { session: "PM", pnl: "+$222", trades: 6, pct: 21 },
                    ].map((s) => (
                      <div key={s.session}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-400 font-medium">{s.session} Session</span>
                          <span className="text-green-400 font-bold">{s.pnl}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={isInView ? { width: `${s.pct}%` } : {}}
                            transition={{ duration: 0.8, delay: 0.7 }}
                            className="h-full bg-gradient-to-r from-green-700 to-green-400 rounded-full"
                          />
                        </div>
                        <div className="text-[10px] text-gray-600 mt-1">{s.trades} trades</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Best Session</span>
                      <span className="text-green-400 font-bold">AM +$620</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Trade log */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.75 }}
                className="mt-6 glass rounded-2xl p-5 border border-white/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Today&apos;s Trades</h3>
                  <span className="text-xs text-gray-500">4 trades · Feb 26</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-600 border-b border-white/5">
                        <th className="text-left pb-2 font-medium">Symbol</th>
                        <th className="text-left pb-2 font-medium">Side</th>
                        <th className="text-left pb-2 font-medium">Qty</th>
                        <th className="text-left pb-2 font-medium hidden sm:table-cell">Entry</th>
                        <th className="text-left pb-2 font-medium hidden sm:table-cell">Exit</th>
                        <th className="text-left pb-2 font-medium">Time</th>
                        <th className="text-right pb-2 font-medium">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={isInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ duration: 0.4, delay: 0.9 + i * 0.15 }}
                          className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-2.5 font-bold text-white">{trade.symbol}</td>
                          <td className={`py-2.5 font-semibold ${trade.side === "Long" ? "text-green-400" : "text-red-400"}`}>{trade.side}</td>
                          <td className="py-2.5 text-gray-400">{trade.qty}</td>
                          <td className="py-2.5 text-gray-400 font-mono hidden sm:table-cell">{trade.entry}</td>
                          <td className="py-2.5 text-gray-400 font-mono hidden sm:table-cell">{trade.exit}</td>
                          <td className="py-2.5 text-gray-500">{trade.time}</td>
                          <td className={`py-2.5 text-right font-black ${trade.win ? "text-green-400" : "text-red-400"}`}>{trade.pnl}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom glow */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-green-500/8 blur-3xl rounded-full pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
