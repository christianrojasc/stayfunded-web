"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Marcus T.",
    role: "Apex Trader · 150K Funded",
    avatar: "MT",
    color: "from-green-600 to-green-400",
    quote:
      "I blew 3 accounts before I started tracking properly. StayFunded showed me I was consistently over-trading after 11 AM. Changed that one habit and passed my next eval in 8 days.",
    metric: "Passed eval in 8 days",
  },
  {
    name: "Diana R.",
    role: "Tradeify · 100K Pro",
    avatar: "DR",
    color: "from-blue-600 to-blue-400",
    quote:
      "The drawdown tracking saved me. I was 87% to my daily limit and didn't even know it. Got the alert, stopped trading, kept my account. That one feature paid for itself forever.",
    metric: "Saved from daily limit breach",
  },
  {
    name: "James K.",
    role: "TopStep · 50K",
    avatar: "JK",
    color: "from-purple-600 to-purple-400",
    quote:
      "Switched from Excel to StayFunded and immediately saw patterns I was missing. My consistency score went from C to A+ in three weeks. The session grouping is a game changer for futures.",
    metric: "C → A+ consistency in 3 weeks",
  },
  {
    name: "Sofia M.",
    role: "MFFU · 100K Funded",
    avatar: "SM",
    color: "from-orange-600 to-orange-400",
    quote:
      "CSV import takes literally 10 seconds. No more manually entering trades at the end of the day. I just drag, drop, and everything is calculated — FIFO, fees, session dates. It just works.",
    metric: "10 second daily workflow",
  },
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-32 md:py-40 bg-[#060a12] overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[300px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-green-500/20 mb-6"
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">
              Trader Reviews
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 1.11, 0.81, 0.99] }}
            className="text-[clamp(2.5rem,5.5vw,4rem)] font-bold leading-tight text-white font-display mb-6"
          >
            Traders who{" "}
            <span className="gradient-text">stopped guessing</span>
            <br />
            started winning.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-xl mx-auto"
          >
            Real traders. Real results. See how StayFunded helped them 
            protect their accounts and pass their evaluations.
          </motion.p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.12, ease: [0.21, 1.11, 0.81, 0.99] }}
              className="glass glass-hover rounded-3xl p-8 border border-white/5 relative group overflow-hidden"
            >
              {/* Quote icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-white/[0.03] group-hover:text-white/[0.06] transition-colors duration-500" />

              {/* Top: avatar + info */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-sm">{t.avatar}</span>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Metric badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-green-400 text-xs font-semibold">{t.metric}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom social proof bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center"
        >
          {[
            { value: "500+", label: "Active Traders" },
            { value: "2,400+", label: "Accounts Tracked" },
            { value: "94%", label: "Pass Rate Improvement" },
            { value: "$1.2M+", label: "Drawdown Prevented" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.9 + i * 0.1 }}
            >
              <div className="text-2xl font-bold gradient-text font-display">{stat.value}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
