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
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Styles: Tailwind uses inline styles throughout
  "style-src 'self' 'unsafe-inline'",
  // Images: allow data: URIs (chart libraries), blob: (canvas exports)
  "img-src 'self' data: blob:",
  // Fonts: self only
  "font-src 'self'",
  // API / WebSocket connections: allow Supabase (REST + Realtime)
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
  // No iframes from external origins
  "frame-ancestors 'none'",
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
]

const nextConfig = {
  allowedDevOrigins: ['10.145.203.210', '100.94.78.32', 'localhost'],
  images: {
    unoptimized: true,
  },
  // Suppress the 'use client' hydration warnings in dev
  reactStrictMode: true,

  async headers() {
    // Disable security headers in development (Safari blocks CSS/JS over HTTP with strict CSP)
    if (process.env.NODE_ENV === 'development') return []
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
