"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, BarChart2, Shield, ArrowRight, ChevronRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Import Your Trades",
    description:
      "Drop your Tradovate CSV and we auto-detect your account, match your prop firm, and calculate FIFO P&L — in seconds.",
    detail: "Supports Apex, Tradeify, TopStep, TPT, MFFU, FTMO & more",
    color: "green",
    visual: (
      <div className="space-y-2">
        <div className="border-2 border-dashed border-green-500/30 rounded-xl p-3 text-center bg-green-500/5">
          <Upload className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <span className="text-[10px] text-green-400 font-medium">tradovate_trades.csv</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          42 trades detected
        </div>
      </div>
    ),
  },
  {
    number: "02",
    icon: BarChart2,
    title: "Track Everything",
    description:
      "Equity curves, session breakdowns, calendar heatmaps, trade charts — see your performance from every angle.",
    detail: "Session-aware: groups trades by 6PM–5PM futures sessions",
    color: "blue",
    visual: (
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {[35, 55, 40, 70, 45, 80, 60, 75, 50, 85].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-blue-600/40 to-blue-400/60" style={{ height: `${h * 0.4}px` }} />
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Win rate: 68.4%
        </div>
      </div>
    ),
  },
  {
    number: "03",
    icon: Shield,
    title: "Stay Funded",
    description:
      "Real-time drawdown monitoring, daily loss alerts, and profit target tracking. Know your limits before the market does.",
    detail: "Trailing, static, and EOD drawdown — all calculated automatically",
    color: "purple",
    visual: (
      <div className="space-y-2">
        {[
          { label: "Max DD", pct: 28, color: "from-green-600 to-green-400" },
          { label: "Daily", pct: 15, color: "from-green-600 to-green-400" },
        ].map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-500">{bar.label}</span>
              <span className="text-green-400 font-bold">{bar.pct}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${bar.color}`} style={{ width: `${bar.pct}%` }} />
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold">
          <Shield className="w-3 h-3" /> SAFE
        </div>
      </div>
    ),
  },
];

const colorMap: Record<string, { bg: string; border: string; icon: string; number: string; glow: string }> = {
  green: { bg: "bg-green-500/10", border: "border-green-500/20", icon: "text-green-400", number: "text-green-500/15", glow: "bg-green-500/10" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-400", number: "text-blue-500/15", glow: "bg-blue-500/10" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-400", number: "text-purple-500/15", glow: "bg-purple-500/10" },
};

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" ref={ref} className="relative py-32 md:py-40 bg-[#060a12] overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6"
          >
            <span className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
              How It Works
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 1.11, 0.81, 0.99] }}
            className="text-[clamp(2.5rem,5vw,4rem)] font-bold leading-tight text-white font-display mb-6"
          >
            Three steps to{" "}
            <span className="gradient-text">never blow</span>
            <br />
            an account again.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-xl mx-auto"
          >
            From CSV to full compliance monitoring in under 60 seconds.
            No setup. No configuration. Just import and trade.
          </motion.p>
        </div>

        {/* Steps — horizontal cards with connecting arrows */}
        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connecting arrows (desktop) */}
          {[0, 1].map((i) => (
            <div
              key={i}
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 items-center justify-center z-10"
              style={{ left: `${33.33 * (i + 1)}%`, transform: "translate(-50%, -50%)" }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.2 }}
                className="w-10 h-10 rounded-full bg-[#060a12] border border-white/10 flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </motion.div>
            </div>
          ))}

          {steps.map((step, i) => {
            const colors = colorMap[step.color];
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.15, ease: [0.21, 1.11, 0.81, 0.99] }}
                className="glass rounded-3xl border border-white/[0.06] p-8 relative overflow-hidden group hover:border-white/10 transition-all duration-500"
              >
                {/* Background glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 ${colors.glow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Step number */}
                <div className={`text-[5rem] font-bold leading-none ${colors.number} select-none absolute top-4 right-6 font-display`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`relative z-10 w-14 h-14 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-6`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 font-display relative z-10">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 relative z-10">
                  {step.description}
                </p>

                {/* Mini visual */}
                <div className="relative z-10 bg-white/[0.02] rounded-xl p-3 border border-white/5 mb-4">
                  {step.visual}
                </div>

                <p className="text-[11px] text-gray-600 font-medium relative z-10">
                  {step.detail}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center mt-16"
        >
          <a
            href="/login"
            className="landing-btn-primary group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg"
          >
            Try It Now — Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
