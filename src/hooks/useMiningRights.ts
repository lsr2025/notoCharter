import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { MiningRight } from '@/types'

export function useMiningRights() {
  const { user } = useAuth()
  const [rights, setRights] = useState<MiningRight[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('mining_rights')
      .select('*')
      .eq('is_active', true)
      .order('mr_number')
      .then(({ data }) => {
        const rows = (data ?? []) as MiningRight[]
        setRights(rows)
        if (rows.length > 0 && !selected) setSelected(rows[0].id)
        setLoading(false)
      })
  }, [user?.id])

  return { rights, selected, setSelected, selectedYear, setSelectedYear, loading }
}
