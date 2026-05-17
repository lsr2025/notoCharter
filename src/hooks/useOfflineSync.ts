// Processes the Dexie sync_queue whenever the app comes back online.
// Call once at the root of the app (App.tsx).

import { useEffect, useCallback } from 'react'
import { useNetworkStatus } from './useNetworkStatus'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export function useOfflineSync() {
  const { online } = useNetworkStatus()

  const processQueue = useCallback(async () => {
    const entries = await db.sync_queue.orderBy('created_at').toArray()
    if (entries.length === 0) return

    console.info(`[NotoCharter offline sync] Processing ${entries.length} queued mutation(s)…`)

    for (const entry of entries) {
      try {
        if (entry.action === 'delete') {
          const { error } = await supabase
            .from(entry.table)
            .delete()
            .eq('id', entry.record_id!)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from(entry.table)
            .upsert(entry.payload)
          if (error) throw error
        }
        await db.sync_queue.delete(entry.id!)
        console.info(`[offline sync] ✓ ${entry.action} on ${entry.table}`)
      } catch (err) {
        console.error(`[offline sync] ✗ failed on ${entry.table}:`, err)
        break // Stop — will retry when back online again
      }
    }
  }, [])

  useEffect(() => {
    if (online) processQueue()
  }, [online, processQueue])

  return { processQueue }
}
