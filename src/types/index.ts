// ─── Enums ────────────────────────────────────────────────────────────────────

export type ComplianceTier = 'compliant' | 'non_compliant' | 'ring_fenced'

export type UserRole =
  | 'compliance_officer'
  | 'hr_manager'
  | 'procurement_lead'
  | 'slp_coordinator'
  | 'executive'
  | 'auditor'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  mining_right_ids: string[]
}

// ─── Core reference tables ────────────────────────────────────────────────────

export interface MiningRight {
  id: string
  mr_number: string
  right_type: 'existing' | 'new' | 'pending'
  holder_entity: string
  province: string
  commodity: string
  is_active: boolean
}

export interface Supplier {
  id: string
  registration_number: string
  trading_name: string
  bee_level: number | null
  bee_cert_expiry: string | null
  is_hdp_owned: boolean
  is_women_owned: boolean
  is_youth_owned: boolean
  is_local: boolean
}

// ─── MCIII Compliance Scorecard ───────────────────────────────────────────────

export interface MCIIIScorecard {
  mining_right_id: string
  calendar_year: number

  // Ring-fenced (Y/N)
  ownership_compliant: boolean | null
  mcd_compliant: boolean | null
  hlc_compliant: boolean | null

  // Quantitative scores (%)
  ee_score: number        // 30% weight
  procurement_score: number  // 40% weight
  hrd_score: number       // 30% weight

  overall_score: number
  overall_tier: ComplianceTier
  submission_deadline: string | null
  last_updated: string
}

// ─── Module A–G: Ownership ────────────────────────────────────────────────────

export interface OwnershipExisting {
  id: string
  mining_right_id: string
  calendar_year: number
  shareholder_name: string
  shareholder_type: 'hdp_individual' | 'esop' | 'host_community' | 'bee_entrepreneur' | 'other'
  bee_percentage: number
  effective_voting_rights: number
  effective_economic_interest: number
  financing_method: 'own_funds' | 'third_party_loan' | 'vendor_financing' | 'equity_equivalent'
  loan_balance: number | null
  notes: string | null
}

export interface OwnershipEsop {
  id: string
  mining_right_id: string
  calendar_year: number
  employee_name: string
  employee_id_number: string
  race: Race
  gender: Gender
  occupational_level: OccupationalLevel
  units_held: number
  value_per_unit: number
  total_value: number
}

export interface OwnershipHostCommunity {
  id: string
  mining_right_id: string
  calendar_year: number
  trust_name: string
  trust_registration: string
  host_community_name: string
  equity_percentage: number
  development_programme_description: string
  consultation_date: string
}

export interface OwnershipBeneficiation {
  id: string
  mining_right_id: string
  calendar_year: number
  beneficiation_activity: string
  equity_equivalent_value: number
  monetary_value: number
  plan_reference: string
}

// ─── Module H–M: Procurement ──────────────────────────────────────────────────

export interface ProcurementGoods {
  id: string
  mining_right_id: string
  calendar_year: number
  goods_description: string
  supplier_id: string | null
  is_mining_good: boolean
  total_spend: number
  local_content_percentage: number
  hdp_supplier: boolean
  women_owned_supplier: boolean
  youth_owned_supplier: boolean
  quarter: 1 | 2 | 3 | 4
}

export interface ProcurementServices {
  id: string
  mining_right_id: string
  calendar_year: number
  service_description: string
  supplier_id: string | null
  is_discretionary: boolean
  total_spend: number
  hdp_owned: boolean
  women_owned: boolean
  youth_owned: boolean
  quarter: 1 | 2 | 3 | 4
}

export interface ProcurementESD {
  id: string
  mining_right_id: string
  calendar_year: number
  beneficiary_company: string
  development_activities: string
  contract_start_date: string
  monetary_value: number
  bee_level: number
}

export interface ProcurementScorecard {
  mining_right_id: string
  calendar_year: number
  total_procurement_spend: number
  discretionary_spend: number
  mining_goods_spend: number
  mining_goods_local_content_pct: number
  hdp_services_spend: number
  women_services_spend: number
  youth_services_spend: number
  esd_offset_value: number
  procurement_score: number
  local_content_compliant: boolean
}

// ─── Module Q–R: HRD ─────────────────────────────────────────────────────────

export type Race = 'african' | 'coloured' | 'indian' | 'white' | 'foreign'
export type Gender = 'male' | 'female'
export type OccupationalLevel =
  | 'top_management'
  | 'senior_management'
  | 'professionally_qualified'
  | 'skilled_technical'
  | 'semi_skilled'
  | 'unskilled'

export type TrainingProgramme =
  | 'abet'
  | 'bursary'
  | 'learnership'
  | 'skills_programme'
  | 'internship'
  | 'apprenticeship'
  | 'other'

export interface HRDEmployee {
  id: string
  mining_right_id: string
  calendar_year: number
  employee_name: string
  id_number: string
  race: Race
  gender: Gender
  occupational_level: OccupationalLevel
  is_hdp: boolean
  programme_type: TrainingProgramme
  provider: string
  start_date: string
  end_date: string
  cost: number
}

export interface HRDNonEmployee {
  id: string
  mining_right_id: string
  calendar_year: number
  beneficiary_name: string
  community_name: string
  race: Race
  gender: Gender
  programme_type: TrainingProgramme
  provider: string
  start_date: string
  end_date: string
  cost: number
}

export interface HRDSummary {
  mining_right_id: string
  calendar_year: number
  leviable_payroll: number
  target_5pct: number
  actual_hrd_spend: number
  hdp_spend: number
  employee_beneficiaries: number
  non_employee_beneficiaries: number
  hrd_score: number
}

// ─── Module T–V: Employment Equity ───────────────────────────────────────────

export interface EEWorkforceRow {
  id: string
  mining_right_id: string
  calendar_year: number
  occupational_level: OccupationalLevel
  race: Race
  gender: Gender
  headcount: number
}

export interface EEIncomeDifferential {
  id: string
  mining_right_id: string
  calendar_year: number
  occupational_level: OccupationalLevel
  avg_income_hdp_male: number
  avg_income_hdp_female: number
  avg_income_white_male: number
  avg_income_white_female: number
}

export interface EETransitionalTarget {
  id: string
  mining_right_id: string
  ee_plan_reference: string
  occupational_level: OccupationalLevel
  race: Race
  gender: Gender
  year_1_target: number
  year_2_target: number
  year_3_target: number
  year_4_target: number
  year_5_target: number
}

// ─── Module S: Mine Community Development ────────────────────────────────────

export type CommunityType = 'mine_community' | 'adjacent_community' | 'labour_sending_area'

export interface MCDProject {
  id: string
  mining_right_id: string
  calendar_year: number
  project_description: string
  slp_reference: string
  municipality: string
  province: string
  community_type: CommunityType
  start_date: string
  end_date: string
  committed_budget: number
  actual_spend: number
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed'
  notes: string | null
}

// ─── Module W: Housing & Living Conditions ────────────────────────────────────

export interface HLCHousing {
  id: string
  mining_right_id: string
  calendar_year: number
  housing_plan_in_place: boolean
  housing_plan_date: string | null
  single_units_company_owned: number
  single_units_subsidised: number
  family_units_company_owned: number
  family_units_subsidised: number
  housing_allowance_recipients: number
  labour_consultation_date: string | null
  labour_consultation_notes: string | null
}

// ─── Module X: SED ───────────────────────────────────────────────────────────

export interface SEDProject {
  id: string
  mining_right_id: string
  calendar_year: number
  project_description: string
  licence_type: 'diamonds_act' | 'precious_metals_act'
  municipality: string
  province: string
  start_date: string
  end_date: string
  approved_budget: number
  actual_spend: number
  progress_vs_plan: string
  status: 'not_started' | 'in_progress' | 'completed'
}

// ─── Audit Trail ─────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string
  table_name: string
  record_id: string
  user_id: string
  user_email: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}
