import { Metadata } from "next";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTA } from "@/components/landing/CTA";

export const metadata: Metadata = {
  title: "How StayFunded Works | Import Trades & Track Drawdowns in Minutes",
  description: "Import your Tradovate CSV, set your prop firm rules, and get real-time drawdown tracking, session-aware analytics, and daily accountability. Setup takes 2 minutes.",
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#050810] text-white pt-24">
      <div className="text-center px-6 pb-4 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          Up and running in<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">under 2 minutes.</span>
        </h1>
        <p className="text-gray-400 text-lg">Import your trades, set your prop firm rules, and start tracking.</p>
      </div>
      <HowItWorks />
      <CTA />
    </main>
  );
}
