import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase, DEMO_MODE } from '@/lib/supabase'
import { DEMO_SCORECARDS, DEMO_YEAR } from '@/lib/demo-data'
import { useMiningRights } from '@/hooks/useMiningRights'
import { useAuth } from '@/hooks/useAuth'
import { ComplianceBadge } from '@/components/ComplianceBadge'
import { Card, CardBody } from '@/components/Card'
import { formatPercent, daysUntil } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import type { MCIIIScorecard, ComplianceTier } from '@/types'

const CALENDAR_YEAR = DEMO_MODE ? DEMO_YEAR : new Date().getFullYear() - 1
const SUBMISSION_DEADLINE = `${CALENDAR_YEAR + 1}-03-31`

// ─── Score Gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score, tier }: { score: number; tier: ComplianceTier }) {
  const colour = {
    compliant: '#16a34a',
    non_compliant: '#dc2626',
    ring_fenced: '#d97706',
  }[tier]

  const data = [
    { name: 'score', value: score, fill: colour },
    { name: 'empty', value: 100 - score, fill: '#f1f5f9' },
  ]

  return (
    <div className="relative w-40 h-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
          startAngle={90} endAngle={-270} data={data}
        >
          <RadialBar dataKey="value" cornerRadius={4} />
          <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Score']} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-display text-ink">{score.toFixed(0)}</span>
        <span className="text-xs text-ink-muted font-mono">/ 100</span>
      </div>
    </div>
  )
}

// ─── Ring-Fenced Element Card ─────────────────────────────────────────────────

function RingFencedCard({ label, compliant, onClick }: {
  label: string; compliant: boolean | null; onClick: () => void
}) {
  const tier: ComplianceTier = compliant === null ? 'ring_fenced' : compliant ? 'compliant' : 'non_compliant'
  return (
    <Card onClick={onClick} className="flex-1">
      <CardBody className="text-center py-4">
        <div className={`text-2xl mb-2 ${compliant ? 'text-compliant' : 'text-noncompliant'}`}>
          {compliant === null ? '?' : compliant ? '✓' : '✗'}
        </div>
        <div className="text-xs font-semibold text-ink-3 mb-2 leading-tight">{label}</div>
        <ComplianceBadge tier={tier} size="sm" />
        <div className="text-[9px] text-ink-muted mt-1 font-mono">Ring-Fenced</div>
      </CardBody>
    </Card>
  )
}

// ─── Element Score Bar ────────────────────────────────────────────────────────

function ElementBar({ label, score, weight, path }: {
  label: string; score: number; weight: number; path: string
}) {
  const navigate = useNavigate()
  const colour = score >= 80 ? 'bg-compliant' : score >= 60 ? 'bg-ringfenced' : 'bg-noncompliant'
  return (
    <div
      className="group cursor-pointer rounded-lg p-4 hover:bg-slate-50 transition-colors border border-slate-100"
      onClick={() => navigate(path)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-ink group-hover:text-brand-600 transition-colors">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted font-mono">{weight}% weight</span>
          <span className="text-sm font-bold font-mono text-ink">{score.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colour}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuth()
  const { rights, selected, setSelected } = useMiningRights()
  const [scorecard, setScorecard] = useState<MCIIIScorecard | null>(
    DEMO_MODE && selected ? DEMO_SCORECARDS[selected] ?? null : null
  )
  const [loading, setLoading] = useState(!DEMO_MODE)
  const navigate = useNavigate()

  useEffect(() => {
    if (!selected) return
    if (DEMO_MODE) {
      setScorecard(DEMO_SCORECARDS[selected] ?? null)
      return
    }
    setLoading(true)
    supabase
      .from('mciii_scorecard')
      .select('*')
      .eq('mining_right_id', selected)
      .eq('calendar_year', CALENDAR_YEAR)
      .maybeSingle()
      .then(({ data }) => {
        setScorecard(data as MCIIIScorecard | null)
        setLoading(false)
      })
  }, [selected])

  const days = daysUntil(SUBMISSION_DEADLINE)

  return (
    <div>
      <PageHeader
        title="MCIII Compliance Dashboard"
        subtitle={`Reporting year ${CALENDAR_YEAR - 1} · ${user?.full_name}`}
        dmrRef="Scorecard"
        actions={
          rights.length > 0 ? (
            <select
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-ink outline-none focus:ring-2 focus:ring-brand-500"
              value={selected ?? ''}
              onChange={e => setSelected(e.target.value)}
            >
              <option value="ALL">All Mining Rights (Consolidated)</option>
              {rights.map(r => (
                <option key={r.id} value={r.id}>{r.mr_number} — {r.commodity}</option>
              ))}
            </select>
          ) : null
        }
      />

      <div className="p-8 space-y-6">

        {/* Submission countdown */}
        {days !== null && (
          <div className={`rounded-xl px-6 py-3 flex items-center gap-4 ${
            days < 0 ? 'bg-noncompliant-light text-noncompliant' :
            days < 30 ? 'bg-ringfenced-light text-ringfenced' :
            'bg-brand-50 text-brand-700'
          }`}>
            <span className="text-lg">⏱</span>
            <span className="text-sm font-semibold">
              {days < 0
                ? `DMR submission deadline passed ${Math.abs(days)} days ago — verify with Compliance Officer`
                : `${days} days until DMR submission deadline (${SUBMISSION_DEADLINE})`}
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-ink-muted">
            <span className="animate-spin mr-2 text-brand-500 text-xl">⟳</span> Loading scorecard…
          </div>
        ) : scorecard ? (
          <>
            {/* Overall score + tier */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardBody className="text-center">
                  <div className="text-xs font-mono text-ink-muted uppercase tracking-widest mb-4">
                    Overall MCIII Score
                  </div>
                  <ScoreGauge score={scorecard.overall_score} tier={scorecard.overall_tier} />
                  <div className="mt-4">
                    <ComplianceBadge tier={scorecard.overall_tier} size="lg" />
                  </div>
                  <p className="text-xs text-ink-muted mt-3 font-mono">
                    EE 30% · Procurement 40% · HRD 30%
                  </p>
                </CardBody>
              </Card>

              {/* Ring-fenced elements */}
              <Card className="lg:col-span-2">
                <CardBody>
                  <div className="text-xs font-mono text-ink-muted uppercase tracking-widest mb-4">
                    Ring-Fenced Elements — Non-compliance = Overall Non-Compliant
                  </div>
                  <div className="flex gap-4">
                    <RingFencedCard
                      label="Ownership"
                      compliant={scorecard.ownership_compliant}
                      onClick={() => navigate('/ownership')}
                    />
                    <RingFencedCard
                      label="Mine Community Dev"
                      compliant={scorecard.mcd_compliant}
                      onClick={() => navigate('/mcd')}
                    />
                    <RingFencedCard
                      label="Housing & Living"
                      compliant={scorecard.hlc_compliant}
                      onClick={() => navigate('/hlc')}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Quantitative elements */}
            <Card>
              <CardBody>
                <div className="text-xs font-mono text-ink-muted uppercase tracking-widest mb-4">
                  Quantitative Elements
                </div>
                <div className="space-y-3">
                  <ElementBar label="Procurement, Supplier & Enterprise Development" score={scorecard.procurement_score} weight={40} path="/procurement" />
                  <ElementBar label="Employment Equity" score={scorecard.ee_score} weight={30} path="/ee" />
                  <ElementBar label="Human Resource Development" score={scorecard.hrd_score} weight={30} path="/hrd" />
                </div>
              </CardBody>
            </Card>

            {/* KPI Summary strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Procurement Score',   value: formatPercent(scorecard.procurement_score), sub: '40% weight' },
                { label: 'HRD Score',            value: formatPercent(scorecard.hrd_score),          sub: '30% weight' },
                { label: 'EE Score',             value: formatPercent(scorecard.ee_score),            sub: '30% weight' },
                { label: 'Last Updated',         value: new Date(scorecard.last_updated).toLocaleDateString('en-ZA'), sub: 'Scorecard refresh' },
              ].map(kpi => (
                <Card key={kpi.label}>
                  <CardBody className="py-4">
                    <div className="text-xs text-ink-muted font-mono mb-1">{kpi.label}</div>
                    <div className="text-2xl font-bold font-display text-ink">{kpi.value}</div>
                    <div className="text-xs text-ink-muted mt-1">{kpi.sub}</div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/submission')}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm"
              >
                ↗ Generate DMR Export
              </button>
              <button
                onClick={() => navigate('/audit')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-ink rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                ≡ View Audit Trail
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-ink-muted">
            No scorecard data for this mining right. Begin data entry in each module.
          </div>
        )}
      </div>
    </div>
  )
}
