import { useState, useEffect, type FormEvent } from 'react'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { DEMO_HLC } from '@/lib/demo-data'
import { useMiningRights } from '@/hooks/useMiningRights'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input, TextArea } from '@/components/FormField'
import { ComplianceBadge } from '@/components/ComplianceBadge'
import type { HLCHousing, ComplianceTier } from '@/types'

const YEAR = new Date().getFullYear() - 1

const EMPTY: Omit<HLCHousing, 'id'> = {
  mining_right_id: '',
  calendar_year: YEAR,
  housing_plan_in_place: false,
  housing_plan_date: null,
  single_units_company_owned: 0,
  single_units_subsidised: 0,
  family_units_company_owned: 0,
  family_units_subsidised: 0,
  housing_allowance_recipients: 0,
  labour_consultation_date: null,
  labour_consultation_notes: null,
}

export function HLCModule() {
  const { rights, selected, setSelected } = useMiningRights()
  const [record, setRecord] = useState<HLCHousing | null>(DEMO_MODE ? DEMO_HLC : null)
  const [form, setForm] = useState<Omit<HLCHousing, 'id'>>(DEMO_MODE ? DEMO_HLC : EMPTY)
  const [loading, setLoading] = useState(!DEMO_MODE)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const compliant = record?.housing_plan_in_place === true && record?.labour_consultation_date != null
  const tier: ComplianceTier = record === null ? 'ring_fenced' : compliant ? 'compliant' : 'non_compliant'

  const totalUnits = record
    ? record.single_units_company_owned + record.single_units_subsidised +
      record.family_units_company_owned + record.family_units_subsidised
    : 0

  useEffect(() => {
    if (!selected) return
    if (DEMO_MODE) {
      setRecord(DEMO_HLC); setForm(DEMO_HLC); setEditId(DEMO_HLC.id)
      return
    }
    setLoading(true)
    supabase.from('hlc_housing').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR).maybeSingle()
      .then(({ data }) => {
        const rec = data as HLCHousing | null
        setRecord(rec)
        if (rec) { setForm(rec); setEditId(rec.id) }
        setLoading(false)
      })
  }, [selected])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    const payload = { ...form, mining_right_id: selected }
    if (editId) {
      await supabase.from('hlc_housing').update(payload).eq('id', editId)
    } else {
      const { data } = await supabase.from('hlc_housing').insert(payload).select().single()
      if (data) setEditId((data as HLCHousing).id)
    }
    const { data } = await supabase.from('hlc_housing').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR).maybeSingle()
    setRecord(data as HLCHousing | null)
    setShowForm(false); setSaving(false)
  }

  return (
    <div>
      <PageHeader
        title="Housing & Living Conditions"
        subtitle="Housing plan compliance, accommodation types, labour consultation"
        dmrRef="Table W"
        actions={
          <div className="flex items-center gap-3">
            {rights.length > 0 && (
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                value={selected ?? ''} onChange={e => setSelected(e.target.value)}>
                {rights.map(r => <option key={r.id} value={r.id}>{r.mr_number}</option>)}
              </select>
            )}
            <Button onClick={() => setShowForm(true)}>{record ? 'Edit' : 'Capture'} HLC Data</Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-ink-muted">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Housing Plan', value: record?.housing_plan_in_place ? 'In Place' : 'Not Captured', sub: record?.housing_plan_date ?? '—' },
                { label: 'Total Housing Units', value: totalUnits, sub: 'Company + subsidised' },
                { label: 'Allowance Recipients', value: record?.housing_allowance_recipients ?? 0, sub: 'Housing allowance' },
                { label: 'HLC Element', value: <ComplianceBadge tier={tier} />, sub: 'Ring-Fenced' },
              ].map((kpi, i) => (
                <Card key={i}><CardBody className="py-4">
                  <div className="text-xs text-ink-muted font-mono mb-1">{kpi.label}</div>
                  <div className="text-xl font-bold font-display text-ink">{kpi.value}</div>
                  <div className="text-xs text-ink-muted mt-1">{kpi.sub}</div>
                </CardBody></Card>
              ))}
            </div>

            {record && (
              <Card>
                <CardHeader><h3 className="font-semibold text-ink">Table W — Housing & Living Conditions Status</h3></CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <div className="text-xs text-ink-muted font-mono uppercase mb-1">Housing Plan</div>
                      <div className="font-semibold">{record.housing_plan_in_place ? '✓ In Place' : '✗ Not in place'}</div>
                      {record.housing_plan_date && <div className="text-ink-muted text-xs mt-0.5">{record.housing_plan_date}</div>}
                    </div>
                    <div>
                      <div className="text-xs text-ink-muted font-mono uppercase mb-1">Single Units</div>
                      <div className="font-semibold">{record.single_units_company_owned} company-owned</div>
                      <div className="text-ink-muted text-xs">{record.single_units_subsidised} subsidised</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-muted font-mono uppercase mb-1">Family Units</div>
                      <div className="font-semibold">{record.family_units_company_owned} company-owned</div>
                      <div className="text-ink-muted text-xs">{record.family_units_subsidised} subsidised</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-muted font-mono uppercase mb-1">Labour Consultation</div>
                      <div className="font-semibold">{record.labour_consultation_date ?? 'Not recorded'}</div>
                    </div>
                    {record.labour_consultation_notes && (
                      <div className="md:col-span-2">
                        <div className="text-xs text-ink-muted font-mono uppercase mb-1">Consultation Notes</div>
                        <div className="text-ink-muted">{record.labour_consultation_notes}</div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {!record && !showForm && (
              <Card><CardBody className="text-center py-12">
                <div className="text-ink-muted mb-4">No HLC data captured for {YEAR}.</div>
                <Button onClick={() => setShowForm(true)}>Capture HLC Data</Button>
              </CardBody></Card>
            )}

            {showForm && (
              <Card>
                <CardHeader><h3 className="font-semibold text-ink">{editId ? 'Edit' : 'Capture'} HLC Data — Table W</h3></CardHeader>
                <CardBody>
                  <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-ink-3 uppercase tracking-wider font-mono">Housing Plan</label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.housing_plan_in_place}
                          onChange={e => setForm(f => ({ ...f, housing_plan_in_place: e.target.checked }))}
                          className="rounded text-brand-500" />
                        Housing plan in place
                      </label>
                    </div>
                    <Input label="Housing Plan Date" type="date" value={form.housing_plan_date ?? ''}
                      onChange={e => setForm(f => ({ ...f, housing_plan_date: e.target.value || null }))} />
                    <Input label="Single Units (Company-Owned)" type="number" min="0" value={form.single_units_company_owned}
                      onChange={e => setForm(f => ({ ...f, single_units_company_owned: parseInt(e.target.value) || 0 }))} />
                    <Input label="Single Units (Subsidised)" type="number" min="0" value={form.single_units_subsidised}
                      onChange={e => setForm(f => ({ ...f, single_units_subsidised: parseInt(e.target.value) || 0 }))} />
                    <Input label="Family Units (Company-Owned)" type="number" min="0" value={form.family_units_company_owned}
                      onChange={e => setForm(f => ({ ...f, family_units_company_owned: parseInt(e.target.value) || 0 }))} />
                    <Input label="Family Units (Subsidised)" type="number" min="0" value={form.family_units_subsidised}
                      onChange={e => setForm(f => ({ ...f, family_units_subsidised: parseInt(e.target.value) || 0 }))} />
                    <Input label="Housing Allowance Recipients" type="number" min="0" value={form.housing_allowance_recipients}
                      onChange={e => setForm(f => ({ ...f, housing_allowance_recipients: parseInt(e.target.value) || 0 }))} />
                    <Input label="Labour Consultation Date" type="date" value={form.labour_consultation_date ?? ''}
                      onChange={e => setForm(f => ({ ...f, labour_consultation_date: e.target.value || null }))} />
                    <div className="md:col-span-2">
                      <TextArea label="Labour Consultation Notes" value={form.labour_consultation_notes ?? ''}
                        onChange={e => setForm(f => ({ ...f, labour_consultation_notes: e.target.value || null }))} />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3 flex gap-3 justify-end">
                      <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                      <Button type="submit" loading={saving}>{editId ? 'Update' : 'Save'} HLC Data</Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
