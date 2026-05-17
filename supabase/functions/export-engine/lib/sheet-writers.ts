// sheet-writers.ts
// NotoCharter™ — DMR Export Engine
// One writer function per DMR sheet group.
// Cell mappings verified against Mining_Charter_Report_Template.xlsx v1.0 (28 sheets).
//
// STRATEGY: Write pre-computed values to DATA INPUT cells only.
// Formula cells are left untouched — Excel recalculates them when the user opens the file.
// Data input cells = cells that show null (blank) or a placeholder text like "Y/N" in the template.
//
// COLUMN REFERENCE (1-based, as used by ExcelJS getCell(row, col)):
// A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, I=9, J=10, K=11, L=12, M=13, N=14, O=15, P=16

// deno-lint-ignore-file no-explicit-any

type Workbook = any
type Worksheet = any

// ─── Helpers ─────────────────────────────────────────────────────────────────

function w(sheet: Worksheet, row: number, col: number, value: any): void {
  if (value === null || value === undefined) return
  const cell = sheet.getCell(row, col)
  // Skip cells that contain Excel formulas — let Excel recalculate them
  if (
    typeof cell.value === 'object' &&
    cell.value !== null &&
    'formula' in cell.value
  ) return
  cell.value = value
}

function yesNo(val: boolean | null): string {
  if (val === null || val === undefined) return ''
  return val ? 'Y' : 'N'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0] // YYYY-MM-DD
}

function raceLabel(race: string): string {
  const map: Record<string, string> = {
    african: 'African', coloured: 'Coloured', indian: 'Indian',
    white: 'White', foreign: 'Foreign',
  }
  return map[race] ?? race
}

function genderLabel(gender: string): string {
  return gender === 'male' ? 'Male' : 'Female'
}

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    top_management: 'Top Management',
    senior_management: 'Senior Management',
    professionally_qualified: 'Professionally Qualified',
    skilled_technical: 'Skilled Technical',
    semi_skilled: 'Semi-Skilled',
    unskilled: 'Unskilled',
  }
  return map[level] ?? level
}

function programmeLabel(p: string): string {
  const map: Record<string, string> = {
    abet: 'ABET', bursary: 'Bursary', learnership: 'Learnership',
    skills_programme: 'Skills Programme', internship: 'Internship',
    apprenticeship: 'Apprenticeship', other: 'Other',
  }
  return map[p] ?? p
}

// ─── 1. Submission Cover ─────────────────────────────────────────────────────
// Sheet: "Submission Cover"
// Labels in col B, data input in col C.

export function writeCoverSheet(
  wb: Workbook,
  coverSheet: {
    mr_number: string
    submission_date: string
    calendar_year: number
    signatory_designation: string
    signatory_name: string
    contact_email: string
  },
  miningRight: { holder_entity: string; province: string } | null,
) {
  const ws: Worksheet = wb.getWorksheet('Submission Cover')
  if (!ws) return

  // Row 3: Submission label (entity name)
  w(ws, 3, 3, miningRight?.holder_entity ?? '')
  // Row 4: Mining right type
  w(ws, 4, 3, 'Existing Mining Right')
  // Row 5: MR Number
  w(ws, 5, 3, coverSheet.mr_number)
  // Row 6: Submission date
  w(ws, 6, 3, formatDate(coverSheet.submission_date))
  // Row 7: Calendar year
  w(ws, 7, 3, coverSheet.calendar_year)
  // Row 8: Designation of signatory
  w(ws, 8, 3, coverSheet.signatory_designation)
  // Row 9: Name of signatory
  w(ws, 9, 3, coverSheet.signatory_name)
  // Row 14: Contact email
  w(ws, 14, 3, coverSheet.contact_email)
}

// ─── 2. MCIII Score Card ──────────────────────────────────────────────────────
// Sheet: "MCIII Score Card"
// Rows 9-13: Ring-fenced Y/N inputs (col C). All other cells are formula cells.

export function writeScorecardSheet(
  wb: Workbook,
  scorecard: {
    ownership_compliant: boolean | null
    mcd_compliant: boolean | null
    hlc_compliant: boolean | null
    ee_score: number
    procurement_score: number
    hrd_score: number
    overall_tier: string
  } | null,
) {
  const ws: Worksheet = wb.getWorksheet('MCIII Score Card')
  if (!ws || !scorecard) return

  // Col C rows 9-11: Ownership ring-fenced Y/N (new/existing/pending rights)
  w(ws, 9, 3, yesNo(scorecard.ownership_compliant))   // New rights
  w(ws, 10, 3, yesNo(scorecard.ownership_compliant))  // Existing rights
  w(ws, 11, 3, 'N/A')                                 // Pending (assume N/A)
  // Col C row 12: MCD ring-fenced Y/N
  w(ws, 12, 3, yesNo(scorecard.mcd_compliant))
  // Col C row 13: HLC ring-fenced Y/N
  w(ws, 13, 3, yesNo(scorecard.hlc_compliant))
  // Note: EE/Procurement/HRD scores (rows 14-16) are formula cells — leave untouched
}

// ─── 3. Table A — Ownership Existing MR ──────────────────────────────────────
// Sheet: "Table A_Own_Existing MR"
// Vertical layout: labels in col B, values in col C.

export function writeTableA(
  wb: Workbook,
  ownership: Array<{
    shareholder_name: string
    shareholder_type: string
    bee_percentage: number
    effective_voting_rights: number
    effective_economic_interest: number
    financing_method: string
    loan_balance: number | null
    notes: string | null
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table A_Own_Existing MR')
  if (!ws) return

  const totalBEE = ownership.reduce((s, r) => s + r.bee_percentage, 0)
  const hdpBEE = ownership
    .filter(r => ['hdp_individual', 'esop', 'host_community'].includes(r.shareholder_type))
    .reduce((s, r) => s + r.bee_percentage, 0)

  const avgVoting = ownership.length > 0
    ? ownership.reduce((s, r) => s + r.effective_voting_rights, 0) / ownership.length
    : 0
  const avgEconomic = ownership.length > 0
    ? ownership.reduce((s, r) => s + r.effective_economic_interest, 0) / ownership.length
    : 0

  const primary = ownership[0]

  // Row 9: Current BEE % share
  w(ws, 9, 3, +hdpBEE.toFixed(2))
  // Row 10: Maximum target reached (≥26%)
  w(ws, 10, 3, totalBEE >= 26 ? 'Y' : 'N')
  // Row 11: Financing method
  w(ws, 11, 3, primary?.financing_method?.replace(/_/g, ' ') ?? '')
  // Row 12: Initial loan amount
  w(ws, 12, 3, primary?.loan_balance ?? 0)
  // Row 13: Current loan balance
  w(ws, 13, 3, primary?.loan_balance ?? 0)
  // Row 14: Dividends declared (not in model — leave blank)
  w(ws, 14, 3, '')
  // Row 15: Voting rights %
  w(ws, 15, 3, +avgVoting.toFixed(2))
  // Row 16: Meaningful economic participation
  w(ws, 16, 3, avgEconomic >= 26 ? 'Meets 26% economic participation requirement' : 'Below 26% economic participation threshold')
}

// ─── 4. Table B — ESOP ────────────────────────────────────────────────────────
// Sheet: "Table B_Own_ESOPS"
// Row-per-record: headers at R9-R10, data from R11.

export function writeTableB(
  wb: Workbook,
  esop: Array<{
    employee_name: string
    employee_id_number: string
    race: string
    gender: string
    occupational_level: string
    units_held: number
    value_per_unit: number
    total_value: number
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table B_Own_ESOPS')
  if (!ws) return

  esop.forEach((row, i) => {
    const r = 11 + i
    w(ws, r, 2, row.employee_name)
    w(ws, r, 3, row.employee_id_number)
    w(ws, r, 4, raceLabel(row.race))
    w(ws, r, 5, genderLabel(row.gender))
    w(ws, r, 6, levelLabel(row.occupational_level))
    w(ws, r, 7, row.units_held)
    w(ws, r, 8, row.value_per_unit)
    w(ws, r, 9, row.total_value)
  })
}

// ─── 5. Table C — Host Community ─────────────────────────────────────────────
// Sheet: "Table C_Own_Host Comm"

export function writeTableC(
  wb: Workbook,
  hostCommunity: Array<{
    trust_name: string
    trust_registration: string
    host_community_name: string
    equity_percentage: number
    development_programme_description: string
    consultation_date: string
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table C_Own_Host Comm')
  if (!ws) return

  hostCommunity.forEach((row, i) => {
    const r = 11 + i
    w(ws, r, 2, row.trust_name)
    w(ws, r, 3, row.trust_registration)
    w(ws, r, 4, row.host_community_name)
    w(ws, r, 5, +row.equity_percentage.toFixed(2))
    w(ws, r, 6, row.development_programme_description)
    w(ws, r, 7, formatDate(row.consultation_date))
  })
}

// ─── 6. Table H — Procurement Goods ──────────────────────────────────────────
// Sheet: "Table H_Proc_Goods"
// Headers R9-R10, totals R11 (formula), data from R12.
// Cols: B=company, C=HDP%, D=Women%, E=Youth%, F=BEE level,
//       G=product ID, H=goods desc, I=amount, J=start, K=end,
//       M=HDP qualifying, N=Women qualifying, O=Youth qualifying, P=BEE compliant

export function writeTableH(
  wb: Workbook,
  goods: Array<{
    goods_description: string
    total_spend: number
    local_content_percentage: number
    hdp_supplier: boolean
    women_owned_supplier: boolean
    youth_owned_supplier: boolean
    is_mining_good: boolean
    quarter: number
    supplier?: {
      trading_name: string | null
      bee_level: number | null
      is_hdp_owned: boolean
      is_women_owned: boolean
      is_youth_owned: boolean
    } | null
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table H_Proc_Goods')
  if (!ws) return

  goods.forEach((row, i) => {
    const r = 12 + i
    const supplierName = row.supplier?.trading_name ?? ''
    const beeLevel = row.supplier?.bee_level ?? ''
    const hdpPct = row.hdp_supplier ? 100 : 0
    const womenPct = row.women_owned_supplier ? 100 : 0
    const youthPct = row.youth_owned_supplier ? 100 : 0
    const hdpQualifying = row.hdp_supplier ? row.total_spend : 0
    const womenQualifying = row.women_owned_supplier ? row.total_spend : 0
    const youthQualifying = row.youth_owned_supplier ? row.total_spend : 0

    w(ws, r, 2, supplierName)
    w(ws, r, 3, hdpPct)
    w(ws, r, 4, womenPct)
    w(ws, r, 5, youthPct)
    w(ws, r, 6, beeLevel)
    w(ws, r, 7, row.is_mining_good ? 'Mining Good' : 'General')
    w(ws, r, 8, row.goods_description)
    w(ws, r, 9, row.total_spend)
    w(ws, r, 13, hdpQualifying)
    w(ws, r, 14, womenQualifying)
    w(ws, r, 15, youthQualifying)
    w(ws, r, 16, row.hdp_supplier || row.women_owned_supplier || row.youth_owned_supplier ? 'Y' : 'N')
  })
}

// ─── 7. Table I — Procurement Services ───────────────────────────────────────
// Sheet: "Table I_Proc_Services"
// Same structure as Table H.

export function writeTableI(
  wb: Workbook,
  services: Array<{
    service_description: string
    total_spend: number
    hdp_owned: boolean
    women_owned: boolean
    youth_owned: boolean
    is_discretionary: boolean
    quarter: number
    supplier?: {
      trading_name: string | null
      bee_level: number | null
    } | null
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table I_Proc_Services')
  if (!ws) return

  services.forEach((row, i) => {
    const r = 12 + i
    w(ws, r, 2, row.supplier?.trading_name ?? '')
    w(ws, r, 3, row.hdp_owned ? 100 : 0)
    w(ws, r, 4, row.women_owned ? 100 : 0)
    w(ws, r, 5, row.youth_owned ? 100 : 0)
    w(ws, r, 6, row.supplier?.bee_level ?? '')
    w(ws, r, 8, row.service_description)
    w(ws, r, 9, row.total_spend)
    w(ws, r, 13, row.hdp_owned ? row.total_spend : 0)
    w(ws, r, 14, row.women_owned ? row.total_spend : 0)
    w(ws, r, 15, row.youth_owned ? row.total_spend : 0)
    w(ws, r, 16, row.hdp_owned || row.women_owned || row.youth_owned ? 'Y' : 'N')
  })
}

// ─── 8. Table J — Procurement ESD ────────────────────────────────────────────
// Sheet: "Table J_Proc_E&SD"

export function writeTableJ(
  wb: Workbook,
  esd: Array<{
    beneficiary_company: string
    development_activities: string
    contract_start_date: string
    monetary_value: number
    bee_level: number
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table J_Proc_E&SD')
  if (!ws) return

  esd.forEach((row, i) => {
    const r = 11 + i
    w(ws, r, 2, row.beneficiary_company)
    w(ws, r, 3, row.bee_level)
    w(ws, r, 4, row.development_activities)
    w(ws, r, 5, formatDate(row.contract_start_date))
    w(ws, r, 6, row.monetary_value)
  })
}

// ─── 9. Table Q — HRD Employees ──────────────────────────────────────────────
// Sheet: "Table Q_HRD_Employees"
// Headers R9, totals R10 (formula), data from R11.
// Cols: B=name, C=ID, D=race, E=gender, F=level, G=programme,
//       H=duration, I=start date, J=institution, K=cost

export function writeTableQ(
  wb: Workbook,
  employees: Array<{
    employee_name: string
    id_number: string
    race: string
    gender: string
    occupational_level: string
    is_hdp: boolean
    programme_type: string
    provider: string
    start_date: string
    end_date: string
    cost: number
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table Q_HRD_Employees')
  if (!ws) return

  employees.forEach((row, i) => {
    const r = 11 + i
    w(ws, r, 2, row.employee_name)
    w(ws, r, 3, row.id_number)
    w(ws, r, 4, raceLabel(row.race))
    w(ws, r, 5, genderLabel(row.gender))
    w(ws, r, 6, levelLabel(row.occupational_level))
    w(ws, r, 7, programmeLabel(row.programme_type))
    // Duration: "start_date to end_date"
    const duration = (formatDate(row.start_date) && formatDate(row.end_date))
      ? `${formatDate(row.start_date)} to ${formatDate(row.end_date)}`
      : ''
    w(ws, r, 8, duration)
    w(ws, r, 9, formatDate(row.start_date))
    w(ws, r, 10, row.provider)
    w(ws, r, 11, row.cost)
  })
}

// ─── 10. Table R — HRD Non-Employees ─────────────────────────────────────────
// Sheet: "Table R_HRD_NonEmpl"

export function writeTableR(
  wb: Workbook,
  nonEmployees: Array<{
    beneficiary_name: string
    community_name: string
    race: string
    gender: string
    programme_type: string
    provider: string
    start_date: string
    end_date: string
    cost: number
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table R_HRD_NonEmpl')
  if (!ws) return

  nonEmployees.forEach((row, i) => {
    const r = 11 + i
    w(ws, r, 2, row.beneficiary_name)
    w(ws, r, 3, row.community_name)
    w(ws, r, 4, raceLabel(row.race))
    w(ws, r, 5, genderLabel(row.gender))
    w(ws, r, 6, programmeLabel(row.programme_type))
    const duration = (formatDate(row.start_date) && formatDate(row.end_date))
      ? `${formatDate(row.start_date)} to ${formatDate(row.end_date)}`
      : ''
    w(ws, r, 7, duration)
    w(ws, r, 8, formatDate(row.start_date))
    w(ws, r, 9, row.provider)
    w(ws, r, 10, row.cost)
  })
}

// ─── 11. Table S — Mine Community Development ─────────────────────────────────
// Sheet: "Table S_MCD"
// Each project occupies a 20-row block starting at R10.
// Within each block:
//   offset +0:  Project header (number in col C)
//   offset +1:  "APPROVED PROJECT DESCRIPTION" label → data in col G
//   offset +2:  "DURATION" label → data in col G
//   offset +3:  "WORK DONE" label → data in col G
//   offset +4:  "PROJECT REVIEW TIMELINE" label → data in col G
//   offset +5:  "TOTAL BUDGET AMOUNT" label → data in col G
//   offset +6:  "TOTAL AMOUNT SPENT" label → data in col G
//   offset +7:  "CAPPED FEES" label → data in col G
//   offset +8:  Community type headers (read-only)
//   offset +9:  Sub-column headers (read-only)
//   offset +10: Mine community data row  (B=name, C=municipality, D=amount)
//   offset +11: Adjacent community row   (E=name, F=municipality, H=amount)
//   offset +12: Labour sending area row  (I=name, J=municipality, K=amount)

export function writeTableS(
  wb: Workbook,
  projects: Array<{
    project_description: string
    slp_reference: string
    municipality: string
    province: string
    community_type: string
    start_date: string
    end_date: string
    committed_budget: number
    actual_spend: number
    status: string
    notes: string | null
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table S_MCD')
  if (!ws) return

  // Group projects by description (a single SLP project may have multiple community entries)
  const projectMap = new Map<string, typeof projects>()
  for (const p of projects) {
    const key = p.project_description
    if (!projectMap.has(key)) projectMap.set(key, [])
    projectMap.get(key)!.push(p)
  }

  Array.from(projectMap.entries()).forEach(([desc, entries], i) => {
    const base = 10 + i * 20
    const primary = entries[0]

    // Project header
    w(ws, base, 3, i + 1) // Project number

    // Description (col G = column 7)
    w(ws, base + 1, 7, desc)
    // Duration
    w(ws, base + 2, 7,
      `${formatDate(primary.start_date)} to ${formatDate(primary.end_date)}`)
    // Work done / progress
    w(ws, base + 3, 7, primary.notes ?? primary.status)
    // SLP reference
    w(ws, base + 4, 7, primary.slp_reference)
    // Total budget
    w(ws, base + 5, 7, primary.committed_budget)
    // Total spent
    w(ws, base + 6, 7, primary.actual_spend)

    // Community data rows (starting at base+10)
    const mine = entries.find(e => e.community_type === 'mine_community')
    const adjacent = entries.find(e => e.community_type === 'adjacent_community')
    const labour = entries.find(e => e.community_type === 'labour_sending_area')

    if (mine) {
      w(ws, base + 10, 2, mine.municipality) // Name (use municipality as proxy)
      w(ws, base + 10, 3, mine.municipality)
      w(ws, base + 10, 4, mine.actual_spend)
    }
    if (adjacent) {
      w(ws, base + 11, 5, adjacent.municipality)
      w(ws, base + 11, 6, adjacent.municipality)
      w(ws, base + 11, 8, adjacent.actual_spend)
    }
    if (labour) {
      w(ws, base + 12, 9, labour.municipality)
      w(ws, base + 12, 10, labour.municipality)
      w(ws, base + 12, 11, labour.actual_spend)
    }
  })
}

// ─── 12. Table T — Employment Equity ─────────────────────────────────────────
// Sheet: "Table T_EE"
// Matrix: rows 11-17 = occupational levels, cols C-L = race × gender.
// Col C=Male African, D=Male Coloured, E=Male Indian, F=Male White,
//     G=Female African, H=Female Coloured, I=Female Indian, J=Female White,
//     K=Foreign Male, L=Foreign Female.
// Col M = TOTAL (formula — leave untouched).
// Row 18 = GRAND TOTAL (formula — leave untouched).

const EE_LEVEL_ROW: Record<string, number> = {
  top_management: 11,        // Board / Executive
  senior_management: 13,     // Senior management
  professionally_qualified: 14, // Middle management
  skilled_technical: 15,     // Junior management
  semi_skilled: 16,          // People with disabilities (best-fit)
  unskilled: 17,             // Core and critical skills (best-fit)
}

const EE_RACE_GENDER_COL: Record<string, Record<string, number>> = {
  african:  { male: 3, female: 7 },
  coloured: { male: 4, female: 8 },
  indian:   { male: 5, female: 9 },
  white:    { male: 6, female: 10 },
  foreign:  { male: 11, female: 12 },
}

export function writeTableT(
  wb: Workbook,
  eeRows: Array<{
    occupational_level: string
    race: string
    gender: string
    headcount: number
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table T_EE')
  if (!ws) return

  for (const row of eeRows) {
    const r = EE_LEVEL_ROW[row.occupational_level]
    const col = EE_RACE_GENDER_COL[row.race]?.[row.gender]
    if (!r || !col) continue
    // Get current cell value and ADD to it (multiple records may share same level)
    const cell = ws.getCell(r, col)
    const existing = typeof cell.value === 'number' ? cell.value : 0
    cell.value = existing + row.headcount
  }
}

// ─── 13. Table W — Housing & Living Conditions ────────────────────────────────
// Sheet: "Table W_HLC"
// Labels in col B, data input in col C. Rows 9-17.

export function writeTableW(
  wb: Workbook,
  hlc: {
    housing_plan_in_place: boolean
    housing_plan_date: string | null
    single_units_company_owned: number
    single_units_subsidised: number
    family_units_company_owned: number
    family_units_subsidised: number
    housing_allowance_recipients: number
    labour_consultation_date: string | null
    labour_consultation_notes: string | null
  } | null,
) {
  const ws: Worksheet = wb.getWorksheet('Table W_HLC')
  if (!ws || !hlc) return

  // Row 9: Housing plan in place
  w(ws, 9, 3, hlc.housing_plan_in_place ? 'Yes' : 'No')
  // Row 10: Consultation with organised labour
  w(ws, 10, 3, hlc.labour_consultation_date ? 'Yes' : 'No')
  // Row 11: Date of submission / housing plan date
  w(ws, 11, 3, formatDate(hlc.housing_plan_date))
  // Row 12: Single units (company-owned + subsidised)
  w(ws, 12, 3, hlc.single_units_company_owned + hlc.single_units_subsidised)
  // Row 13: Family units (company-owned + subsidised)
  w(ws, 13, 3, hlc.family_units_company_owned + hlc.family_units_subsidised)
  // Row 14: Rental subsidy recipients
  w(ws, 14, 3, hlc.housing_allowance_recipients)
  // Row 15: Home ownership subsidy (not in model — leave blank)
  w(ws, 15, 3, 0)
  // Row 16: Living out allowance (not in model — leave blank)
  w(ws, 16, 3, 0)
  // Row 17: Total employees (sum of all units + allowances)
  const total =
    hlc.single_units_company_owned + hlc.single_units_subsidised +
    hlc.family_units_company_owned + hlc.family_units_subsidised +
    hlc.housing_allowance_recipients
  w(ws, 17, 3, total)
}

// ─── 14. Table X — SED ────────────────────────────────────────────────────────
// Sheet: "Table X_SED"
// Merged labels in cols B-D, data input in col E. Data from R9-R15.
// Community data from R18.

export function writeTableX(
  wb: Workbook,
  projects: Array<{
    project_description: string
    licence_type: string
    municipality: string
    province: string
    start_date: string
    end_date: string
    approved_budget: number
    actual_spend: number
    progress_vs_plan: string
    status: string
  }>,
) {
  const ws: Worksheet = wb.getWorksheet('Table X_SED')
  if (!ws || projects.length === 0) return

  const primary = projects[0]

  // Row 9: Project description (col E = column 5)
  w(ws, 9, 5, primary.project_description)
  // Row 10: Duration
  w(ws, 10, 5, `${formatDate(primary.start_date)} to ${formatDate(primary.end_date)}`)
  // Row 11: Work done to date
  w(ws, 11, 5, primary.progress_vs_plan)
  // Row 12: Project review timeline
  w(ws, 12, 5, primary.status)
  // Row 13: Total budget amount
  w(ws, 13, 5, primary.approved_budget)
  // Row 14: Total amount spent
  w(ws, 14, 5, primary.actual_spend)
  // Row 15: Capped fees (not in model)
  w(ws, 15, 5, 0)

  // Community data — row 18: B=mine community name, C=municipality, D=amount
  w(ws, 18, 2, primary.municipality)
  w(ws, 18, 3, primary.municipality)
  w(ws, 18, 4, primary.actual_spend)

  // Additional SED projects — note: template has only 1 project block in standard layout
  // Any additional projects are appended as notes in col B from row 19
  if (projects.length > 1) {
    w(ws, 19, 2, `Additional SED projects: ${projects.length - 1} more (see NotoCharter system for detail)`)
  }
}
