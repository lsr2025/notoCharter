// CompliancePDFReport.tsx
// NotoCharter™ — PDF Compliance Executive Summary
// Uses @react-pdf/renderer. All styles use StyleSheet (React Native-style, not Tailwind).

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { MCIIIScorecard } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PDFReportData {
  miningRight: {
    mr_number: string
    holder_entity: string
    province: string
    commodity: string
    right_type: string
  } | null
  scorecard: MCIIIScorecard | null
  coverSheet: {
    submission_date: string
    calendar_year: number
    signatory_designation: string
    signatory_name: string
    contact_email: string
  }
  generatedAt: string
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const C = {
  navy:       '#1e3a5f',
  navyLight:  '#2d5285',
  gold:       '#c8a84b',
  goldLight:  '#f5edcf',
  compliant:  '#16a34a',
  compliantBg:'#f0fdf4',
  nonComp:    '#dc2626',
  nonCompBg:  '#fef2f2',
  ringFenced: '#d97706',
  ringBg:     '#fffbeb',
  ink:        '#1a1a2e',
  inkMuted:   '#64748b',
  border:     '#e2e8f0',
  white:      '#ffffff',
  bgLight:    '#f8fafc',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: C.white,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },

  // Header bar
  headerBar: {
    backgroundColor: C.navy,
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    letterSpacing: 0.5,
  },
  brandTm: {
    fontSize: 10,
    color: C.gold,
    marginBottom: 4,
    marginLeft: 1,
  },
  brandTagline: {
    fontSize: 9,
    color: C.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  reportTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    marginTop: 14,
  },
  reportSubtitle: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 3,
  },

  // Gold divider
  goldBar: {
    height: 3,
    backgroundColor: C.gold,
  },

  // Body
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 28,
  },

  // Section heading
  sectionHeading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.gold,
    paddingBottom: 4,
  },

  // Detail grid (2-col)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    marginBottom: 24,
  },
  gridItem: {
    width: '50%',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 8,
    color: C.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.ink,
  },

  // Overall tier badge
  tierBadge: {
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierLabel: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  tierScore: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
  },
  tierScoreSub: {
    fontSize: 10,
    marginTop: 2,
  },

  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: C.bgLight,
  },
  tableCell: {
    fontSize: 9,
    color: C.ink,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.ink,
  },

  // Status pill
  pill: {
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.navy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  footerBrand: {
    fontSize: 8,
    color: C.gold,
    fontFamily: 'Helvetica-Bold',
  },

  // Signature block
  sigBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 20,
    marginBottom: 16,
  },
  sigLine: {
    height: 1,
    backgroundColor: C.ink,
    marginTop: 36,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 8,
    color: C.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  certText: {
    fontSize: 9,
    color: C.ink,
    lineHeight: 1.6,
    marginBottom: 20,
  },
  notice: {
    backgroundColor: C.goldLight,
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 2,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 8,
    color: '#78350f',
    lineHeight: 1.5,
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tierConfig(tier: string | null | undefined) {
  switch (tier) {
    case 'compliant':    return { label: 'COMPLIANT',       bg: C.compliantBg, color: C.compliant, border: '#bbf7d0' }
    case 'ring_fenced':  return { label: 'RING-FENCED',     bg: C.ringBg,      color: C.ringFenced, border: '#fde68a' }
    default:             return { label: 'NON-COMPLIANT',   bg: C.nonCompBg,   color: C.nonComp, border: '#fecaca' }
  }
}

function passFailPill(val: boolean | null) {
  if (val === null) return { bg: C.ringBg, color: C.ringFenced, border: '#fde68a', text: 'PENDING' }
  return val
    ? { bg: C.compliantBg, color: C.compliant, border: '#bbf7d0', text: 'PASS' }
    : { bg: C.nonCompBg,   color: C.nonComp,   border: '#fecaca', text: 'FAIL' }
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtPct(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  return `${n.toFixed(1)}%`
}

function titleCase(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Page Footer ─────────────────────────────────────────────────────────────

function PageFooter({ page, total }: { page: string; total: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerBrand}>NotoCharter™</Text>
      <Text style={s.footerText}>
        Mining Charter III Compliance Report — Confidential — Not for public distribution
      </Text>
      <Text style={s.footerText}>{page} of {total}</Text>
    </View>
  )
}

// ─── Page 1: Cover ───────────────────────────────────────────────────────────

function CoverPage({ data }: { data: PDFReportData }) {
  const mr = data.miningRight
  const cs = data.coverSheet
  const tier = tierConfig(data.scorecard?.overall_tier)

  return (
    <Page size="A4" style={s.page}>
      {/* Header */}
      <View style={s.headerBar}>
        <View style={s.brandRow}>
          <Text style={s.brandName}>NotoCharter</Text>
          <Text style={s.brandTm}>™</Text>
        </View>
        <Text style={s.brandTagline}>Mining Charter III Compliance Management</Text>
        <Text style={s.reportTitle}>MCIII Annual Compliance Report</Text>
        <Text style={s.reportSubtitle}>
          Calendar Year {cs.calendar_year} — Generated {fmtDate(data.generatedAt)}
        </Text>
      </View>
      <View style={s.goldBar} />

      {/* Body */}
      <View style={[s.body, { paddingBottom: 60 }]}>

        {/* Overall result banner */}
        <View style={[s.tierBadge, { backgroundColor: tier.bg, borderWidth: 1, borderColor: tier.border, marginBottom: 28 }]}>
          <View>
            <Text style={[s.tierLabel, { color: tier.color }]}>{tier.label}</Text>
            <Text style={{ fontSize: 9, color: tier.color, marginTop: 2 }}>
              Overall MCIII Compliance Status
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.tierScore, { color: tier.color }]}>
              {data.scorecard ? data.scorecard.overall_score.toFixed(1) : '—'}
            </Text>
            <Text style={[s.tierScoreSub, { color: tier.color }]}>/ 100 points</Text>
          </View>
        </View>

        {/* Mine & Right Details */}
        <Text style={s.sectionHeading}>Mining Right Details</Text>
        <View style={s.grid}>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Holder Entity</Text>
            <Text style={s.gridValue}>{mr?.holder_entity ?? '—'}</Text>
          </View>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>MR Number(s)</Text>
            <Text style={s.gridValue}>{cs.mr_number || mr?.mr_number || '—'}</Text>
          </View>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Province</Text>
            <Text style={s.gridValue}>{mr?.province ?? '—'}</Text>
          </View>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Commodity</Text>
            <Text style={s.gridValue}>{mr?.commodity ?? '—'}</Text>
          </View>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Right Type</Text>
            <Text style={s.gridValue}>{mr?.right_type ? titleCase(mr.right_type) : '—'}</Text>
          </View>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Reporting Year</Text>
            <Text style={s.gridValue}>{cs.calendar_year}</Text>
          </View>
        </View>

        {/* Submission Details */}
        <Text style={s.sectionHeading}>Submission Details</Text>
        <View style={s.grid}>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Submission Date</Text>
            <Text style={s.gridValue}>{fmtDate(cs.submission_date)}</Text>
          </View>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Contact Email</Text>
            <Text style={s.gridValue}>{cs.contact_email || '—'}</Text>
          </View>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Designation</Text>
            <Text style={s.gridValue}>{cs.signatory_designation || '—'}</Text>
          </View>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Prepared By</Text>
            <Text style={s.gridValue}>{cs.signatory_name || '—'}</Text>
          </View>
        </View>

        {/* Prepared by box */}
        <View style={s.notice}>
          <Text style={s.noticeText}>
            This report was generated by NotoCharter™, a Mining Charter III Compliance Management
            System developed by Kwahlelwa Group (Pty) Ltd for NPC-Cimpor (Pty) Ltd.
            All data is sourced directly from the NotoCharter compliance database.
            This document is for internal use and DMR submission purposes only.
          </Text>
        </View>

      </View>

      <PageFooter page="1" total="3" />
    </Page>
  )
}

// ─── Page 2: Scorecard Summary ────────────────────────────────────────────────

function ScorecardPage({ data }: { data: PDFReportData }) {
  const sc = data.scorecard
  const tier = tierConfig(sc?.overall_tier)

  const ringFenced = [
    { label: 'Ownership (A–G)',               val: sc?.ownership_compliant ?? null },
    { label: 'Mine Community Development (S)', val: sc?.mcd_compliant ?? null },
    { label: 'Housing & Living Conditions (W)',val: sc?.hlc_compliant ?? null },
  ]

  const quantitative = [
    { label: 'Employment Equity (T–V)',         weight: 30, score: sc?.ee_score ?? 0 },
    { label: 'Procurement & ESD (H–M)',         weight: 40, score: sc?.procurement_score ?? 0 },
    { label: 'Human Resource Development (Q–R)',weight: 30, score: sc?.hrd_score ?? 0 },
  ]

  const weighted = quantitative.reduce((sum, e) => sum + (e.score * e.weight) / 100, 0)

  return (
    <Page size="A4" style={s.page}>
      <View style={s.headerBar}>
        <View style={s.brandRow}>
          <Text style={s.brandName}>NotoCharter</Text>
          <Text style={s.brandTm}>™</Text>
        </View>
        <Text style={s.reportTitle}>MCIII Summary Scorecard — {data.coverSheet.calendar_year}</Text>
        <Text style={s.reportSubtitle}>{data.miningRight?.holder_entity ?? ''} · {data.coverSheet.mr_number}</Text>
      </View>
      <View style={s.goldBar} />

      <View style={[s.body, { paddingBottom: 60 }]}>

        {/* Overall badge */}
        <View style={[s.tierBadge, { backgroundColor: tier.bg, borderWidth: 1, borderColor: tier.border }]}>
          <View>
            <Text style={[s.tierLabel, { color: tier.color }]}>{tier.label}</Text>
            <Text style={{ fontSize: 9, color: tier.color, marginTop: 3 }}>
              {sc?.overall_tier === 'compliant'
                ? 'All elements met. Ring-fenced elements passed.'
                : sc?.overall_tier === 'ring_fenced'
                ? 'Quantitative score achieved. Ring-fenced elements require attention.'
                : 'One or more ring-fenced elements failed or score below 60%.'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.tierScore, { color: tier.color }]}>{weighted.toFixed(1)}</Text>
            <Text style={[s.tierScoreSub, { color: tier.color }]}>/ 100 points</Text>
          </View>
        </View>

        {/* Ring-fenced elements */}
        <Text style={s.sectionHeading}>Ring-Fenced Elements (Binary Pass/Fail)</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 3 }]}>Element</Text>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Status</Text>
            <Text style={[s.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Impact on Overall</Text>
          </View>
          {ringFenced.map((item, i) => {
            const pill = passFailPill(item.val)
            return (
              <View key={item.label} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                <Text style={[s.tableCell, { flex: 3 }]}>{item.label}</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={[s.pill, { backgroundColor: pill.bg, borderWidth: 1, borderColor: pill.border }]}>
                    <Text style={[s.pillText, { color: pill.color }]}>{pill.text}</Text>
                  </View>
                </View>
                <Text style={[s.tableCell, { flex: 2, textAlign: 'right', color: C.inkMuted }]}>
                  {item.val === null ? 'Awaiting data' : item.val ? 'Pass — no impact' : 'FAIL — Non-Compliant overall'}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Quantitative scores */}
        <Text style={s.sectionHeading}>Quantitative Elements (Scored)</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 3 }]}>Element</Text>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Weight</Text>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Score</Text>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Weighted</Text>
          </View>
          {quantitative.map((item, i) => {
            const wt = (item.score * item.weight) / 100
            const scoreColor = item.score >= 80 ? C.compliant : item.score >= 60 ? C.ringFenced : C.nonComp
            return (
              <View key={item.label} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                <Text style={[s.tableCell, { flex: 3 }]}>{item.label}</Text>
                <Text style={[s.tableCell, { flex: 1, textAlign: 'center' }]}>{item.weight}%</Text>
                <Text style={[s.tableCellBold, { flex: 1, textAlign: 'center', color: scoreColor }]}>
                  {fmtPct(item.score)}
                </Text>
                <Text style={[s.tableCellBold, { flex: 1, textAlign: 'right' }]}>{wt.toFixed(1)}</Text>
              </View>
            )
          })}
          {/* Total row */}
          <View style={[s.tableRow, { backgroundColor: C.navy }]}>
            <Text style={[s.tableCellBold, { flex: 3, color: C.white }]}>TOTAL (Quantitative)</Text>
            <Text style={[s.tableCellBold, { flex: 1, textAlign: 'center', color: C.gold }]}>100%</Text>
            <Text style={[s.tableCellBold, { flex: 1, textAlign: 'center', color: C.white }]}>—</Text>
            <Text style={[s.tableCellBold, { flex: 1, textAlign: 'right', color: C.gold }]}>
              {weighted.toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Note */}
        <View style={s.notice}>
          <Text style={s.noticeText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Note: </Text>
            Ring-fenced elements (Ownership, MCD, HLC) are not scored numerically.
            Failure of any ring-fenced element results in an overall Non-Compliant rating regardless
            of the quantitative score. All scores are calculated by the NotoCharter™ scoring engine
            in accordance with the Mining Charter 2018 regulations.
          </Text>
        </View>

      </View>

      <PageFooter page="2" total="3" />
    </Page>
  )
}

// ─── Page 3: Certification & Signature ────────────────────────────────────────

function SignaturePage({ data }: { data: PDFReportData }) {
  const cs = data.coverSheet
  const mr = data.miningRight

  return (
    <Page size="A4" style={s.page}>
      <View style={s.headerBar}>
        <View style={s.brandRow}>
          <Text style={s.brandName}>NotoCharter</Text>
          <Text style={s.brandTm}>™</Text>
        </View>
        <Text style={s.reportTitle}>Certification & Authorised Signature</Text>
        <Text style={s.reportSubtitle}>{mr?.holder_entity ?? ''} · Calendar Year {cs.calendar_year}</Text>
      </View>
      <View style={s.goldBar} />

      <View style={[s.body, { paddingBottom: 60 }]}>

        <Text style={s.sectionHeading}>Declaration</Text>

        <Text style={s.certText}>
          I, the undersigned, hereby certify that the information contained in this Mining Charter III
          Compliance Report for calendar year {cs.calendar_year} is true, accurate, and complete to the
          best of my knowledge and belief.
        </Text>
        <Text style={s.certText}>
          This report has been prepared in accordance with the Broad-Based Socio-Economic Empowerment
          Charter for the South African Mining and Minerals Industry, 2018 (Mining Charter III), as
          published in the Government Gazette under the Mineral and Petroleum Resources Development Act,
          2002 (Act No. 28 of 2002).
        </Text>
        <Text style={s.certText}>
          The data contained herein has been sourced from the company's official records and management
          information systems, and was compiled using NotoCharter™ by Kwahlelwa Group (Pty) Ltd.
        </Text>

        <Text style={s.sectionHeading}>Authorised Signatory</Text>

        {/* Signatory boxes */}
        <View style={[s.grid, { marginBottom: 0 }]}>
          <View style={[s.sigBox, { flex: 1, marginRight: 10 }]}>
            <Text style={s.gridLabel}>Full Name</Text>
            <Text style={[s.gridValue, { marginBottom: 0 }]}>{cs.signatory_name || ' '}</Text>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Signature</Text>
          </View>

          <View style={[s.sigBox, { flex: 1, marginLeft: 10 }]}>
            <Text style={s.gridLabel}>Designation / Title</Text>
            <Text style={[s.gridValue, { marginBottom: 0 }]}>{cs.signatory_designation || ' '}</Text>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Official Stamp (if applicable)</Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={s.sigBox}>
            <Text style={s.gridLabel}>Date Signed</Text>
            <Text style={[s.gridValue, { marginBottom: 0 }]}>{fmtDate(cs.submission_date)}</Text>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Date</Text>
          </View>
        </View>

        {/* Contact */}
        <Text style={[s.sectionHeading, { marginTop: 20 }]}>Contact for Queries</Text>
        <View style={s.grid}>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Email</Text>
            <Text style={s.gridValue}>{cs.contact_email || '—'}</Text>
          </View>
          <View style={s.gridItem}>
            <Text style={s.gridLabel}>Mining Right</Text>
            <Text style={s.gridValue}>{cs.mr_number || mr?.mr_number || '—'}</Text>
          </View>
        </View>

        <View style={s.notice}>
          <Text style={s.noticeText}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>Confidentiality Notice: </Text>
            This document contains commercially sensitive and legally privileged compliance information.
            It is intended solely for submission to the Department of Mineral Resources and Energy (DMRE)
            and for internal governance purposes. Unauthorised disclosure is prohibited.
          </Text>
        </View>

      </View>

      <PageFooter page="3" total="3" />
    </Page>
  )
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function CompliancePDFReport({ data }: { data: PDFReportData }) {
  return (
    <Document
      title={`NotoCharter MCIII Report — ${data.coverSheet.calendar_year}`}
      author="NotoCharter™ by Kwahlelwa Group"
      subject="Mining Charter III Annual Compliance Report"
      keywords="Mining Charter, MCIII, Compliance, NPC-Cimpor, DMR"
      creator="NotoCharter™"
    >
      <CoverPage data={data} />
      <ScorecardPage data={data} />
      <SignaturePage data={data} />
    </Document>
  )
}
