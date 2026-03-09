'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import { supabase } from '@/lib/supabase'

export function useSubscription() {
  const { user, loading: authLoading } = useAuth()
  const [plan, setPlan] = useState<string>('free')
  const [planLoading, setPlanLoading] = useState(true)

  useEffect(() => {
    // Wait for auth to finish loading before deciding plan
    if (authLoading) return

    if (!user) {
      setPlan('free')
      setPlanLoading(false)
      return
    }

    async function fetchPlan() {
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user!.id)
        .single()
      setPlan(data?.plan || 'free')
      setPlanLoading(false)
    }

    fetchPlan()
  }, [user, authLoading])

  return { plan, isPro: plan === 'pro', loading: authLoading || planLoading }
}
