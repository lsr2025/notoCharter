// NotoCharter™ — Dexie offline database
// Mirrors the key Supabase compliance tables for offline read/write.
// sync_queue stores mutations made while offline — replayed on reconnect.

import Dexie, { type EntityTable, type Table } from 'dexie'
import type {
  OwnershipExisting,
  HRDEmployee,
  MCDProject,
  SEDProject,
  EEWorkforceRow,
  ProcurementGoods,
} from '@/types'

// ─── Sync queue entry ─────────────────────────────────────────────────────────

export interface SyncQueueEntry {
  id?: number                              // auto-increment
  table: string
  action: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
  record_id?: string                       // for deletes
  created_at: number                       // epoch ms — preserves insertion order
}

// ─── Database class ───────────────────────────────────────────────────────────

class NotoCharterDB extends Dexie {
  // Compliance tables
  ownership_existing!: EntityTable<OwnershipExisting, 'id'>
  hrd_employees!:      EntityTable<HRDEmployee,       'id'>
  mcd_projects!:       EntityTable<MCDProject,        'id'>
  sed_projects!:       EntityTable<SEDProject,        'id'>
  ee_workforce_matrix!: EntityTable<EEWorkforceRow,   'id'>
  procurement_goods!:  EntityTable<ProcurementGoods,  'id'>

  // Mutation queue for offline operations
  sync_queue!: Table<SyncQueueEntry, number>

  constructor() {
    super('NotoCharterDB')
    this.version(1).stores({
      // Primary key first, then indexed fields
      ownership_existing:  'id, mining_right_id, calendar_year',
      hrd_employees:       'id, mining_right_id, calendar_year',
      mcd_projects:        'id, mining_right_id, calendar_year',
      sed_projects:        'id, mining_right_id, calendar_year',
      ee_workforce_matrix: 'id, mining_right_id, calendar_year',
      procurement_goods:   'id, mining_right_id, calendar_year',
      sync_queue:          '++id, table, created_at',
    })
  }
}

export const db = new NotoCharterDB()

// ─── Helper: is this table in our Dexie DB? ───────────────────────────────────

const OFFLINE_TABLES = new Set([
  'ownership_existing',
  'hrd_employees',
  'mcd_projects',
  'sed_projects',
  'ee_workforce_matrix',
  'procurement_goods',
])

export function getDexieTable(tableName: string): Table | null {
  if (!OFFLINE_TABLES.has(tableName)) return null
  return (db as unknown as Record<string, Table>)[tableName] ?? null
}
