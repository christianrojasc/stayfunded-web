"use client";

const links = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Prop Firms", href: "/prop-firms-overview" },
  ],
  "Supported Firms": [
    { label: "Apex Trader Funding", href: "/prop-firms-overview" },
    { label: "Tradeify", href: "/prop-firms-overview" },
    { label: "TopStep", href: "/prop-firms-overview" },
    { label: "Take Profit Trader", href: "/prop-firms-overview" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Get Started", href: "/login" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
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
                      {...(item.href.startsWith("mailto:") || item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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

        {/* Trust signals */}
        <div className="border-t border-white/5 pt-8 pb-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">📍 Based in Miami, FL</span>
          <span className="flex items-center gap-1.5">🔒 256-bit SSL Encrypted</span>
          <span className="flex items-center gap-1.5">💳 Payments via Stripe</span>
          <span className="flex items-center gap-1.5">🛡️ SOC 2 Compliant Hosting</span>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
