import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useMiningRights } from '@/hooks/useMiningRights'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/Button'
import { Input, Select } from '@/components/FormField'
import { ComplianceBadge } from '@/components/ComplianceBadge'
import { formatCurrency, formatPercent, raceLabel, occupationalLevelLabel } from '@/lib/utils'
import { calcHRDScore } from '@/lib/scoring'
import type { HRDEmployee, Race, Gender, OccupationalLevel, TrainingProgramme, ComplianceTier } from '@/types'

const YEAR = new Date().getFullYear() - 1

const EMPTY: Omit<HRDEmployee, 'id'> = {
  mining_right_id: '',
  calendar_year: YEAR,
  employee_name: '',
  id_number: '',
  race: 'african',
  gender: 'male',
  occupational_level: 'skilled_technical',
  is_hdp: true,
  programme_type: 'skills_programme',
  provider: '',
  start_date: '',
  end_date: '',
  cost: 0,
}

export function HRDModule() {
  const { rights, selected, setSelected } = useMiningRights()
  const [employees, setEmployees] = useState<HRDEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<HRDEmployee, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [leviablePayroll, setLeviablePayroll] = useState(0)

  const totalCost = employees.reduce((s, r) => s + r.cost, 0)
  const target5pct = leviablePayroll * 0.05
  const hrdScore = calcHRDScore(totalCost, leviablePayroll)
  const hrdCompliant = hrdScore >= 100
  const tier: ComplianceTier = hrdCompliant ? 'compliant' : 'non_compliant'

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    supabase.from('hrd_employees').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR)
      .order('employee_name')
      .then(({ data }) => { setEmployees((data ?? []) as HRDEmployee[]); setLoading(false) })
  }, [selected])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    const payload = { ...form, mining_right_id: selected, is_hdp: form.race !== 'white' && form.race !== 'foreign' }
    if (editId) {
      await supabase.from('hrd_employees').update(payload).eq('id', editId)
    } else {
      await supabase.from('hrd_employees').insert(payload)
    }
    const { data } = await supabase.from('hrd_employees').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR)
    setEmployees((data ?? []) as HRDEmployee[])
    setForm({ ...EMPTY, mining_right_id: selected })
    setEditId(null); setShowForm(false); setSaving(false)
  }

  const handleEdit = (row: HRDEmployee) => { setForm(row); setEditId(row.id); setShowForm(true) }
  const handleDelete = async (row: HRDEmployee) => {
    if (!confirm(`Delete record for ${row.employee_name}?`)) return
    await supabase.from('hrd_employees').delete().eq('id', row.id)
    setEmployees(prev => prev.filter(r => r.id !== row.id))
  }

  return (
    <div>
      <PageHeader
        title="Human Resource Development"
        subtitle="Employee training spend vs 5% leviable payroll target"
        dmrRef="Tables Q–R"
        actions={
          <div className="flex items-center gap-3">
            {rights.length > 0 && (
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                value={selected ?? ''} onChange={e => setSelected(e.target.value)}>
                {rights.map(r => <option key={r.id} value={r.id}>{r.mr_number}</option>)}
              </select>
            )}
            <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY, mining_right_id: selected ?? '' }) }}>
              + Add Beneficiary
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {/* Leviable payroll input */}
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-end gap-6">
              <div className="w-64">
                <Input
                  label="Leviable Payroll (R) — Annual"
                  type="number" step="1000" min="0"
                  value={leviablePayroll || ''}
                  onChange={e => setLeviablePayroll(parseFloat(e.target.value) || 0)}
                  hint="Enter total leviable payroll to calculate 5% target"
                />
              </div>
              <div className="text-sm text-ink-muted">
                <span className="font-semibold text-ink">5% Target: </span>
                {formatCurrency(target5pct)}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total HRD Spend', value: formatCurrency(totalCost), sub: 'Employee training' },
            { label: '5% Target', value: formatCurrency(target5pct), sub: 'Of leviable payroll' },
            { label: 'HRD Score', value: formatPercent(hrdScore), sub: '30% weight in MCIII' },
            { label: 'HRD Status', value: <ComplianceBadge tier={tier} />, sub: hrdCompliant ? 'Target met' : 'Below 5% target' },
          ].map((kpi, i) => (
            <Card key={i}><CardBody className="py-4">
              <div className="text-xs text-ink-muted font-mono mb-1">{kpi.label}</div>
              <div className="text-xl font-bold font-display text-ink">{kpi.value}</div>
              <div className="text-xs text-ink-muted mt-1">{kpi.sub}</div>
            </CardBody></Card>
          ))}
        </div>

        {/* Spend vs target bar */}
        <Card><CardBody>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-ink">HRD Spend vs 5% Target</span>
            <span className="text-sm font-mono font-bold">
              {formatCurrency(totalCost)} <span className="text-ink-muted font-normal">/ {formatCurrency(target5pct)}</span>
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${hrdCompliant ? 'bg-compliant' : 'bg-noncompliant'}`}
              style={{ width: `${Math.min(100, hrdScore)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-ink-muted mt-1 font-mono">
            <span>R0</span><span className="text-ringfenced">5% threshold</span><span>{formatCurrency(target5pct)}</span>
          </div>
        </CardBody></Card>

        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader><h3 className="font-semibold text-ink">{editId ? 'Edit' : 'Add'} HRD Beneficiary — Table Q</h3></CardHeader>
            <CardBody>
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Employee Name" value={form.employee_name}
                  onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} required />
                <Input label="ID Number" value={form.id_number}
                  onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} required />
                <Select label="Race" value={form.race}
                  onChange={e => setForm(f => ({ ...f, race: e.target.value as Race }))}>
                  {['african','coloured','indian','white','foreign'].map(r => <option key={r} value={r}>{raceLabel(r)}</option>)}
                </Select>
                <Select label="Gender" value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value as Gender }))}>
                  <option value="male">Male</option><option value="female">Female</option>
                </Select>
                <Select label="Occupational Level" value={form.occupational_level}
                  onChange={e => setForm(f => ({ ...f, occupational_level: e.target.value as OccupationalLevel }))}>
                  {['top_management','senior_management','professionally_qualified','skilled_technical','semi_skilled','unskilled']
                    .map(l => <option key={l} value={l}>{occupationalLevelLabel(l)}</option>)}
                </Select>
                <Select label="Programme Type" value={form.programme_type}
                  onChange={e => setForm(f => ({ ...f, programme_type: e.target.value as TrainingProgramme }))}>
                  {['abet','bursary','learnership','skills_programme','internship','apprenticeship','other']
                    .map(p => <option key={p} value={p}>{p.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                </Select>
                <Input label="Training Provider" value={form.provider}
                  onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} required />
                <Input label="Start Date" type="date" value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
                <Input label="End Date" type="date" value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
                <Input label="Cost (R)" type="number" step="0.01" min="0" value={form.cost}
                  onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} required />
                <div className="md:col-span-2 lg:col-span-3 flex gap-3 justify-end">
                  <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</Button>
                  <Button type="submit" loading={saving}>{editId ? 'Update' : 'Save'} Beneficiary</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader><h3 className="font-semibold text-ink">Table Q — Employee HRD Beneficiaries</h3></CardHeader>
          <CardBody className="p-0">
            <DataTable
              loading={loading} data={employees} keyField="id"
              onEdit={handleEdit} onDelete={handleDelete}
              emptyMessage="No HRD beneficiaries captured. Click '+ Add Beneficiary' to begin."
              columns={[
                { key: 'employee_name', header: 'Name' },
                { key: 'race', header: 'Race', render: r => raceLabel(r.race) },
                { key: 'gender', header: 'Gender', render: r => r.gender === 'male' ? 'M' : 'F' },
                { key: 'occupational_level', header: 'Level', render: r => occupationalLevelLabel(r.occupational_level) },
                { key: 'is_hdp', header: 'HDP', align: 'center', render: r => r.is_hdp ? '✓' : '—' },
                { key: 'programme_type', header: 'Programme', render: r => r.programme_type.replace(/_/g,' ') },
                { key: 'provider', header: 'Provider' },
                { key: 'cost', header: 'Cost (R)', align: 'right', render: r => <span className="font-mono">{formatCurrency(r.cost)}</span> },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
