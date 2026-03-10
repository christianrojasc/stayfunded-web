import { Metadata } from "next";
import { PropFirms } from "@/components/landing/PropFirms";
import { CTA } from "@/components/landing/CTA";

export const metadata: Metadata = {
  title: "Supported Prop Trading Firms | 20+ Firm Presets",
  description: "Track drawdowns for Apex, Tradeify, TopStep, Take Profit Trader, and 20+ more prop firms. Auto-configured rules, trailing drawdown locks, daily loss limits. One journal for all your accounts.",
};

export default function PropFirmsOverviewPage() {
  return (
    <main className="min-h-screen bg-[#050810] text-white pt-24">
      <div className="text-center px-6 pb-4 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          Built for every<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">prop firm.</span>
        </h1>
        <p className="text-gray-400 text-lg">20+ firms supported. Rules pre-loaded. Just trade.</p>
      </div>
      <PropFirms />
      <CTA />
    </main>
  );
}
