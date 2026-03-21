import { useState, useEffect } from 'react'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { DEMO_AUDIT_LOG } from '@/lib/demo-data'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { DataTable } from '@/components/DataTable'
import type { AuditLogEntry } from '@/types'

export function AuditTrail() {
  const [entries, setEntries] = useState<AuditLogEntry[]>(DEMO_MODE ? DEMO_AUDIT_LOG : [])
  const [loading, setLoading] = useState(!DEMO_MODE)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (DEMO_MODE) return
    supabase.from('audit_log').select('*')
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => { setEntries((data ?? []) as AuditLogEntry[]); setLoading(false) })
  }, [])

  const filtered = entries.filter(e =>
    !filter ||
    e.table_name.includes(filter.toLowerCase()) ||
    e.user_email.includes(filter.toLowerCase()) ||
    e.action.includes(filter.toUpperCase())
  )

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        subtitle="Full change log — every INSERT, UPDATE, DELETE with user and timestamp"
        dmrRef="Audit Log"
        actions={
          <input
            type="search"
            placeholder="Filter by table, user, action…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-ink outline-none focus:ring-2 focus:ring-brand-500 w-64"
          />
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Events', value: entries.length },
            { label: 'Tables Modified', value: new Set(entries.map(e => e.table_name)).size },
            { label: 'Active Users', value: new Set(entries.map(e => e.user_email)).size },
          ].map((s, i) => (
            <Card key={i}><CardBody className="py-4 text-center">
              <div className="text-xs text-ink-muted font-mono mb-1">{s.label}</div>
              <div className="text-3xl font-bold font-display text-ink">{s.value}</div>
            </CardBody></Card>
          ))}
        </div>

        <Card>
          <CardHeader><h3 className="font-semibold text-ink">Change Log (last 200 entries)</h3></CardHeader>
          <CardBody className="p-0">
            <DataTable
              loading={loading}
              data={filtered}
              keyField="id"
              emptyMessage="No audit log entries yet."
              columns={[
                { key: 'created_at', header: 'Timestamp',
                  render: r => <span className="font-mono text-xs">{new Date(r.created_at).toLocaleString('en-ZA')}</span> },
                { key: 'user_email', header: 'User',
                  render: r => <span className="text-xs">{r.user_email}</span> },
                { key: 'action', header: 'Action',
                  render: r => (
                    <span className={`font-mono text-xs font-bold ${
                      r.action === 'INSERT' ? 'text-compliant' :
                      r.action === 'DELETE' ? 'text-noncompliant' :
                      'text-ringfenced'
                    }`}>{r.action}</span>
                  )},
                { key: 'table_name', header: 'Table',
                  render: r => <span className="font-mono text-xs">{r.table_name}</span> },
                { key: 'record_id', header: 'Record ID',
                  render: r => <span className="font-mono text-xs text-ink-muted">{r.record_id.substring(0, 8)}…</span> },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
