import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/trades',
  '/accounts',
  '/analytics',
  '/journal',
  '/import',
  '/checklist',
  '/calendar',
  '/settings',
  '/prop-firms',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for Next.js internals, static files, API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))

  if (isProtected) {
    // Check for Supabase session cookie
    const cookies = request.cookies.getAll()
    const hasSession = cookies.some(
      c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && c.value
    )

    if (!hasSession) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  // If logged in and hitting /login → redirect to dashboard
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(
    c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && c.value
  )
  if (hasSession && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
}
