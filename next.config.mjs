/** @type {import('next').NextConfig} */

// Supabase host for CSP (strip trailing slash, fall back to wildcard)
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : '*.supabase.co'

const ContentSecurityPolicy = [
  // Only load resources from self by default
  "default-src 'self'",
  // Scripts: Next.js + framer-motion need unsafe-inline / unsafe-eval in dev;
  // keep both for now — tighten with nonces in a future hardening pass.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://s.tradingview.com",
  // Styles: Tailwind uses inline styles throughout
  "style-src 'self' 'unsafe-inline'",
  // Images: allow data: URIs (chart libraries), blob: (canvas exports)
  "img-src 'self' data: blob:",
  // Fonts: self only
  "font-src 'self'",
  // API / WebSocket connections: allow Supabase (REST + Realtime)
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://s3.tradingview.com https://s.tradingview.com https://widget-data.tradingview.com`,
  // No iframes from external origins
  "frame-ancestors 'none'",
  // TradingView widget frames
  "frame-src 'self' https://s.tradingview.com https://www.tradingview.com",
  // No plugins
  "object-src 'none'",
  // Upgrade insecure requests in production
  // "upgrade-insecure-requests", // disabled for dev (no HTTPS)
].join('; ')

const securityHeaders = [
  // Clickjacking protection
  { key: 'X-Frame-Options', value: 'DENY' },
  // MIME-type sniffing protection
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referrer: send origin + path only to same-origin; just origin to cross-origin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Legacy XSS filter (IE/Edge compat)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Disable access to camera, mic, geolocation by default
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Full Content Security Policy
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  // HSTS — force HTTPS for 2 years
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig = {
  allowedDevOrigins: ['10.145.203.210', '100.94.78.32', 'localhost'],
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,

  // Tree-shake heavy dependencies
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', 'framer-motion'],
  },

  async headers() {
    // Disable CSP headers when serving over HTTP (Safari blocks CSS/JS with strict CSP on non-HTTPS).
    // Security headers will apply once deployed with HTTPS.
    const isLocal = !process.env.DEPLOY_URL && !process.env.VERCEL_URL
    if (process.env.NODE_ENV === 'development' || isLocal) return []
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
