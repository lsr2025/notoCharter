import { useState, useEffect } from 'react'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { DEMO_MINING_RIGHTS } from '@/lib/demo-data'
import type { MiningRight } from '@/types'

export function useMiningRights() {
  const [rights, setRights] = useState<MiningRight[]>(DEMO_MODE ? DEMO_MINING_RIGHTS : [])
  const [selected, setSelected] = useState<string | null>(DEMO_MODE ? DEMO_MINING_RIGHTS[0].id : null)
  const [loading, setLoading] = useState(!DEMO_MODE)

  useEffect(() => {
    if (DEMO_MODE) return

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
