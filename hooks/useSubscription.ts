'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import { supabase } from '@/lib/supabase'

export function useSubscription() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setPlan('free')
      setLoading(false)
      return
    }

    async function fetchPlan() {
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user!.id)
        .single()
      setPlan(data?.plan || 'free')
      setLoading(false)
    }

    fetchPlan()
  }, [user])

  return { plan, isPro: plan === 'pro', loading }
}
