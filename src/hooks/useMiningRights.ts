import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { MiningRight } from '@/types'

export function useMiningRights() {
  const [rights, setRights] = useState<MiningRight[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [])

  return { rights, selected, setSelected, loading }
}
