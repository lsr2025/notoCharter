import { useState, useEffect, type FormEvent } from 'react'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { DEMO_EE_MATRIX } from '@/lib/demo-data'
import { useMiningRights } from '@/hooks/useMiningRights'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input, Select } from '@/components/FormField'
import { raceLabel, occupationalLevelLabel } from '@/lib/utils'
import type { EEWorkforceRow, Race, Gender, OccupationalLevel } from '@/types'

const YEAR = new Date().getFullYear() - 1

const OCCUPATIONAL_LEVELS: OccupationalLevel[] = [
  'top_management','senior_management','professionally_qualified',
  'skilled_technical','semi_skilled','unskilled',
]
const RACES: Race[] = ['african','coloured','indian','white','foreign']
const GENDERS: Gender[] = ['male','female']

const EMPTY: Omit<EEWorkforceRow, 'id'> = {
  mining_right_id: '',
  calendar_year: YEAR,
  occupational_level: 'skilled_technical',
  race: 'african',
  gender: 'male',
  headcount: 0,
}

export function EEModule() {
  const { rights, selected, setSelected } = useMiningRights()
  const [rows, setRows] = useState<EEWorkforceRow[]>(DEMO_MODE ? DEMO_EE_MATRIX : [])
  const [loading, setLoading] = useState(!DEMO_MODE)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<EEWorkforceRow, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const totalHeadcount = rows.reduce((s, r) => s + r.headcount, 0)
  const hdpHeadcount = rows.filter(r => r.race !== 'white' && r.race !== 'foreign').reduce((s, r) => s + r.headcount, 0)
  const hdpPct = totalHeadcount > 0 ? (hdpHeadcount / totalHeadcount) * 100 : 0

  // Build pivot matrix: level × race headcounts (male + female)
  const matrix: Record<OccupationalLevel, Record<Race, number>> = {} as never
  OCCUPATIONAL_LEVELS.forEach(l => {
    matrix[l] = {} as Record<Race, number>
    RACES.forEach(r => { matrix[l][r] = 0 })
  })
  rows.forEach(r => { matrix[r.occupational_level][r.race] += r.headcount })

  useEffect(() => {
    if (!selected) return
    if (DEMO_MODE) { setRows(DEMO_EE_MATRIX.filter(r => r.mining_right_id === selected)); return }
    setLoading(true)
    supabase.from('ee_workforce_matrix').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR)
      .then(({ data }) => { setRows((data ?? []) as EEWorkforceRow[]); setLoading(false) })
  }, [selected])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    const payload = { ...form, mining_right_id: selected }
    if (editId) {
      await supabase.from('ee_workforce_matrix').update(payload).eq('id', editId)
    } else {
      await supabase.from('ee_workforce_matrix').insert(payload)
    }
    const { data } = await supabase.from('ee_workforce_matrix').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR)
    setRows((data ?? []) as EEWorkforceRow[])
    setForm({ ...EMPTY, mining_right_id: selected })
    setEditId(null); setShowForm(false); setSaving(false)
  }

  return (
    <div>
      <PageHeader
        title="Employment Equity"
        subtitle="Workforce demographic matrix — race × gender × occupational level"
        dmrRef="Tables T–V"
        actions={
          <div className="flex items-center gap-3">
            {rights.length > 0 && (
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                value={selected ?? ''} onChange={e => setSelected(e.target.value)}>
                {rights.map(r => <option key={r.id} value={r.id}>{r.mr_number}</option>)}
              </select>
            )}
            <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY, mining_right_id: selected ?? '' }) }}>
              + Add Row
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Headcount', value: totalHeadcount },
            { label: 'HDP Representation', value: `${hdpPct.toFixed(1)}%` },
            { label: 'Occupational Levels', value: OCCUPATIONAL_LEVELS.length },
          ].map((s, i) => (
            <Card key={i}><CardBody className="py-4 text-center">
              <div className="text-xs text-ink-muted font-mono mb-1">{s.label}</div>
              <div className="text-3xl font-bold font-display text-ink">{s.value}</div>
            </CardBody></Card>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader><h3 className="font-semibold text-ink">{editId ? 'Edit' : 'Add'} Workforce Row — Table T</h3></CardHeader>
            <CardBody>
              <form onSubmit={handleSave} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Select label="Occupational Level" value={form.occupational_level}
                  onChange={e => setForm(f => ({ ...f, occupational_level: e.target.value as OccupationalLevel }))}>
                  {OCCUPATIONAL_LEVELS.map(l => <option key={l} value={l}>{occupationalLevelLabel(l)}</option>)}
                </Select>
                <Select label="Race" value={form.race}
                  onChange={e => setForm(f => ({ ...f, race: e.target.value as Race }))}>
                  {RACES.map(r => <option key={r} value={r}>{raceLabel(r)}</option>)}
                </Select>
                <Select label="Gender" value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value as Gender }))}>
                  {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                </Select>
                <Input label="Headcount" type="number" min="0" value={form.headcount}
                  onChange={e => setForm(f => ({ ...f, headcount: parseInt(e.target.value) || 0 }))} required />
                <div className="col-span-2 md:col-span-4 flex gap-3 justify-end">
                  <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</Button>
                  <Button type="submit" loading={saving}>{editId ? 'Update' : 'Save'}</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Workforce Matrix pivot table */}
        <Card>
          <CardHeader><h3 className="font-semibold text-ink">Table T — Workforce Demographic Matrix</h3></CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="px-6 py-8 text-center text-ink-muted">Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-mono text-ink-muted uppercase tracking-wider">Occupational Level</th>
                      {RACES.map(r => (
                        <th key={r} className="px-4 py-3 text-right text-xs font-mono text-ink-muted uppercase tracking-wider">
                          {raceLabel(r)}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-mono text-ink-muted uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OCCUPATIONAL_LEVELS.map((level, idx) => {
                      const rowTotal = RACES.reduce((s, r) => s + matrix[level][r], 0)
                      return (
                        <tr key={level} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-4 py-3 text-sm font-medium text-ink">{occupationalLevelLabel(level)}</td>
                          {RACES.map(race => (
                            <td key={race} className="px-4 py-3 text-right font-mono text-ink-muted">
                              {matrix[level][race] || '—'}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right font-mono font-semibold text-ink">{rowTotal || '—'}</td>
                        </tr>
                      )
                    })}
                    <tr className="border-t-2 border-slate-300 bg-slate-100 font-semibold">
                      <td className="px-4 py-3 text-sm text-ink font-mono">TOTAL</td>
                      {RACES.map(race => (
                        <td key={race} className="px-4 py-3 text-right font-mono text-ink">
                          {OCCUPATIONAL_LEVELS.reduce((s, l) => s + matrix[l][race], 0) || '—'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right font-mono text-ink">{totalHeadcount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
