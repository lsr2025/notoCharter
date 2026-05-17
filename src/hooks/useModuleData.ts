import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { db, getDexieTable } from '../lib/db'

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
  const [data, setData]     = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

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

    try {
      const { data: rows, error: err } = await query
      if (err) throw err

      const result = (rows ?? []) as unknown as T[]
      setData(result)
      setIsOffline(false)

      // Cache successful fetch in Dexie (fire-and-forget)
      const dexieTable = getDexieTable(table)
      if (dexieTable && result.length > 0) {
        dexieTable.bulkPut(result as never[]).catch(() => { /* ignore */ })
      }
    } catch {
      // Network or auth failure — fall back to Dexie cache
      const dexieTable = getDexieTable(table)
      if (dexieTable) {
        const cached = await dexieTable
          .where('mining_right_id').equals(miningRightId)
          .and(r => (r as Record<string, unknown>)['calendar_year'] === calendarYear)
          .toArray()
        setData(cached as unknown as T[])
        setIsOffline(true)
        setError(cached.length > 0 ? null : 'Offline — no cached data available')
      } else {
        setError('Unable to load data. Check your connection.')
      }
    }

    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, miningRightId, calendarYear, select, JSON.stringify(filters), JSON.stringify(orderBy)])

  useEffect(() => { load() }, [load])

  async function upsert(row: Partial<T>) {
    try {
      const { error: err } = await supabase.from(table).upsert(row)
      if (err) throw err
      await load()
    } catch {
      // Offline — queue mutation and update local state optimistically
      const dexieTable = getDexieTable(table)
      const isUpdate = Boolean(row.id)

      await db.sync_queue.add({
        table,
        action: isUpdate ? 'update' : 'insert',
        payload: row as Record<string, unknown>,
        record_id: row.id as string | undefined,
        created_at: Date.now(),
      })

      if (dexieTable) {
        await dexieTable.put(row as never).catch(() => { /* ignore */ })
      }

      setData(prev =>
        isUpdate
          ? prev.map(r => r['id'] === row.id ? { ...r, ...row } : r)
          : [...prev, { ...row, id: row.id ?? `temp_${Date.now()}` } as unknown as T]
      )
    }
  }

  async function remove(id: string) {
    try {
      const { error: err } = await supabase.from(table).delete().eq('id', id)
      if (err) throw err
      await load()
    } catch {
      // Offline — queue deletion and remove from local state
      await db.sync_queue.add({
        table,
        action: 'delete',
        payload: { id },
        record_id: id,
        created_at: Date.now(),
      })

      const dexieTable = getDexieTable(table)
      if (dexieTable) {
        await dexieTable.delete(id).catch(() => { /* ignore */ })
      }

      setData(prev => prev.filter(r => r['id'] !== id))
    }
  }

  return { data, loading, error, isOffline, upsert, remove, reload: load }
}
