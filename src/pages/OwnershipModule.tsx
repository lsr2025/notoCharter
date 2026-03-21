import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useMiningRights } from '@/hooks/useMiningRights'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/Button'
import { Input, Select } from '@/components/FormField'
import { ComplianceBadge } from '@/components/ComplianceBadge'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { OwnershipExisting } from '@/types'

const YEAR = new Date().getFullYear() - 1

const EMPTY: Omit<OwnershipExisting, 'id'> = {
  mining_right_id: '',
  calendar_year: YEAR,
  shareholder_name: '',
  shareholder_type: 'hdp_individual',
  bee_percentage: 0,
  effective_voting_rights: 0,
  effective_economic_interest: 0,
  financing_method: 'own_funds',
  loan_balance: null,
  notes: null,
}

export function OwnershipModule() {
  const { rights, selected, setSelected } = useMiningRights()
  const [rows, setRows] = useState<OwnershipExisting[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<OwnershipExisting, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const totalBee = rows.reduce((s, r) => s + r.bee_percentage, 0)
  const compliant = totalBee >= 26

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    supabase
      .from('ownership_existing')
      .select('*')
      .eq('mining_right_id', selected)
      .eq('calendar_year', YEAR)
      .order('shareholder_name')
      .then(({ data }) => {
        setRows((data ?? []) as OwnershipExisting[])
        setLoading(false)
      })
  }, [selected])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    const payload = { ...form, mining_right_id: selected }
    if (editId) {
      await supabase.from('ownership_existing').update(payload).eq('id', editId)
    } else {
      await supabase.from('ownership_existing').insert(payload)
    }
    const { data } = await supabase
      .from('ownership_existing')
      .select('*')
      .eq('mining_right_id', selected)
      .eq('calendar_year', YEAR)
    setRows((data ?? []) as OwnershipExisting[])
    setForm({ ...EMPTY, mining_right_id: selected })
    setEditId(null)
    setShowForm(false)
    setSaving(false)
  }

  const handleEdit = (row: OwnershipExisting) => {
    setForm(row)
    setEditId(row.id)
    setShowForm(true)
  }

  const handleDelete = async (row: OwnershipExisting) => {
    if (!confirm(`Delete ${row.shareholder_name}?`)) return
    await supabase.from('ownership_existing').delete().eq('id', row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
  }

  return (
    <div>
      <PageHeader
        title="Ownership"
        subtitle="BEE shareholding structure — existing and new mining rights"
        dmrRef="Tables A–G"
        actions={
          <div className="flex items-center gap-3">
            {rights.length > 0 && (
              <select
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                value={selected ?? ''}
                onChange={e => setSelected(e.target.value)}
              >
                {rights.map(r => (
                  <option key={r.id} value={r.id}>{r.mr_number}</option>
                ))}
              </select>
            )}
            <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY, mining_right_id: selected ?? '' }) }}>
              + Add Shareholder
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {/* Compliance status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody className="text-center py-4">
              <div className="text-xs text-ink-muted font-mono mb-1">Total BEE %</div>
              <div className={`text-3xl font-bold font-display ${compliant ? 'text-compliant' : 'text-noncompliant'}`}>
                {formatPercent(totalBee)}
              </div>
              <div className="text-xs text-ink-muted mt-1">Threshold: 26% (existing rights)</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <div className="text-xs text-ink-muted font-mono mb-1">Ownership Element</div>
              <div className="mt-2">
                <ComplianceBadge tier={compliant ? 'compliant' : 'non_compliant'} size="lg" />
              </div>
              <div className="text-xs text-ink-muted mt-2 font-mono">Ring-Fenced</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-4">
              <div className="text-xs text-ink-muted font-mono mb-1">Shareholders on Record</div>
              <div className="text-3xl font-bold font-display text-ink">{rows.length}</div>
              <div className="text-xs text-ink-muted mt-1">For {YEAR}</div>
            </CardBody>
          </Card>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-ink">{editId ? 'Edit' : 'Add'} Shareholder — Table A</h3>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Shareholder Name" value={form.shareholder_name}
                  onChange={e => setForm(f => ({ ...f, shareholder_name: e.target.value }))} required />

                <Select label="Shareholder Type" value={form.shareholder_type}
                  onChange={e => setForm(f => ({ ...f, shareholder_type: e.target.value as OwnershipExisting['shareholder_type'] }))}>
                  <option value="hdp_individual">HDP Individual</option>
                  <option value="esop">ESOP</option>
                  <option value="host_community">Host Community</option>
                  <option value="bee_entrepreneur">BEE Entrepreneur</option>
                  <option value="other">Other</option>
                </Select>

                <Input label="BEE Shareholding %" type="number" step="0.01" min="0" max="100"
                  value={form.bee_percentage}
                  onChange={e => setForm(f => ({ ...f, bee_percentage: parseFloat(e.target.value) || 0 }))} required />

                <Input label="Effective Voting Rights %" type="number" step="0.01" min="0" max="100"
                  value={form.effective_voting_rights}
                  onChange={e => setForm(f => ({ ...f, effective_voting_rights: parseFloat(e.target.value) || 0 }))} />

                <Input label="Effective Economic Interest %" type="number" step="0.01" min="0" max="100"
                  value={form.effective_economic_interest}
                  onChange={e => setForm(f => ({ ...f, effective_economic_interest: parseFloat(e.target.value) || 0 }))} />

                <Select label="Financing Method" value={form.financing_method}
                  onChange={e => setForm(f => ({ ...f, financing_method: e.target.value as OwnershipExisting['financing_method'] }))}>
                  <option value="own_funds">Own Funds</option>
                  <option value="third_party_loan">Third-Party Loan</option>
                  <option value="vendor_financing">Vendor Financing</option>
                  <option value="equity_equivalent">Equity Equivalent</option>
                </Select>

                <Input label="Loan Balance (R)" type="number" step="0.01" min="0"
                  value={form.loan_balance ?? ''}
                  onChange={e => setForm(f => ({ ...f, loan_balance: e.target.value ? parseFloat(e.target.value) : null }))} />

                <div className="md:col-span-2 lg:col-span-3 flex gap-3 justify-end">
                  <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</Button>
                  <Button type="submit" loading={saving}>{editId ? 'Update' : 'Save'} Shareholder</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-ink">Table A — Existing Mining Rights: BEE Shareholding</h3>
          </CardHeader>
          <CardBody className="p-0">
            <DataTable
              loading={loading}
              data={rows}
              keyField="id"
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="No shareholders captured yet. Click '+ Add Shareholder' to begin."
              columns={[
                { key: 'shareholder_name', header: 'Shareholder' },
                { key: 'shareholder_type', header: 'Type',
                  render: r => r.shareholder_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
                { key: 'bee_percentage', header: 'BEE %', align: 'right',
                  render: r => <span className="font-mono">{formatPercent(r.bee_percentage)}</span> },
                { key: 'effective_voting_rights', header: 'Voting Rights %', align: 'right',
                  render: r => <span className="font-mono">{formatPercent(r.effective_voting_rights)}</span> },
                { key: 'effective_economic_interest', header: 'Econ. Interest %', align: 'right',
                  render: r => <span className="font-mono">{formatPercent(r.effective_economic_interest)}</span> },
                { key: 'financing_method', header: 'Financing',
                  render: r => r.financing_method.replace(/_/g, ' ') },
                { key: 'loan_balance', header: 'Loan Balance', align: 'right',
                  render: r => r.loan_balance != null ? formatCurrency(r.loan_balance) : '—' },
              ]}
            />
          </CardBody>
        </Card>

        {/* Portfolio of Evidence */}
        <Card>
          <CardBody>
            <h3 className="font-semibold text-ink mb-3">Portfolio of Evidence Required (Table A)</h3>
            <ul className="space-y-1.5 text-sm text-ink-muted">
              {[
                'Share certificates',
                'Shareholders agreement',
                'Memorandum of incorporation',
                'Board resolutions and minutes (extracts signed off by Company Secretary)',
                'Signed attendance registers',
                'Audited financial statements',
                'Exit agreements (where BEE shareholder has exited)',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-brand-500 mt-0.5">○</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
