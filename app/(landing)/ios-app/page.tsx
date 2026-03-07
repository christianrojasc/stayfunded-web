import { Metadata } from "next";

export const metadata: Metadata = {
  title: "iOS App — StayFunded",
  description: "The only professional futures trading journal with a companion iOS app. Import trades via CSV, review your journal anywhere.",
};

export default function IOSAppPage() {
  return (
    <main className="min-h-screen bg-[#050810] text-white">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/20 bg-green-500/5 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">Coming Soon</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
          The only trading journal<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">with a companion iOS app.</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
          Most trading journals trap you at your desk. StayFunded brings your journal, drawdown stats, and trade history to your iPhone — so your edge travels with you.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-400 text-white font-bold text-base shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300">
            Join the Waitlist
          </a>
          <a href="/features" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-gray-300 hover:text-white hover:border-white/20 font-semibold text-base transition-all duration-300">
            See All Features
          </a>
        </div>

        {/* Phone mockup placeholder */}
        <div className="relative max-w-xs mx-auto">
          <div className="relative rounded-[3rem] border-2 border-white/10 bg-[#0A0E17] shadow-[0_0_80px_rgba(74,222,80,0.15)] overflow-hidden" style={{aspectRatio:"9/19.5"}}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#050810] rounded-b-2xl z-10" />
            <div className="p-6 pt-12 flex flex-col gap-4">
              {/* Mock header */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500">Today</div>
                  <div className="text-2xl font-black text-green-400">+$847</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-green-400 rounded-sm" />
                </div>
              </div>
              {/* Mock chart bar */}
              <div className="flex items-end gap-1 h-16">
                {[60,40,75,55,90,45,80,65,88,72].map((h,i) => (
                  <div key={i} className="flex-1 rounded-t-sm" style={{height:`${h}%`, background: h > 70 ? 'rgba(74,222,80,0.6)' : 'rgba(74,222,80,0.2)'}} />
                ))}
              </div>
              {/* Mock trades */}
              {[
                { symbol:"ES", side:"Long", pnl:"+$312", time:"09:32" },
                { symbol:"NQ", side:"Short", pnl:"+$535", time:"11:14" },
                { symbol:"ES", side:"Long", pnl:"-$124", time:"13:45" },
              ].map((t,i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold text-gray-300">{t.symbol}</div>
                    <div>
                      <div className="text-xs font-semibold text-white">{t.symbol} Futures</div>
                      <div className="text-[10px] text-gray-500">{t.side} · {t.time}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${t.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{t.pnl}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Glow */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-16 bg-green-500/20 blur-3xl rounded-full" />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-3">Built for traders on the move.</h2>
        <p className="text-gray-500 text-center mb-12">Everything from the web app — in your pocket.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Seamless Import",
              desc: "Import your Tradovate CSV on desktop and review your full trade history, P&L, and stats directly from the iOS app.",
            },
            {
              title: "Drawdown Snapshot",
              desc: "Review exactly where you stand on daily loss and max drawdown after each session. Know your risk before you open the platform.",
            },
            {
              title: "Session Clock",
              desc: "Track your 6 PM–5 PM EST futures session from anywhere. Know exactly how much time and risk you have left.",
            },
            {
              title: "Trade Review",
              desc: "Swipe through your trades, add notes, tag mistakes, and tag setups — all from your phone during lunch or between sessions.",
            },
            {
              title: "Equity Curve",
              desc: "Full equity curve, daily P&L chart, and streak data visualized beautifully for a 6-inch screen.",
            },
            {
              title: "Prop Firm Rules",
              desc: "Your account rules travel with you. Daily loss limits, consistency scores, and profit targets always one tap away.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-green-500/20 transition-colors">
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto rounded-3xl border border-green-500/20 bg-green-500/5 p-12">
          <h2 className="text-3xl font-black mb-4">Be first when it drops.</h2>
          <p className="text-gray-400 mb-8">Join the waitlist. iOS beta launching soon to StayFunded members.</p>
          <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-green-400 text-white font-bold text-base shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300">
            Get Early Access
          </a>
        </div>
      </section>
    </main>
  );
}
