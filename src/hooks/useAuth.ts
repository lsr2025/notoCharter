import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { AppUser, UserRole } from '@/types'
import type { User } from '@supabase/supabase-js'

function roleFromMeta(user: User): UserRole {
  return (user.user_metadata?.role as UserRole) ?? 'executive'
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          full_name: session.user.user_metadata?.full_name ?? session.user.email ?? '',
          role: roleFromMeta(session.user),
          mining_right_ids: session.user.user_metadata?.mining_right_ids ?? [],
        })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          full_name: session.user.user_metadata?.full_name ?? session.user.email ?? '',
          role: roleFromMeta(session.user),
          mining_right_ids: session.user.user_metadata?.mining_right_ids ?? [],
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signOut = () => supabase.auth.signOut()

  return { user, loading, signIn, signOut }
}
