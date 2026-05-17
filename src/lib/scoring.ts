import type { MCIIIScorecard, ComplianceTier, EEWorkforceRow, OccupationalLevel } from '@/types'

/**
 * MCIII Scoring Engine
 * Ownership / MCD / HLC = Ring-fenced (Y/N) → immediate non-compliance if any fails
 * EE  = 30%, Procurement = 40%, HRD = 30%
 */
export function calculateOverallScore(s: Partial<MCIIIScorecard>): {
  overall_score: number
  overall_tier: ComplianceTier
} {
  const quantitative =
    (s.ee_score ?? 0) * 0.30 +
    (s.procurement_score ?? 0) * 0.40 +
    (s.hrd_score ?? 0) * 0.30

  const ringFencedFail =
    s.ownership_compliant === false ||
    s.mcd_compliant === false ||
    s.hlc_compliant === false

  let tier: ComplianceTier
  if (ringFencedFail) {
    tier = 'non_compliant'
  } else if (quantitative >= 100) {
    tier = 'compliant'
  } else if (quantitative >= 60) {
    tier = 'ring_fenced'
  } else {
    tier = 'non_compliant'
  }

  return { overall_score: Math.round(quantitative * 10) / 10, overall_tier: tier }
}

/** HRD score: actual_spend / target * 100 (capped at 100) */
export function calcHRDScore(actual: number, leviable_payroll: number): number {
  const target = leviable_payroll * 0.05
  if (target <= 0) return 0
  return Math.min(100, (actual / target) * 100)
}

/**
 * EE score: per-level HDP% vs MCIII 2018 targets, averaged across populated levels.
 * Targets sourced from Mining Charter III (2018) — verify against DMR template before go-live.
 */
const EE_TARGETS: Record<OccupationalLevel, number> = {
  top_management:          50,
  senior_management:       60,
  professionally_qualified: 60,
  skilled_technical:       75,
  semi_skilled:            88,
  unskilled:               90,
}

export function calcEEScore(rows: EEWorkforceRow[]): number {
  const levels = Object.keys(EE_TARGETS) as OccupationalLevel[]
  let total = 0
  let count = 0

  for (const level of levels) {
    const levelRows = rows.filter(r => r.occupational_level === level)
    if (levelRows.length === 0) continue

    const headcount = levelRows.reduce((s, r) => s + r.headcount, 0)
    const hdp = levelRows
      .filter(r => r.race !== 'white' && r.race !== 'foreign')
      .reduce((s, r) => s + r.headcount, 0)

    const hdpPct = headcount > 0 ? (hdp / headcount) * 100 : 0
    total += Math.min(100, (hdpPct / EE_TARGETS[level]) * 100)
    count++
  }

  return count > 0 ? Math.round((total / count) * 10) / 10 : 0
}

/** Procurement score: weighted sub-elements (simplified for MVP) */
export function calcProcurementScore(params: {
  mining_goods_local_content_pct: number
  hdp_services_pct: number
  women_services_pct: number
  esd_offset_value: number
  total_spend: number
}): number {
  const localContent = Math.min(100, (params.mining_goods_local_content_pct / 70) * 100) * 0.50
  const hdp = Math.min(100, params.hdp_services_pct * 2) * 0.30
  const women = Math.min(100, params.women_services_pct * 5) * 0.10
  const esd = params.total_spend > 0
    ? Math.min(100, (params.esd_offset_value / params.total_spend) * 100 * 10) * 0.10
    : 0
  return Math.round((localContent + hdp + women + esd) * 10) / 10
}
