"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import { Calculator, Shield, TrendingUp, AlertTriangle } from "lucide-react";

const firms = [
  { name: "Apex Trader Funding", plans: [
    { label: "25K", size: 25000, drawdown: 1500, type: "Trailing", daily: null },
    { label: "50K", size: 50000, drawdown: 2500, type: "Trailing", daily: null },
    { label: "100K", size: 100000, drawdown: 3000, type: "Trailing", daily: null },
    { label: "150K", size: 150000, drawdown: 5000, type: "Trailing", daily: null },
  ]},
  { name: "Tradeify", plans: [
    { label: "50K Std", size: 50000, drawdown: 2000, type: "Static EOD", daily: 1000 },
    { label: "100K Std", size: 100000, drawdown: 3500, type: "Static EOD", daily: 2000 },
    { label: "150K Std", size: 150000, drawdown: 4500, type: "Static EOD", daily: 3000 },
  ]},
  { name: "TopStep", plans: [
    { label: "50K", size: 50000, drawdown: 2000, type: "Trailing", daily: 1000 },
    { label: "100K", size: 100000, drawdown: 3000, type: "Trailing", daily: 2000 },
    { label: "150K", size: 150000, drawdown: 4500, type: "Trailing", daily: 3000 },
  ]},
  { name: "Take Profit Trader", plans: [
    { label: "50K", size: 50000, drawdown: 2000, type: "Static EOD", daily: null },
    { label: "100K", size: 100000, drawdown: 3000, type: "Static EOD", daily: null },
    { label: "150K", size: 150000, drawdown: 4500, type: "Static EOD", daily: null },
  ]},
];

function fmtDollar(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

export function DrawdownCalculator() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [firmIdx, setFirmIdx] = useState(0);
  const [planIdx, setPlanIdx] = useState(1);
  const [pnlToday, setPnlToday] = useState(0);

  const firm = firms[firmIdx];
  const plan = firm.plans[Math.min(planIdx, firm.plans.length - 1)];

  const drawdownUsed = Math.max(0, -pnlToday);
  const drawdownPct = plan.drawdown > 0 ? (drawdownUsed / plan.drawdown) * 100 : 0;
  const dailyUsed = plan.daily ? (drawdownUsed / plan.daily) * 100 : 0;

  const status = useMemo(() => {
    if (drawdownPct >= 100) return { label: "ACCOUNT BLOWN", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30" };
    if (drawdownPct >= 80 || dailyUsed >= 80) return { label: "DANGER ZONE", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
    if (drawdownPct >= 50 || dailyUsed >= 50) return { label: "CAUTION", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
    return { label: "SAFE", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" };
  }, [drawdownPct, dailyUsed]);

  return (
    <section ref={ref} className="relative py-32 md:py-40 bg-[#060a12] overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-green-500/20 mb-6"
          >
            <Calculator className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">
              Interactive Tool
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight text-white font-display mb-6"
          >
            Drawdown{" "}
            <span className="gradient-text">Calculator</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-xl mx-auto"
          >
            See exactly how much room you have. Select your firm, plan, and simulate your daily P&L.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left: Controls */}
              <div className="p-8 border-b md:border-b-0 md:border-r border-white/5">
                {/* Firm selector */}
                <div className="mb-6">
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3 block">Prop Firm</label>
                  <div className="grid grid-cols-2 gap-2">
                    {firms.map((f, i) => (
                      <button
                        key={f.name}
                        onClick={() => { setFirmIdx(i); setPlanIdx(0); setPnlToday(0); }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          firmIdx === i
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-white/5 text-gray-400 border border-white/5 hover:border-white/10"
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plan selector */}
                <div className="mb-6">
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3 block">Plan Size</label>
                  <div className="flex gap-2">
                    {firm.plans.map((p, i) => (
                      <button
                        key={p.label}
                        onClick={() => { setPlanIdx(i); setPnlToday(0); }}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          planIdx === i
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-white/5 text-gray-400 border border-white/5 hover:border-white/10"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* P&L Slider */}
                <div className="mb-6">
                  <div className="flex justify-between mb-3">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Today&apos;s P&L</label>
                    <span className={`text-sm font-bold ${pnlToday >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pnlToday >= 0 ? "+" : ""}{fmtDollar(pnlToday)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-plan.drawdown}
                    max={plan.drawdown}
                    value={pnlToday}
                    onChange={(e) => setPnlToday(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #EF4444 0%, #EF4444 ${(((-plan.drawdown - pnlToday) / (-plan.drawdown * 2)) * -100 + 100)}%, #22C55E 100%)`,
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-red-400/60">{fmtDollar(-plan.drawdown)}</span>
                    <span className="text-[10px] text-gray-600">$0</span>
                    <span className="text-[10px] text-green-400/60">+{fmtDollar(plan.drawdown)}</span>
                  </div>
                </div>

                {/* Quick P&L buttons */}
                <div className="flex gap-2 flex-wrap">
                  {[-500, -250, -100, 0, 100, 250, 500].map((v) => (
                    <button
                      key={v}
                      onClick={() => setPnlToday(Math.max(-plan.drawdown, Math.min(plan.drawdown, v)))}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        v < 0 ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" :
                        v === 0 ? "bg-white/5 text-gray-400 hover:bg-white/10" :
                        "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {v >= 0 ? "+" : ""}{fmtDollar(v)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Live status */}
              <div className="p-8">
                {/* Status badge */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={status.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.bg} border ${status.border} mb-6`}
                  >
                    {status.label === "SAFE" ? <Shield className={`w-4 h-4 ${status.color}`} /> :
                     status.label === "CAUTION" ? <AlertTriangle className={`w-4 h-4 ${status.color}`} /> :
                     <AlertTriangle className={`w-4 h-4 ${status.color}`} />}
                    <span className={`text-xs font-bold tracking-wider ${status.color}`}>{status.label}</span>
                  </motion.div>
                </AnimatePresence>

                {/* Account info */}
                <div className="mb-6">
                  <div className="text-xs text-gray-500 mb-1">Account Balance</div>
                  <motion.div
                    key={plan.size + pnlToday}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-white font-display"
                  >
                    {fmtDollar(plan.size + pnlToday)}
                  </motion.div>
                </div>

                {/* Max Drawdown bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400 font-medium">Max Drawdown ({plan.type})</span>
                    <span className={drawdownPct >= 80 ? "text-red-400 font-bold" : "text-gray-400"}>
                      {fmtDollar(drawdownUsed)} / {fmtDollar(plan.drawdown)}
                    </span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${Math.min(100, drawdownPct)}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                      className={`h-full rounded-full transition-colors duration-300 ${
                        drawdownPct >= 80 ? "bg-gradient-to-r from-red-600 to-red-400" :
                        drawdownPct >= 50 ? "bg-gradient-to-r from-yellow-600 to-yellow-400" :
                        "bg-gradient-to-r from-green-600 to-green-400"
                      }`}
                    />
                  </div>
                  <div className="text-right mt-1">
                    <span className={`text-xs font-bold ${
                      drawdownPct >= 80 ? "text-red-400" : drawdownPct >= 50 ? "text-yellow-400" : "text-green-400"
                    }`}>{drawdownPct.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Daily Loss bar (if applicable) */}
                {plan.daily && (
                  <div className="mb-5">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-400 font-medium">Daily Loss Limit</span>
                      <span className={dailyUsed >= 80 ? "text-red-400 font-bold" : "text-gray-400"}>
                        {fmtDollar(drawdownUsed)} / {fmtDollar(plan.daily)}
                      </span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${Math.min(100, dailyUsed)}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className={`h-full rounded-full transition-colors duration-300 ${
                          dailyUsed >= 80 ? "bg-gradient-to-r from-red-600 to-red-400" :
                          dailyUsed >= 50 ? "bg-gradient-to-r from-yellow-600 to-yellow-400" :
                          "bg-gradient-to-r from-green-600 to-green-400"
                        }`}
                      />
                    </div>
                    <div className="text-right mt-1">
                      <span className={`text-xs font-bold ${
                        dailyUsed >= 80 ? "text-red-400" : dailyUsed >= 50 ? "text-yellow-400" : "text-green-400"
                      }`}>{dailyUsed.toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                {/* Remaining room */}
                <div className="glass rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400 font-medium">Room Remaining</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-lg font-bold text-white">{fmtDollar(Math.max(0, plan.drawdown - drawdownUsed))}</div>
                      <div className="text-[10px] text-gray-500">until max drawdown</div>
                    </div>
                    {plan.daily && (
                      <div>
                        <div className="text-lg font-bold text-white">{fmtDollar(Math.max(0, plan.daily - drawdownUsed))}</div>
                        <div className="text-[10px] text-gray-500">until daily limit</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-center text-gray-600 text-xs mt-6">
            This is exactly what StayFunded tracks automatically from your real trades. No manual calculation needed.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
