import { useState, useEffect } from 'react'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import type { AppUser, UserRole } from '@/types'
import type { User } from '@supabase/supabase-js'

const DEMO_USER: AppUser = {
  id: 'demo-user',
  email: 'compliance@npc-cimpor.co.za',
  full_name: 'P. Naidoo',
  role: 'compliance_officer',
  mining_right_ids: ['mr-001', 'mr-002', 'mr-003'],
}

function roleFromMeta(user: User): UserRole {
  return (user.user_metadata?.role as UserRole) ?? 'executive'
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(DEMO_MODE ? DEMO_USER : null)
  const [loading, setLoading] = useState(!DEMO_MODE)

  useEffect(() => {
    if (DEMO_MODE) return

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

  const signIn = (email: string, password: string) => {
    if (DEMO_MODE) {
      setUser(DEMO_USER)
      return Promise.resolve({ data: {}, error: null })
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = () => {
    if (DEMO_MODE) {
      return Promise.resolve({ error: null })
    }
    return supabase.auth.signOut()
  }

  return { user, loading, signIn, signOut }
}
