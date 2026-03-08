"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2, Zap } from "lucide-react";

const firms = [
  { name: "Apex Trader Funding", abbr: "APEX", rules: "Trailing Drawdown" },
  { name: "Tradeify", abbr: "TFY", rules: "Static EOD + Daily Loss" },
  { name: "TopStep", abbr: "TS", rules: "Trailing + Consistency" },
  { name: "Take Profit Trader", abbr: "TPT", rules: "Static EOD" },
  { name: "My Funded Futures", abbr: "MFFU", rules: "Trailing Drawdown" },
  { name: "FTMO", abbr: "FTMO", rules: "Max Daily + Overall DD" },
  { name: "Fast Track Trading", abbr: "FFN", rules: "Static + Trailing" },
  { name: "Lucid Trading", abbr: "LTF", rules: "Trailing Drawdown" },
];

const features = [
  "Auto-detect your account from CSV",
  "Pre-filled rule parameters per firm",
  "Real-time compliance monitoring",
  "Violation alerts before it's too late",
];

export function PropFirms() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="propfirms" ref={ref} className="relative py-32 md:py-40 bg-[#0A0E17] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
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
            <Zap className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">
              Prop Firm Support
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 1.11, 0.81, 0.99] }}
            className="text-[clamp(2.5rem,5.5vw,4rem)] font-bold leading-tight text-white mb-6"
          >
            Built for every{" "}
            <span className="gradient-text">major prop firm.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-xl mx-auto"
          >
            Auto-detect your account. Auto-fill your rules. 
            Know your limits before the market teaches you the hard way.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left: Firm grid - 3 cols */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {firms.map((firm, i) => (
              <motion.div
                key={firm.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.07 }}
                className="glass glass-hover rounded-2xl p-4 border border-white/5 group text-center cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600/20 to-green-400/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3 group-hover:border-green-500/40 transition-colors">
                  <span className="text-[9px] font-bold text-green-400 tracking-tight">{firm.abbr}</span>
                </div>
                <div className="text-xs font-semibold text-white leading-tight mb-1">{firm.name}</div>
                <div className="text-[10px] text-gray-600 font-medium">{firm.rules}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Features - 2 cols */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            <div className="glass rounded-3xl p-8 border border-green-500/15">
              <h3 className="text-xl font-bold text-white mb-6">
                Auto-detect. Auto-fill. Auto-protect.
              </h3>
              <div className="space-y-4">
                {features.map((f, i) => (
                  <motion.div
                    key={f}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.45 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm leading-relaxed">{f}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Import card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="glass rounded-2xl p-6 border border-white/5"
            >
              <div className="text-sm font-bold text-white mb-2">Import your CSV</div>
              <div className="h-16 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center mb-3 hover:border-green-500/30 transition-colors cursor-default">
                <span className="text-xs text-gray-600">Drop Tradovate CSV here</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-green-500/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: "100%" } : {}}
                    transition={{ duration: 1.5, delay: 0.9 }}
                    className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400"
                  />
                </div>
                <span className="text-[10px] text-green-400 font-mono">Detected: APEX-48291</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
