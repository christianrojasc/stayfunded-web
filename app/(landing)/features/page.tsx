import { Metadata } from "next";
import { Features } from "@/components/landing/Features";
import { CTA } from "@/components/landing/CTA";

export const metadata: Metadata = {
  title: "Trading Journal Features | Advanced Analytics for Prop Traders",
  description: "Real-time drawdown tracking, Tradovate CSV import, session-aware P&L, equity curves, daily checklists, and prop firm compliance. Everything a funded trader needs — free.",
};

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#050810] text-white pt-24">
      <div className="text-center px-6 pb-4 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          Everything you need to<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">stay funded.</span>
        </h1>
        <p className="text-gray-400 text-lg">Built for prop firm traders who track every edge.</p>
      </div>
      <Features />
      <CTA />
    </main>
  );
}
