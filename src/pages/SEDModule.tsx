import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useMiningRights } from '@/hooks/useMiningRights'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/Button'
import { Input, Select, TextArea } from '@/components/FormField'
import { formatCurrency } from '@/lib/utils'
import type { SEDProject } from '@/types'

const YEAR = new Date().getFullYear() - 1

const EMPTY: Omit<SEDProject, 'id'> = {
  mining_right_id: '',
  calendar_year: YEAR,
  project_description: '',
  licence_type: 'diamonds_act',
  municipality: '',
  province: '',
  start_date: '',
  end_date: '',
  approved_budget: 0,
  actual_spend: 0,
  progress_vs_plan: '',
  status: 'in_progress',
}

export function SEDModule() {
  const { rights, selected, setSelected } = useMiningRights()
  const [projects, setProjects] = useState<SEDProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SEDProject, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    supabase.from('sed_projects').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR)
      .order('project_description')
      .then(({ data }) => { setProjects((data ?? []) as SEDProject[]); setLoading(false) })
  }, [selected])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    const payload = { ...form, mining_right_id: selected }
    if (editId) {
      await supabase.from('sed_projects').update(payload).eq('id', editId)
    } else {
      await supabase.from('sed_projects').insert(payload)
    }
    const { data } = await supabase.from('sed_projects').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR)
    setProjects((data ?? []) as SEDProject[])
    setForm({ ...EMPTY, mining_right_id: selected })
    setEditId(null); setShowForm(false); setSaving(false)
  }

  const handleEdit = (row: SEDProject) => { setForm(row); setEditId(row.id); setShowForm(true) }
  const handleDelete = async (row: SEDProject) => {
    if (!confirm(`Delete "${row.project_description}"?`)) return
    await supabase.from('sed_projects').delete().eq('id', row.id)
    setProjects(prev => prev.filter(p => p.id !== row.id))
  }

  return (
    <div>
      <PageHeader
        title="Socio-Economic Development (SED)"
        subtitle="Applicable to Diamonds Act / Precious Metals Act licence holders"
        dmrRef="Table X"
        actions={
          <div className="flex items-center gap-3">
            {rights.length > 0 && (
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                value={selected ?? ''} onChange={e => setSelected(e.target.value)}>
                {rights.map(r => <option key={r.id} value={r.id}>{r.mr_number}</option>)}
              </select>
            )}
            <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY, mining_right_id: selected ?? '' }) }}>
              + Add SED Project
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        <div className="rounded-xl bg-brand-50 border border-brand-200 px-5 py-3 text-sm text-brand-800">
          <strong>Note:</strong> Table X applies only where Diamonds Act or Precious Metals Act licences are held. If not applicable, this module can remain empty without affecting the overall compliance score.
        </div>

        {showForm && (
          <Card>
            <CardHeader><h3 className="font-semibold text-ink">{editId ? 'Edit' : 'Add'} SED Project — Table X</h3></CardHeader>
            <CardBody>
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <TextArea label="Project Description" value={form.project_description}
                    onChange={e => setForm(f => ({ ...f, project_description: e.target.value }))} required />
                </div>
                <Select label="Licence Type" value={form.licence_type}
                  onChange={e => setForm(f => ({ ...f, licence_type: e.target.value as SEDProject['licence_type'] }))}>
                  <option value="diamonds_act">Diamonds Act</option>
                  <option value="precious_metals_act">Precious Metals Act</option>
                </Select>
                <Input label="Municipality" value={form.municipality}
                  onChange={e => setForm(f => ({ ...f, municipality: e.target.value }))} required />
                <Input label="Province" value={form.province}
                  onChange={e => setForm(f => ({ ...f, province: e.target.value }))} required />
                <Input label="Start Date" type="date" value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
                <Input label="End Date" type="date" value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
                <Input label="Approved Budget (R)" type="number" step="0.01" min="0" value={form.approved_budget}
                  onChange={e => setForm(f => ({ ...f, approved_budget: parseFloat(e.target.value) || 0 }))} required />
                <Input label="Actual Spend (R)" type="number" step="0.01" min="0" value={form.actual_spend}
                  onChange={e => setForm(f => ({ ...f, actual_spend: parseFloat(e.target.value) || 0 }))} required />
                <Select label="Status" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as SEDProject['status'] }))}>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </Select>
                <div className="md:col-span-2">
                  <TextArea label="Progress vs Plan" value={form.progress_vs_plan}
                    onChange={e => setForm(f => ({ ...f, progress_vs_plan: e.target.value }))} />
                </div>
                <div className="md:col-span-2 lg:col-span-3 flex gap-3 justify-end">
                  <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</Button>
                  <Button type="submit" loading={saving}>{editId ? 'Update' : 'Save'} Project</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader><h3 className="font-semibold text-ink">Table X — SED Project Register</h3></CardHeader>
          <CardBody className="p-0">
            <DataTable
              loading={loading} data={projects} keyField="id"
              onEdit={handleEdit} onDelete={handleDelete}
              emptyMessage="No SED projects. Not applicable or click '+ Add SED Project' to begin."
              columns={[
                { key: 'project_description', header: 'Project' },
                { key: 'licence_type', header: 'Licence', render: r => r.licence_type === 'diamonds_act' ? 'Diamonds Act' : 'Precious Metals Act' },
                { key: 'municipality', header: 'Municipality' },
                { key: 'approved_budget', header: 'Budget (R)', align: 'right', render: r => <span className="font-mono">{formatCurrency(r.approved_budget)}</span> },
                { key: 'actual_spend', header: 'Spend (R)', align: 'right', render: r => <span className="font-mono">{formatCurrency(r.actual_spend)}</span> },
                { key: 'status', header: 'Status', render: r => <span className="capitalize">{r.status.replace(/_/g,' ')}</span> },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
