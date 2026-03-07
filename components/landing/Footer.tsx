"use client";

const links = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Prop Firms", href: "#propfirms" },
  ],
  "Supported Firms": [
    { label: "Apex Trader Funding", href: "#propfirms" },
    { label: "Tradeify", href: "#propfirms" },
    { label: "TopStep", href: "#propfirms" },
    { label: "Take Profit Trader", href: "#propfirms" },
  ],
  Resources: [
    { label: "Get Started", href: "/login" },
    { label: "Import Trades", href: "/login" },
    { label: "Contact", href: "mailto:hello@stayfunded.io" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-[#060a12] border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-15 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center mb-4">
              <img src="/logo.png" alt="StayFunded" className="h-8 w-auto" />
            </a>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              The trading journal built for prop firm traders who refuse to blow their accounts.
            </p>
            <p className="text-xs text-gray-700">
              Track. Analyze. Stay Funded.
            </p>
          </div>

          {/* Link cols */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-gray-500 hover:text-gray-300 text-sm transition-colors duration-200"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} StayFunded. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-600 text-xs">All systems operational</span>
          </div>
          <p className="text-gray-700 text-xs">
            Trading involves substantial risk of loss.
          </p>
        </div>
      </div>
    </footer>
  );
}
