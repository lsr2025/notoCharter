import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AppUser, UserRole } from '@/types'

function mapUser(user: User | null): AppUser | null {
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? '',
    role: (user.app_metadata?.role ?? 'executive') as UserRole,
    mining_right_ids: (user.app_metadata?.mining_right_ids as string[]) ?? [],
    full_name: user.user_metadata?.full_name ?? user.email ?? '',
  }
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(mapUser(data.user))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null))
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, loading, signIn, signOut }
}
