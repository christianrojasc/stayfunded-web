'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  authError: string | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  authError: null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
})

// ── Protected routes ─────────────────────────────────────────────────────────

const PROTECTED_ROUTES = [
  '/dashboard', '/trades', '/accounts', '/analytics',
  '/journal', '/import', '/checklist', '/calendar',
  '/settings', '/prop-firms',
]

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null)
  const [session, setSession]     = useState<Session | null>(null)
  const [loading, setLoading]     = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      // Supabase unreachable — set error, do NOT allow app access
      setUser(null)
      setSession(null)
      setAuthError('Unable to connect to authentication service. Please try again later.')
      setLoading(false)
    })

    // Failsafe: never stay loading forever
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setAuthError(null)
        setLoading(false)
      }
    )

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  // ── Route protection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return

    const isLoginPage = pathname === '/login'

    // Redirect authenticated users away from login
    if (user && isLoginPage) {
      router.replace('/dashboard')
    }

    // Redirect unauthenticated users away from protected routes
    if (!user && isProtectedRoute(pathname)) {
      router.replace('/login')
    }
  }, [user, loading, pathname, router])

  // ── Auth methods ──────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, authError, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext)
