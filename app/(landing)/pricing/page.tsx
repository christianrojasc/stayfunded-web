import { Metadata } from "next";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";

export const metadata: Metadata = {
  title: "Pricing — StayFunded",
  description: "Start free. Upgrade when you're ready. No credit card required.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050810] text-white pt-24">
      <div className="text-center px-6 pb-4 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          Simple, honest<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">pricing.</span>
        </h1>
        <p className="text-gray-400 text-lg">Start free. No credit card. No gotchas.</p>
      </div>
      <Pricing />
      <CTA />
    </main>
  );
}
