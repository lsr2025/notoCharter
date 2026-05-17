import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMiningRights } from '@/hooks/useMiningRights'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input, Select } from '@/components/FormField'

const YEAR = new Date().getFullYear() - 1

const EVIDENCE_CHECKLIST = [
  { table: 'Table A', element: 'Ownership', items: ['Share certificates','Shareholders agreement','Memorandum of incorporation','Board resolutions & minutes','Signed attendance registers','Audited financial statements'] },
  { table: 'Table B', element: 'ESOP', items: ['ESOP contract/agreement'] },
  { table: 'Table C', element: 'Host Community', items: ['Trust deed / founding document','Host community development programme report','Consultation report with host communities'] },
  { table: 'Table H', element: 'Procurement (Goods)', items: ['Procurement data from core-contractors','BEE certificates','Records of contracts','Transitional arrangements targets'] },
  { table: 'Table I', element: 'Procurement (Services)', items: ['Supplier BEE certificates','Service contracts'] },
  { table: 'Table J', element: 'Enterprise & Supplier Dev', items: ['BEE certificate of developing company','Formal development agreement (5+ year contract)'] },
  { table: 'Table Q', element: 'HRD (Employees)', items: ['Training records','Programme attendance registers','Provider invoices'] },
  { table: 'Table R', element: 'HRD (Non-Employees)', items: ['Community training records','Provider agreements'] },
  { table: 'Table S', element: 'Mine Community Dev', items: ['Approved SLP with DMR sign-off','Progress reports','Municipal and community verification letters'] },
  { table: 'Table T', element: 'Employment Equity', items: ['Approved EE Plan','EE Report to DoL','Workforce demographic records'] },
  { table: 'Table W', element: 'Housing & Living', items: ['Approved housing plan','Labour consultation records','Accommodation audit records'] },
]

interface CoverSheet {
  mr_number: string
  submission_date: string
  calendar_year: number
  signatory_designation: string
  signatory_name: string
  contact_email: string
}

export function SubmissionEngine() {
  const { rights, selected, setSelected } = useMiningRights()
  const { user } = useAuth()
  const [cover, setCover] = useState<CoverSheet>({
    mr_number: rights[0]?.mr_number ?? '',
    submission_date: new Date().toISOString().split('T')[0],
    calendar_year: YEAR,
    signatory_designation: '',
    signatory_name: user?.full_name ?? '',
    contact_email: user?.email ?? '',
  })
  const [generating, setGenerating] = useState(false)
  const [exportUrl, setExportUrl] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})

  const toggleCheck = (key: string) =>
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))

  const totalItems = EVIDENCE_CHECKLIST.reduce((s, g) => s + g.items.length, 0)
  const checkedItems = Object.values(checklist).filter(Boolean).length
  const readiness = Math.round((checkedItems / totalItems) * 100)

  const generateExport = async () => {
    if (!selected) return
    setGenerating(true)
    setExportUrl(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-engine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            mining_right_id: selected,
            calendar_year: cover.calendar_year,
            cover_sheet: cover,
          }),
        },
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(body.error ?? `Export failed (${res.status})`)
      }

      const payload = await res.json()

      if (payload.signed_url) {
        // Storage configured — direct download link
        setExportUrl(payload.signed_url)
      } else if (payload.base64) {
        // Storage not yet configured — create blob URL from base64
        const bytes = Uint8Array.from(atob(payload.base64), c => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: payload.content_type })
        const url = URL.createObjectURL(blob)
        setExportUrl(url)
        // Revoke after 60s to avoid memory leaks
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } else {
        throw new Error('Unexpected response from export engine')
      }
    } catch (e) {
      alert(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Submission Engine"
        subtitle="Generate DMR-compliant XLSX export and PDF executive summary"
        dmrRef="Export"
        actions={
          rights.length > 0 ? (
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
              value={selected ?? ''} onChange={e => setSelected(e.target.value)}>
              {rights.map(r => <option key={r.id} value={r.id}>{r.mr_number}</option>)}
            </select>
          ) : null
        }
      />

      <div className="p-8 space-y-6">
        {/* Readiness indicator */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-ink">Portfolio of Evidence Readiness</div>
                <div className="text-xs text-ink-muted mt-0.5">{checkedItems} of {totalItems} evidence items confirmed</div>
              </div>
              <div className={`text-2xl font-bold font-display ${readiness >= 80 ? 'text-compliant' : readiness >= 50 ? 'text-ringfenced' : 'text-noncompliant'}`}>
                {readiness}%
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${readiness >= 80 ? 'bg-compliant' : readiness >= 50 ? 'bg-ringfenced' : 'bg-noncompliant'}`}
                style={{ width: `${readiness}%` }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Submission cover sheet */}
        <Card>
          <CardHeader><h3 className="font-semibold text-ink">Submission Cover Sheet</h3></CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Mining Right Number" value={cover.mr_number}
                onChange={e => setCover(c => ({ ...c, mr_number: e.target.value }))} required />
              <Input label="Submission Date" type="date" value={cover.submission_date}
                onChange={e => setCover(c => ({ ...c, submission_date: e.target.value }))} required />
              <Select label="Calendar Year" value={String(cover.calendar_year)}
                onChange={e => setCover(c => ({ ...c, calendar_year: parseInt(e.target.value) }))}>
                {[YEAR, YEAR - 1, YEAR - 2].map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
              <Input label="Designation of Signatory" value={cover.signatory_designation}
                onChange={e => setCover(c => ({ ...c, signatory_designation: e.target.value }))} required />
              <Input label="Name of Signatory" value={cover.signatory_name}
                onChange={e => setCover(c => ({ ...c, signatory_name: e.target.value }))} required />
              <Input label="Contact Email" type="email" value={cover.contact_email}
                onChange={e => setCover(c => ({ ...c, contact_email: e.target.value }))} required />
            </div>
          </CardBody>
        </Card>

        {/* Evidence checklist */}
        <Card>
          <CardHeader><h3 className="font-semibold text-ink">Portfolio of Evidence Checklist</h3></CardHeader>
          <CardBody>
            <div className="space-y-4">
              {EVIDENCE_CHECKLIST.map(group => (
                <div key={group.table}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      {group.table}
                    </span>
                    <span className="text-sm font-semibold text-ink">{group.element}</span>
                  </div>
                  <div className="pl-4 space-y-1.5">
                    {group.items.map(item => {
                      const key = `${group.table}-${item}`
                      return (
                        <label key={key} className="flex items-center gap-2.5 text-sm cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={checklist[key] ?? false}
                            onChange={() => toggleCheck(key)}
                            className="rounded text-brand-500 h-4 w-4"
                          />
                          <span className={`transition-colors ${checklist[key] ? 'text-ink line-through text-ink-muted' : 'text-ink group-hover:text-brand-600'}`}>
                            {item}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Export actions */}
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-ink">Generate DMR Export</h3>
                <p className="text-sm text-ink-muted mt-1">
                  Produces a 29-sheet DMR-compliant XLSX workbook mirroring the official template.
                  All data is pre-populated from NotoCharter. Export requires all modules populated.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={generateExport}
                  loading={generating}
                  size="lg"
                >
                  ↗ Generate XLSX Export
                </Button>
              </div>
            </div>

            {exportUrl && (
              <div className="mt-4 rounded-lg bg-compliant-light border border-compliant p-4 flex items-center justify-between">
                <div className="text-sm text-compliant font-semibold">
                  ✓ Export ready — link valid for 24 hours
                </div>
                <a
                  href={exportUrl}
                  download
                  className="px-4 py-2 bg-compliant text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  ↓ Download Export
                </a>
              </div>
            )}

            <div className="mt-4 rounded-lg bg-ringfenced-light border border-ringfenced px-4 py-3 text-sm text-ringfenced">
              <strong>Note:</strong> The XLSX export engine is deployed as a Supabase Edge Function (export-engine).
              Ensure the Supabase project is configured and Edge Functions are deployed before generating exports.
              See <code className="font-mono text-xs">supabase/functions/export-engine/</code> for deployment instructions.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
