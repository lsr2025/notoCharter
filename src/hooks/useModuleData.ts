import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface UseModuleDataOptions {
  table: string
  miningRightId: string | null
  calendarYear: number
  select?: string
  orderBy?: { column: string; ascending?: boolean }
  filters?: Record<string, string | number | boolean>
}

export function useModuleData<T extends Record<string, unknown>>({
  table,
  miningRightId,
  calendarYear,
  select = '*',
  orderBy,
  filters = {},
}: UseModuleDataOptions) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!miningRightId) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    let query = supabase
      .from(table)
      .select(select)
      .eq('mining_right_id', miningRightId)
      .eq('calendar_year', calendarYear)

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value)
    }

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }

    const { data: rows, error: err } = await query
    if (err) {
      setError(err.message)
    } else {
      setData((rows ?? []) as unknown as T[])
    }
    setLoading(false)
  }, [table, miningRightId, calendarYear, select, JSON.stringify(filters), JSON.stringify(orderBy)])

  useEffect(() => { load() }, [load])

  async function upsert(row: Partial<T>) {
    const { error: err } = await supabase.from(table).upsert(row)
    if (err) throw new Error(err.message)
    await load()
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from(table).delete().eq('id', id)
    if (err) throw new Error(err.message)
    await load()
  }

  return { data, loading, error, upsert, remove, reload: load }
}
