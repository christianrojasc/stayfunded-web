"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import ShineBorder from '@/components/ShineBorder';
import { useRef, useState } from "react";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

const plans = [
  {
    name: "Free",
    priceMonthly: "$0",
    priceYearly: "$0",
    period: "forever",
    description: "Everything you need to track your trades — no storage needed.",
    badge: null,
    cta: "Start Free",
    ctaStyle: "border",
    features: [
      "Up to 3 accounts",
      "CSV import (Tradovate)",
      "Equity curve & P&L tracking",
      "Daily loss limit monitoring",
      "Session-aware trade grouping",
      "Performance analytics",
      "8+ prop firm presets",
      "No file storage (data only)",
    ],
  },
  {
    name: "Pro",
    priceMonthly: "$14",
    priceYearly: "$99",
    period: "/ month",
    description: "Everything in Free, plus storage and tools for serious prop firm traders.",
    badge: "Most Popular",
    cta: "Get Pro",
    ctaStyle: "gradient",
    features: [
      "Everything in Free",
      "Unlimited accounts",
      "1GB storage (screenshots, statements)",
      "Trade screen charts",
      "Report generation",
      "AI trade insights (coming soon)",
      "Priority support",
    ],
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [yearly, setYearly] = useState(false);
  const { user } = useAuth();

  async function handleProCheckout(priceId: string) {
    if (!user) {
      window.location.href = '/login?redirect=upgrade';
      return;
    }
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, userId: user.id, email: user.email }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <section id="pricing" ref={ref} className="relative py-16 md:py-20 bg-[#060a12] overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-green-500/20 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">
              Simple Pricing
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 1.11, 0.81, 0.99] }}
            className="text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-[-0.02em] text-white font-display mb-6"
          >
            Free forever.{" "}
            <span className="gradient-text">Upgrade when ready.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-xl mx-auto"
          >
            No credit card required. No trial period. 
            Just start tracking and see the difference.
          </motion.p>
        </div>

        {/* Monthly/Yearly toggle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm font-medium transition-colors ${!yearly ? "text-white" : "text-gray-500"}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
              yearly ? "bg-green-500" : "bg-white/10"
            }`}
          >
            <motion.div
              animate={{ x: yearly ? 28 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg"
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${yearly ? "text-white" : "text-gray-500"}`}>
            Yearly
            <span className="ml-1.5 text-xs text-green-400 font-bold"></span>
          </span>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15, ease: [0.21, 1.11, 0.81, 0.99] }}
  className="relative"
            >
              {plan.badge && <ShineBorder borderRadius={24} className="absolute inset-0 pointer-events-none z-0" />}
              <div className={`relative z-10 rounded-3xl p-8 h-full ${plan.badge ? 'bg-[#0c1120] border border-[#4ADE80]/10' : 'border border-white/[0.07]'}`} style={plan.badge ? {} : {background:'rgba(255,255,255,0.025)'}}>
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.6 }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-700 to-green-500 text-white text-xs font-bold shadow-lg shadow-green-500/25"
                  >
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </motion.span>
                </div>
              )}

              {/* Plan name */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={yearly ? "yearly" : "monthly"}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="text-5xl font-bold text-white font-display"
                    >
                      {yearly ? plan.priceYearly : plan.priceMonthly}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-gray-500 text-sm">
                    {plan.priceMonthly === "$0" ? plan.period : yearly ? "/ year" : plan.period}
                  </span>
                </div>
                {yearly && plan.priceMonthly !== "$0" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-green-400 font-medium"
                  >
                    {`Save $${parseInt(plan.priceMonthly.replace("$", "")) * 12 - parseInt(plan.priceYearly.replace("$", ""))}/year vs monthly`}
                  </motion.p>
                )}
                <p className="text-gray-400 text-sm leading-relaxed mt-2">{plan.description}</p>
              </div>

              {/* CTA */}
              {plan.name === 'Pro' ? (
                <button
                  onClick={() => handleProCheckout(yearly ? 'price_1T8DHOCheboU7tiQR1S4s1gk' : 'price_1T8DHOCheboU7tiQPTTAPQvv')}
                  className="group mb-8 flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-bold transition-all duration-300 landing-btn-primary text-white"
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <a
                  href="/dashboard"
                  className="group mb-8 flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-bold transition-all duration-300 border border-white/15 text-white hover:border-white/30 hover:bg-white/5"
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              )}

              {/* Features */}
              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.badge ? "text-green-400" : "text-gray-500"
                      }`}
                    />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-gray-600 text-sm mt-10"
        >
          All plans include SSL security, daily backups, and 99.9% uptime SLA.
        </motion.p>
      </div>
    </section>
  );
}
