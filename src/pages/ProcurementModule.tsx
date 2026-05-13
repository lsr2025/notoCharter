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
import { calcProcurementScore } from '@/lib/scoring'
import type { ProcurementGoods, ComplianceTier } from '@/types'

const YEAR = new Date().getFullYear() - 1

const EMPTY_GOODS: Omit<ProcurementGoods, 'id'> = {
  mining_right_id: '',
  calendar_year: YEAR,
  goods_description: '',
  supplier_id: null,
  is_mining_good: true,
  total_spend: 0,
  local_content_percentage: 0,
  hdp_supplier: false,
  women_owned_supplier: false,
  youth_owned_supplier: false,
  quarter: 1,
}

export function ProcurementModule() {
  const { rights, selected, setSelected } = useMiningRights()
  const [goods, setGoods] = useState<ProcurementGoods[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ProcurementGoods, 'id'>>(EMPTY_GOODS)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const totalSpend = goods.reduce((s, r) => s + r.total_spend, 0)
  const miningGoods = goods.filter(r => r.is_mining_good)
  const miningGoodsSpend = miningGoods.reduce((s, r) => s + r.total_spend, 0)
  const weightedLocalPct = miningGoods.length > 0
    ? miningGoods.reduce((s, r) => s + r.local_content_percentage * r.total_spend, 0) / (miningGoodsSpend || 1)
    : 0
  const localContentCompliant = weightedLocalPct >= 70
  const procScore = calcProcurementScore({
    mining_goods_local_content_pct: weightedLocalPct,
    hdp_services_pct: 0,
    women_services_pct: 0,
    esd_offset_value: 0,
    total_spend: totalSpend,
  })
  const tier: ComplianceTier = localContentCompliant ? 'compliant' : 'non_compliant'

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    supabase.from('procurement_goods').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR).order('goods_description')
      .then(({ data }) => { setGoods((data ?? []) as ProcurementGoods[]); setLoading(false) })
  }, [selected])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    const payload = { ...form, mining_right_id: selected }
    if (editId) {
      await supabase.from('procurement_goods').update(payload).eq('id', editId)
    } else {
      await supabase.from('procurement_goods').insert(payload)
    }
    const { data } = await supabase.from('procurement_goods').select('*')
      .eq('mining_right_id', selected).eq('calendar_year', YEAR)
    setGoods((data ?? []) as ProcurementGoods[])
    setForm({ ...EMPTY_GOODS, mining_right_id: selected })
    setEditId(null)
    setShowForm(false)
    setSaving(false)
  }

  const handleEdit = (row: ProcurementGoods) => { setForm(row); setEditId(row.id); setShowForm(true) }
  const handleDelete = async (row: ProcurementGoods) => {
    if (!confirm(`Delete record for ${row.goods_description}?`)) return
    await supabase.from('procurement_goods').delete().eq('id', row.id)
    setGoods(prev => prev.filter(r => r.id !== row.id))
  }

  return (
    <div>
      <PageHeader
        title="Procurement, Supplier & Enterprise Development"
        subtitle="Total spend, local content %, HDP/Women/Youth supplier classification"
        dmrRef="Tables H–M"
        actions={
          <div className="flex items-center gap-3">
            {rights.length > 0 && (
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                value={selected ?? ''} onChange={e => setSelected(e.target.value)}>
                {rights.map(r => <option key={r.id} value={r.id}>{r.mr_number}</option>)}
              </select>
            )}
            <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY_GOODS, mining_right_id: selected ?? '' }) }}>
              + Add Record
            </Button>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Procurement Spend', value: formatCurrency(totalSpend), sub: 'All goods & services' },
            { label: 'Mining Goods Local Content', value: formatPercent(weightedLocalPct), sub: 'Target ≥ 70%' },
            { label: 'Procurement Score', value: formatPercent(procScore), sub: '40% weight in MCIII' },
            { label: 'Local Content Status', value: <ComplianceBadge tier={tier} />, sub: localContentCompliant ? 'Above 70% threshold' : 'Below 70% threshold' },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardBody className="py-4">
                <div className="text-xs text-ink-muted font-mono mb-1">{kpi.label}</div>
                <div className="text-xl font-bold font-display text-ink">{kpi.value}</div>
                <div className="text-xs text-ink-muted mt-1">{kpi.sub}</div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Local content progress bar */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-ink">Mining Goods Local Content</span>
              <span className="text-sm font-mono font-bold">
                {formatPercent(weightedLocalPct)} <span className="text-ink-muted font-normal">/ 70% target</span>
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${localContentCompliant ? 'bg-compliant' : 'bg-noncompliant'}`}
                style={{ width: `${Math.min(100, weightedLocalPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-ink-muted mt-1 font-mono">
              <span>0%</span><span className="text-ringfenced">70% threshold</span><span>100%</span>
            </div>
          </CardBody>
        </Card>

        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-ink">{editId ? 'Edit' : 'Add'} Procurement Record — Table H</h3>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Goods / Service Description" value={form.goods_description}
                  onChange={e => setForm(f => ({ ...f, goods_description: e.target.value }))} required />

                <Select label="Quarter" value={String(form.quarter)}
                  onChange={e => setForm(f => ({ ...f, quarter: parseInt(e.target.value) as 1|2|3|4 }))}>
                  {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
                </Select>

                <Input label="Total Spend (R)" type="number" step="0.01" min="0"
                  value={form.total_spend}
                  onChange={e => setForm(f => ({ ...f, total_spend: parseFloat(e.target.value) || 0 }))} required />

                <Input label="Local Content %" type="number" step="0.1" min="0" max="100"
                  value={form.local_content_percentage}
                  onChange={e => setForm(f => ({ ...f, local_content_percentage: parseFloat(e.target.value) || 0 }))} />

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-ink-3 uppercase tracking-wider font-mono">Supplier Classification</label>
                  {[
                    { key: 'is_mining_good',        label: 'Mining Good' },
                    { key: 'hdp_supplier',           label: 'HDP-Owned Supplier' },
                    { key: 'women_owned_supplier',   label: 'Women-Owned Supplier' },
                    { key: 'youth_owned_supplier',   label: 'Youth-Owned Supplier' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox"
                        checked={Boolean(form[key as keyof typeof form])}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                        className="rounded text-brand-500"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex gap-3 justify-end">
                  <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</Button>
                  <Button type="submit" loading={saving}>{editId ? 'Update' : 'Save'} Record</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Table H */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-ink">Table H — Mining Goods Procurement</h3>
          </CardHeader>
          <CardBody className="p-0">
            <DataTable
              loading={loading}
              data={goods}
              keyField="id"
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="No procurement records. Click '+ Add Record' to begin."
              columns={[
                { key: 'goods_description', header: 'Description' },
                { key: 'quarter', header: 'Q', align: 'center', render: r => `Q${r.quarter}` },
                { key: 'is_mining_good', header: 'Mining Good', align: 'center', render: r => r.is_mining_good ? '✓' : '—' },
                { key: 'total_spend', header: 'Spend (R)', align: 'right', render: r => <span className="font-mono">{formatCurrency(r.total_spend)}</span> },
                { key: 'local_content_percentage', header: 'Local Content', align: 'right', render: r => <span className={`font-mono ${r.local_content_percentage >= 70 ? 'text-compliant' : 'text-noncompliant'}`}>{formatPercent(r.local_content_percentage)}</span> },
                { key: 'hdp_supplier', header: 'HDP', align: 'center', render: r => r.hdp_supplier ? '✓' : '—' },
                { key: 'women_owned_supplier', header: 'Women', align: 'center', render: r => r.women_owned_supplier ? '✓' : '—' },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
