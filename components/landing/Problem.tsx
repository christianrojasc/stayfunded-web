"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, X, TrendingDown, Users, DollarSign, Brain } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

const failures = [
  { text: "Trailing drawdowns — #1 account killer", pct: "54%" },
  { text: "Consistency rule violations", pct: "53%" },
  { text: "Over-risking (>1-2% per trade)", pct: "" },
  { text: "Revenge trading after losses", pct: "" },
  { text: "No awareness of daily loss limits", pct: "" },
];

const industryStats = [
  {
    icon: Users,
    value: "5-10",
    suffix: "%",
    label: "Evaluation Pass Rate",
    detail: "Only 5\u201310% of traders pass their first evaluation across all major firms",
    color: "text-red-400",
    borderColor: "border-red-500/15",
  },
  {
    icon: DollarSign,
    value: "7",
    suffix: "%",
    label: "Ever Get Paid",
    detail: "~7% of all traders who start ever receive a single payout",
    color: "text-orange-400",
    borderColor: "border-orange-500/15",
  },
  {
    icon: TrendingDown,
    value: "1-3",
    suffix: "%",
    label: "Long-Term Success",
    detail: "Only 1\u20133% become consistently profitable funded traders",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/15",
  },
  {
    icon: Brain,
    value: "60",
    suffix: "%",
    label: "Lose Money Overall",
    detail: "Most losses are from evaluation fees across multiple failed attempts",
    color: "text-red-400",
    borderColor: "border-red-500/15",
  },
];

export function Problem() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 md:py-40 bg-[#060a12] overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm font-semibold uppercase tracking-widest">The Hard Truth</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight text-white font-display mb-6"
          >
            The prop trading industry is a{" "}
            <span className="text-red-400">$20 billion</span> market.
            <br />
            <span className="text-gray-500">Most traders fund it with failed evaluations.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed"
          >
            Based on data from 300,000+ accounts across major firms (2025&ndash;2026): 
            80&ndash;95% of firm revenue comes from evaluation fees. The odds are stacked against you &mdash; 
            unless you trade with discipline and data.
          </motion.p>
        </div>

        {/* Industry stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {industryStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className={`glass rounded-2xl p-6 border ${stat.borderColor} relative overflow-hidden group hover:border-white/10 transition-colors`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <div className="text-3xl md:text-4xl font-black text-white mb-1 font-display">
                <span className={stat.color}>{stat.value}</span>
                <span className={`${stat.color} text-xl opacity-70`}>{stat.suffix}</span>
              </div>
              <p className="text-white text-sm font-semibold mb-1">{stat.label}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{stat.detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Why traders fail */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-2xl font-black text-white mb-4 font-display"
            >
              Why do traders fail?
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="text-gray-400 text-base leading-relaxed mb-8"
            >
              {"It's not bad entries \u2014 it's bad risk management. Trailing drawdowns and consistency rules account for the majority of blown accounts. Traders who risk <1% per trade and journal every session have dramatically higher survival rates."}
            </motion.p>

            <div className="space-y-3">
              {failures.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-red-400" />
                  </div>
                  <span className="text-gray-400 text-sm flex-1">{item.text}</span>
                  {item.pct && (
                    <span className="text-red-400 text-xs font-bold font-mono">{item.pct}</span>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 1 }}
              className="text-gray-600 text-[10px] mt-6 italic"
            >
              Sources: FPFX Tech (300K+ accounts), Topstep 2025 Transparency Report, PropFirmMatch aggregated data
            </motion.p>
          </div>

          {/* Right: The reality + hope */}
          <div className="flex flex-col gap-5">
            {/* Big stat - funnel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="glass rounded-3xl p-8 border border-red-500/15 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-3xl" />
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-4">If 100 traders start an evaluation</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl font-black text-red-400 font-display w-20 text-right">
                    <AnimatedCounter value={93} suffix="" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 bg-red-500/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={isInView ? { width: "93%" } : {}}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">fail the evaluation</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-4xl font-black text-orange-400 font-display w-20 text-right">4</div>
                  <div className="flex-1">
                    <div className="h-2.5 bg-orange-500/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={isInView ? { width: "4%" } : {}}
                        transition={{ duration: 1, delay: 1.0 }}
                        className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">pass but never get paid</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-4xl font-black text-green-400 font-display w-20 text-right">1-3</div>
                  <div className="flex-1">
                    <div className="h-2.5 bg-green-500/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={isInView ? { width: "3%" } : {}}
                        transition={{ duration: 1, delay: 1.2 }}
                        className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">become consistently profitable</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Average spend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="glass rounded-2xl p-5 border border-white/5">
                <div className="text-2xl font-black text-orange-400 mb-1 font-display">
                  $800&ndash;$4.3k
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Average spend per trader on evaluation fees before getting funded
                </p>
              </div>
              <div className="glass rounded-2xl p-5 border border-white/5">
                <div className="text-2xl font-black text-white mb-1 font-display">
                  <AnimatedCounter value={4} className="text-green-400" suffix="x ROI" />
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Average return for the traders who do succeed &mdash; discipline pays
                </p>
              </div>
            </motion.div>

            {/* The fix */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="glass rounded-2xl p-5 border border-green-500/20"
            >
              <p className="text-gray-300 text-sm leading-relaxed">
                <span className="text-green-400 font-bold">{"What the top 1\u20133% do differently:"}</span>{" "}
                {"Risk <1% per trade. Journal every session. Track drawdowns in real-time. Follow consistency rules religiously. StayFunded automates all of it."}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
