"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, X, Minus } from "lucide-react";

const features = [
  { feature: "Session-aware trade grouping (6PM–5PM)", stayfunded: true, spreadsheet: false, tradezella: false },
  { feature: "Auto-detect prop firm from CSV", stayfunded: true, spreadsheet: false, tradezella: false },
  { feature: "Real-time drawdown monitoring", stayfunded: true, spreadsheet: false, tradezella: "partial" },
  { feature: "Trailing vs Static vs EOD drawdown", stayfunded: true, spreadsheet: false, tradezella: "partial" },
  { feature: "FIFO P&L calculation", stayfunded: true, spreadsheet: false, tradezella: true },
  { feature: "Daily loss limit alerts", stayfunded: true, spreadsheet: false, tradezella: true },
  { feature: "One-click CSV import", stayfunded: true, spreadsheet: false, tradezella: true },
  { feature: "Free forever plan", stayfunded: true, spreadsheet: true, tradezella: false },
  { feature: "Consistency rule tracking", stayfunded: true, spreadsheet: false, tradezella: "partial" },
  { feature: "No manual data entry", stayfunded: true, spreadsheet: false, tradezella: true },
];

function StatusIcon({ value }: { value: boolean | string }) {
  if (value === true)
    return <Check className="w-4 h-4 text-green-400" />;
  if (value === false)
    return <X className="w-4 h-4 text-red-400/60" />;
  return <Minus className="w-4 h-4 text-yellow-400/60" />;
}

export function Comparison() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-32 md:py-40 bg-[#0A0E17] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6"
          >
            <span className="text-gray-400 text-xs font-semibold tracking-widest uppercase">
              Why StayFunded?
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight text-white font-display mb-6"
          >
            Built for futures.{" "}
            <span className="gradient-text">Not retrofitted.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-xl mx-auto"
          >
            See how StayFunded compares to spreadsheets and generic trading journals.
          </motion.p>
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="glass rounded-3xl border border-white/10 overflow-hidden"
        >
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Feature</div>
            <div className="text-center">
              <span className="text-sm font-bold gradient-text">StayFunded</span>
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-gray-500">Spreadsheet</span>
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-gray-500">TradeZella</span>
            </div>
          </div>

          {/* Rows */}
          {features.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.05 }}
              className={`grid grid-cols-4 gap-4 px-6 py-3.5 items-center ${
                i % 2 === 0 ? "bg-white/[0.01]" : ""
              } ${i < features.length - 1 ? "border-b border-white/[0.03]" : ""}`}
            >
              <div className="text-sm text-gray-300">{row.feature}</div>
              <div className="flex justify-center">
                <StatusIcon value={row.stayfunded} />
              </div>
              <div className="flex justify-center">
                <StatusIcon value={row.spreadsheet} />
              </div>
              <div className="flex justify-center">
                <StatusIcon value={row.tradezella} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
