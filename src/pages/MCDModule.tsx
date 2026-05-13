import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useMiningRights } from '@/hooks/useMiningRights'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/Button'
import { Input, Select, TextArea } from '@/components/FormField'
import { ComplianceBadge } from '@/components/ComplianceBadge'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { MCDProject, CommunityType, ComplianceTier } from '@/types'

const YEAR = new Date().getFullYear() - 1

const EMPTY: Omit<MCDProject, 'id'> = {
  mining_right_id: '',
  calendar_year: YEAR,
  project_description: '',
  slp_reference: '',
  municipality: '',
  province: '',
  community_type: 'mine_community',
  start_date: '',
  end_date: '',
  committed_budget: 0,
  actual_spend: 0,
  status: 'in_progress',
  notes: null,
}

export function MCDModule() {
  const { rights, selected, setSelected } = useMiningRights()
  const [projects, setProjects] = useState<MCDProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MCDProject, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const totalBudget = projects.reduce((s, p) => s + p.committed_budget, 0)
  const totalSpend = projects.reduce((s, p) => s + p.actual_spend, 0)
  const spendPct = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0
  const compliant = projects.length > 0 && projects.every(p => p.actual_spend >= p.committed_budget * 0.8)
  const tier: ComplianceTier = projects.length === 0 ? 'ring_fenced' : compliant ? 'compliant' : 'non_compliant'

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    supabase.from('mcd_projects').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR).order('project_description')
      .then(({ data }) => { setProjects((data ?? []) as MCDProject[]); setLoading(false) })
  }, [selected])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    const payload = { ...form, mining_right_id: selected }
    if (editId) {
      await supabase.from('mcd_projects').update(payload).eq('id', editId)
    } else {
      await supabase.from('mcd_projects').insert(payload)
    }
    const { data } = await supabase.from('mcd_projects').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR)
    setProjects((data ?? []) as MCDProject[])
    setForm({ ...EMPTY, mining_right_id: selected })
    setEditId(null); setShowForm(false); setSaving(false)
  }

  const handleEdit = (row: MCDProject) => { setForm(row); setEditId(row.id); setShowForm(true) }
  const handleDelete = async (row: MCDProject) => {
    if (!confirm(`Delete project "${row.project_description}"?`)) return
    await supabase.from('mcd_projects').delete().eq('id', row.id)
    setProjects(prev => prev.filter(p => p.id !== row.id))
  }

  const statusColor = (s: MCDProject['status']) => ({
    not_started: 'text-ink-muted', in_progress: 'text-brand-600',
    completed: 'text-compliant', delayed: 'text-noncompliant',
  })[s]

  return (
    <div>
      <PageHeader
        title="Mine Community Development"
        subtitle="SLP project register — spend vs committed budget"
        dmrRef="Table S"
        actions={
          <div className="flex items-center gap-3">
            {rights.length > 0 && (
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                value={selected ?? ''} onChange={e => setSelected(e.target.value)}>
                {rights.map(r => <option key={r.id} value={r.id}>{r.mr_number}</option>)}
              </select>
            )}
            <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY, mining_right_id: selected ?? '' }) }}>
              + Add Project
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Committed Budget', value: formatCurrency(totalBudget), sub: 'SLP commitment' },
            { label: 'Actual Spend', value: formatCurrency(totalSpend), sub: `${formatPercent(spendPct)} of budget` },
            { label: 'Active Projects', value: projects.length, sub: `For ${YEAR}` },
            { label: 'MCD Status', value: <ComplianceBadge tier={tier} />, sub: 'Ring-Fenced element' },
          ].map((kpi, i) => (
            <Card key={i}><CardBody className="py-4">
              <div className="text-xs text-ink-muted font-mono mb-1">{kpi.label}</div>
              <div className="text-xl font-bold font-display text-ink">{kpi.value}</div>
              <div className="text-xs text-ink-muted mt-1">{kpi.sub}</div>
            </CardBody></Card>
          ))}
        </div>

        {/* Spend progress */}
        <Card><CardBody>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-ink">Spend vs Committed Budget</span>
            <span className="text-sm font-mono font-bold">
              {formatCurrency(totalSpend)} / {formatCurrency(totalBudget)}
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${compliant ? 'bg-compliant' : spendPct >= 60 ? 'bg-ringfenced' : 'bg-noncompliant'}`}
              style={{ width: `${Math.min(100, spendPct)}%` }}
            />
          </div>
        </CardBody></Card>

        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader><h3 className="font-semibold text-ink">{editId ? 'Edit' : 'Add'} SLP Project — Table S</h3></CardHeader>
            <CardBody>
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <TextArea label="Project Description" value={form.project_description}
                    onChange={e => setForm(f => ({ ...f, project_description: e.target.value }))} required />
                </div>
                <Input label="SLP Reference" value={form.slp_reference}
                  onChange={e => setForm(f => ({ ...f, slp_reference: e.target.value }))} required />
                <Input label="Municipality" value={form.municipality}
                  onChange={e => setForm(f => ({ ...f, municipality: e.target.value }))} required />
                <Input label="Province" value={form.province}
                  onChange={e => setForm(f => ({ ...f, province: e.target.value }))} required />
                <Select label="Community Type" value={form.community_type}
                  onChange={e => setForm(f => ({ ...f, community_type: e.target.value as CommunityType }))}>
                  <option value="mine_community">Mine Community</option>
                  <option value="adjacent_community">Adjacent Community</option>
                  <option value="labour_sending_area">Labour Sending Area</option>
                </Select>
                <Input label="Start Date" type="date" value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
                <Input label="End Date" type="date" value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
                <Input label="Committed Budget (R)" type="number" step="0.01" min="0" value={form.committed_budget}
                  onChange={e => setForm(f => ({ ...f, committed_budget: parseFloat(e.target.value) || 0 }))} required />
                <Input label="Actual Spend (R)" type="number" step="0.01" min="0" value={form.actual_spend}
                  onChange={e => setForm(f => ({ ...f, actual_spend: parseFloat(e.target.value) || 0 }))} required />
                <Select label="Status" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as MCDProject['status'] }))}>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </Select>
                <div className="md:col-span-2 lg:col-span-3 flex gap-3 justify-end">
                  <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</Button>
                  <Button type="submit" loading={saving}>{editId ? 'Update' : 'Save'} Project</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader><h3 className="font-semibold text-ink">Table S — SLP Project Register</h3></CardHeader>
          <CardBody className="p-0">
            <DataTable
              loading={loading} data={projects} keyField="id"
              onEdit={handleEdit} onDelete={handleDelete}
              emptyMessage="No SLP projects captured. Click '+ Add Project' to begin."
              columns={[
                { key: 'project_description', header: 'Project' },
                { key: 'slp_reference', header: 'SLP Ref' },
                { key: 'municipality', header: 'Municipality' },
                { key: 'community_type', header: 'Community', render: r => r.community_type.replace(/_/g,' ') },
                { key: 'committed_budget', header: 'Budget (R)', align: 'right', render: r => <span className="font-mono">{formatCurrency(r.committed_budget)}</span> },
                { key: 'actual_spend', header: 'Spend (R)', align: 'right', render: r => <span className="font-mono">{formatCurrency(r.actual_spend)}</span> },
                { key: 'status', header: 'Status', render: r => (
                  <span className={`font-medium capitalize ${statusColor(r.status)}`}>
                    {r.status.replace(/_/g,' ')}
                  </span>
                )},
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
