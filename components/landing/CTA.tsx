"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-16 md:py-20 bg-[#0A0E17] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />

      {/* Big glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-green-500/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.21, 1.11, 0.81, 0.99] }}
          className="glass shimmer rounded-[2.5rem] border border-green-500/15 p-12 md:p-16 relative overflow-hidden"
        >
          {/* Corner glows */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-green-400 text-sm font-bold uppercase tracking-widest mb-6"
            >
              Ready to change your trading?
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.21, 1.11, 0.81, 0.99] }}
              className="text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[1.1] tracking-[-0.02em] text-white font-display mb-6"
            >
              Stop guessing.
              <br />
              <span className="gradient-text-animated">Start tracking.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-gray-400 text-lg max-w-md mx-auto mb-10"
            >
              No signup required. No credit card. No commitment.
              Just you, your trades, and the truth.
            </motion.p>

            {/* Checkmarks */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-wrap items-center justify-center gap-6 mb-10"
            >
              {[
                "Free forever for personal use",
                "Import in 60 seconds",
                "No manual data entry",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.45, ease: [0.21, 1.11, 0.81, 0.99] }}
            >
              <a
                href="/login"
                className="landing-btn-primary pulse-glow group inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-bold text-white shadow-xl"
              >
                Start Tracking — It&apos;s Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-gray-600 text-sm mt-6"
            >
              Join traders already using StayFunded to stay in the game.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
