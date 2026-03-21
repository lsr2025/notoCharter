// ─────────────────────────────────────────────────────────────────────────────
// NotoCharter™ — Demo / Presentation Data
// Realistic NPC-Cimpor data for client approval demo
// Kwahlelwa Group (Pty) Ltd
// ─────────────────────────────────────────────────────────────────────────────

import type {
  MiningRight, MCIIIScorecard, OwnershipExisting, ProcurementGoods,
  HRDEmployee, EEWorkforceRow, MCDProject, HLCHousing, AuditLogEntry,
} from '@/types'

export const DEMO_YEAR = 2024

export const DEMO_MINING_RIGHTS: MiningRight[] = [
  { id: 'mr-001', mr_number: 'NC 30/5/1/2/10452 MR', right_type: 'existing', holder_entity: 'NPC-Cimpor (Pty) Ltd', province: 'Northern Cape', commodity: 'Limestone / Cement', is_active: true },
  { id: 'mr-002', mr_number: 'LP 30/5/1/2/20318 MR', right_type: 'existing', holder_entity: 'NPC-Cimpor (Pty) Ltd', province: 'Limpopo', commodity: 'Limestone / Cement', is_active: true },
  { id: 'mr-003', mr_number: 'FS 30/5/1/2/30091 MR', right_type: 'existing', holder_entity: 'NPC-Cimpor (Pty) Ltd', province: 'Free State', commodity: 'Limestone / Cement', is_active: true },
]

export const DEMO_SCORECARDS: Record<string, MCIIIScorecard> = {
  'mr-001': {
    mining_right_id: 'mr-001', calendar_year: DEMO_YEAR,
    ownership_compliant: true, mcd_compliant: true, hlc_compliant: true,
    ee_score: 74.2, procurement_score: 86.8, hrd_score: 63.5,
    overall_score: 74.2 * 0.30 + 86.8 * 0.40 + 63.5 * 0.30,
    overall_tier: 'compliant',
    submission_deadline: `${DEMO_YEAR + 1}-03-31`,
    last_updated: new Date().toISOString(),
  },
  'mr-002': {
    mining_right_id: 'mr-002', calendar_year: DEMO_YEAR,
    ownership_compliant: true, mcd_compliant: false, hlc_compliant: true,
    ee_score: 68.1, procurement_score: 79.4, hrd_score: 55.0,
    overall_score: 68.1 * 0.30 + 79.4 * 0.40 + 55.0 * 0.30,
    overall_tier: 'non_compliant',
    submission_deadline: `${DEMO_YEAR + 1}-03-31`,
    last_updated: new Date().toISOString(),
  },
  'mr-003': {
    mining_right_id: 'mr-003', calendar_year: DEMO_YEAR,
    ownership_compliant: true, mcd_compliant: true, hlc_compliant: true,
    ee_score: 81.0, procurement_score: 91.2, hrd_score: 72.3,
    overall_score: 81.0 * 0.30 + 91.2 * 0.40 + 72.3 * 0.30,
    overall_tier: 'compliant',
    submission_deadline: `${DEMO_YEAR + 1}-03-31`,
    last_updated: new Date().toISOString(),
  },
}

export const DEMO_OWNERSHIP: OwnershipExisting[] = [
  { id: 'own-001', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, shareholder_name: 'NPC-Cimpor BEE Trust', shareholder_type: 'hdp_individual', bee_percentage: 18.5, effective_voting_rights: 18.5, effective_economic_interest: 18.5, financing_method: 'vendor_financing', loan_balance: 45000000, notes: null },
  { id: 'own-002', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, shareholder_name: 'Makana Community Trust', shareholder_type: 'host_community', bee_percentage: 5.0, effective_voting_rights: 5.0, effective_economic_interest: 5.0, financing_method: 'equity_equivalent', loan_balance: null, notes: 'Equity equivalent plan approved by DMR 2022' },
  { id: 'own-003', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, shareholder_name: 'Sithembele Nxumalo Investments', shareholder_type: 'bee_entrepreneur', bee_percentage: 3.5, effective_voting_rights: 3.5, effective_economic_interest: 3.5, financing_method: 'third_party_loan', loan_balance: 8200000, notes: null },
]

export const DEMO_PROCUREMENT: ProcurementGoods[] = [
  { id: 'proc-001', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, goods_description: 'Crusher liners & wear parts', supplier_id: null, is_mining_good: true, total_spend: 12400000, local_content_percentage: 82, hdp_supplier: true, women_owned_supplier: false, youth_owned_supplier: false, quarter: 1 },
  { id: 'proc-002', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, goods_description: 'Explosives — ANFO bulk', supplier_id: null, is_mining_good: true, total_spend: 8750000, local_content_percentage: 95, hdp_supplier: false, women_owned_supplier: false, youth_owned_supplier: false, quarter: 1 },
  { id: 'proc-003', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, goods_description: 'Conveyor belts & components', supplier_id: null, is_mining_good: true, total_spend: 5600000, local_content_percentage: 71, hdp_supplier: true, women_owned_supplier: true, youth_owned_supplier: false, quarter: 2 },
  { id: 'proc-004', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, goods_description: 'Grinding media — steel balls', supplier_id: null, is_mining_good: true, total_spend: 9200000, local_content_percentage: 68, hdp_supplier: false, women_owned_supplier: false, youth_owned_supplier: false, quarter: 2 },
  { id: 'proc-005', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, goods_description: 'Electrical components', supplier_id: null, is_mining_good: false, total_spend: 3100000, local_content_percentage: 55, hdp_supplier: true, women_owned_supplier: false, youth_owned_supplier: true, quarter: 3 },
  { id: 'proc-006', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, goods_description: 'Drilling equipment & spares', supplier_id: null, is_mining_good: true, total_spend: 7800000, local_content_percentage: 76, hdp_supplier: true, women_owned_supplier: false, youth_owned_supplier: false, quarter: 3 },
  { id: 'proc-007', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, goods_description: 'PPE — bulk order', supplier_id: null, is_mining_good: false, total_spend: 1850000, local_content_percentage: 88, hdp_supplier: true, women_owned_supplier: true, youth_owned_supplier: true, quarter: 4 },
  { id: 'proc-008', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, goods_description: 'Refractory bricks', supplier_id: null, is_mining_good: true, total_spend: 4400000, local_content_percentage: 74, hdp_supplier: false, women_owned_supplier: false, youth_owned_supplier: false, quarter: 4 },
]

export const DEMO_HRD: HRDEmployee[] = [
  { id: 'hrd-001', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, employee_name: 'Thabo Mokoena', id_number: '9001015800089', race: 'african', gender: 'male', occupational_level: 'skilled_technical', is_hdp: true, programme_type: 'skills_programme', provider: 'Mining Qualifications Authority', start_date: '2024-02-01', end_date: '2024-11-30', cost: 28000 },
  { id: 'hrd-002', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, employee_name: 'Nomvula Dlamini', id_number: '9505120800088', race: 'african', gender: 'female', occupational_level: 'professionally_qualified', is_hdp: true, programme_type: 'bursary', provider: 'University of Pretoria', start_date: '2024-01-15', end_date: '2024-12-15', cost: 85000 },
  { id: 'hrd-003', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, employee_name: 'Sipho Zulu', id_number: '9203075800082', race: 'african', gender: 'male', occupational_level: 'semi_skilled', is_hdp: true, programme_type: 'abet', provider: 'ABET Solutions SA', start_date: '2024-03-01', end_date: '2024-08-31', cost: 12000 },
  { id: 'hrd-004', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, employee_name: 'Amahle Ntuli', id_number: '9410180800086', race: 'african', gender: 'female', occupational_level: 'skilled_technical', is_hdp: true, programme_type: 'learnership', provider: 'Mining Qualifications Authority', start_date: '2024-01-01', end_date: '2024-12-31', cost: 45000 },
  { id: 'hrd-005', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, employee_name: 'Pieter van der Merwe', id_number: '8507145800081', race: 'white', gender: 'male', occupational_level: 'senior_management', is_hdp: false, programme_type: 'skills_programme', provider: 'Gordon Institute of Business Science', start_date: '2024-04-01', end_date: '2024-06-30', cost: 62000 },
  { id: 'hrd-006', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, employee_name: 'Lindiwe Khumalo', id_number: '9112250800083', race: 'african', gender: 'female', occupational_level: 'professionally_qualified', is_hdp: true, programme_type: 'bursary', provider: 'Wits University', start_date: '2024-01-15', end_date: '2024-11-30', cost: 92000 },
  { id: 'hrd-007', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, employee_name: 'Themba Shabalala', id_number: '9306014800085', race: 'african', gender: 'male', occupational_level: 'unskilled', is_hdp: true, programme_type: 'abet', provider: 'ABET Solutions SA', start_date: '2024-02-15', end_date: '2024-07-15', cost: 9500 },
  { id: 'hrd-008', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, employee_name: 'Faheema Ismail', id_number: '9609180800087', race: 'indian', gender: 'female', occupational_level: 'professionally_qualified', is_hdp: true, programme_type: 'internship', provider: 'NPC-Cimpor Internal', start_date: '2024-01-01', end_date: '2024-12-31', cost: 38000 },
]

export const DEMO_EE_MATRIX: EEWorkforceRow[] = [
  // Top Management
  { id: 'ee-001', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'top_management', race: 'african', gender: 'male', headcount: 2 },
  { id: 'ee-002', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'top_management', race: 'white', gender: 'male', headcount: 3 },
  { id: 'ee-003', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'top_management', race: 'african', gender: 'female', headcount: 1 },
  // Senior Management
  { id: 'ee-004', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'senior_management', race: 'african', gender: 'male', headcount: 8 },
  { id: 'ee-005', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'senior_management', race: 'white', gender: 'male', headcount: 12 },
  { id: 'ee-006', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'senior_management', race: 'african', gender: 'female', headcount: 3 },
  { id: 'ee-007', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'senior_management', race: 'coloured', gender: 'male', headcount: 2 },
  // Professionally Qualified
  { id: 'ee-008', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'professionally_qualified', race: 'african', gender: 'male', headcount: 28 },
  { id: 'ee-009', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'professionally_qualified', race: 'african', gender: 'female', headcount: 14 },
  { id: 'ee-010', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'professionally_qualified', race: 'white', gender: 'male', headcount: 19 },
  { id: 'ee-011', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'professionally_qualified', race: 'indian', gender: 'female', headcount: 4 },
  { id: 'ee-012', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'professionally_qualified', race: 'coloured', gender: 'male', headcount: 6 },
  // Skilled & Technical
  { id: 'ee-013', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'skilled_technical', race: 'african', gender: 'male', headcount: 145 },
  { id: 'ee-014', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'skilled_technical', race: 'african', gender: 'female', headcount: 42 },
  { id: 'ee-015', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'skilled_technical', race: 'coloured', gender: 'male', headcount: 18 },
  { id: 'ee-016', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'skilled_technical', race: 'white', gender: 'male', headcount: 35 },
  // Semi-skilled
  { id: 'ee-017', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'semi_skilled', race: 'african', gender: 'male', headcount: 312 },
  { id: 'ee-018', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'semi_skilled', race: 'african', gender: 'female', headcount: 88 },
  { id: 'ee-019', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'semi_skilled', race: 'coloured', gender: 'male', headcount: 24 },
  // Unskilled
  { id: 'ee-020', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'unskilled', race: 'african', gender: 'male', headcount: 198 },
  { id: 'ee-021', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, occupational_level: 'unskilled', race: 'african', gender: 'female', headcount: 56 },
]

export const DEMO_MCD: MCDProject[] = [
  { id: 'mcd-001', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, project_description: 'Construction of Loxton Primary School — 8 additional classrooms and ablution facilities', slp_reference: 'SLP-NC-2024-001', municipality: 'Ubuntu Local Municipality', province: 'Northern Cape', community_type: 'mine_community', start_date: '2024-01-15', end_date: '2025-03-31', committed_budget: 4200000, actual_spend: 3150000, status: 'in_progress', notes: 'Phase 1 complete. Phase 2 (roof) in progress.' },
  { id: 'mcd-002', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, project_description: 'Borehole installation and water reticulation — 3 boreholes serving 450 households', slp_reference: 'SLP-NC-2024-002', municipality: 'Thembelihle Local Municipality', province: 'Northern Cape', community_type: 'adjacent_community', start_date: '2024-03-01', end_date: '2024-09-30', committed_budget: 1800000, actual_spend: 1800000, status: 'completed', notes: null },
  { id: 'mcd-003', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, project_description: 'Agricultural skills development programme — 60 smallholder farmers, Britstown ward', slp_reference: 'SLP-NC-2024-003', municipality: 'Emthanjeni Local Municipality', province: 'Northern Cape', community_type: 'labour_sending_area', start_date: '2024-02-01', end_date: '2024-11-30', committed_budget: 950000, actual_spend: 810000, status: 'in_progress', notes: null },
  { id: 'mcd-004', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR, project_description: 'Youth entrepreneurship incubator — 12-month programme, 25 beneficiaries', slp_reference: 'SLP-NC-2024-004', municipality: 'Ubuntu Local Municipality', province: 'Northern Cape', community_type: 'mine_community', start_date: '2024-04-01', end_date: '2025-03-31', committed_budget: 680000, actual_spend: 340000, status: 'in_progress', notes: null },
]

export const DEMO_HLC: HLCHousing = {
  id: 'hlc-001', mining_right_id: 'mr-001', calendar_year: DEMO_YEAR,
  housing_plan_in_place: true, housing_plan_date: '2023-11-15',
  single_units_company_owned: 48, single_units_subsidised: 112,
  family_units_company_owned: 24, family_units_subsidised: 68,
  housing_allowance_recipients: 185,
  labour_consultation_date: '2024-02-28',
  labour_consultation_notes: 'Annual housing committee meeting held 28 February 2024. Union representatives (NUM, UASA) in attendance. Subsidy increase of CPI+1% agreed.',
}

export const DEMO_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'al-001', table_name: 'procurement_goods', record_id: 'proc-001', user_id: 'u-001', user_email: 'p.naidoo@npc-cimpor.co.za', action: 'INSERT', old_values: null, new_values: { goods_description: 'Crusher liners & wear parts', total_spend: 12400000 }, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'al-002', table_name: 'hrd_employees', record_id: 'hrd-008', user_id: 'u-002', user_email: 'n.dlamini@npc-cimpor.co.za', action: 'INSERT', old_values: null, new_values: { employee_name: 'Faheema Ismail', cost: 38000 }, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: 'al-003', table_name: 'ownership_existing', record_id: 'own-002', user_id: 'u-001', user_email: 'p.naidoo@npc-cimpor.co.za', action: 'UPDATE', old_values: { bee_percentage: 4.5 }, new_values: { bee_percentage: 5.0 }, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'al-004', table_name: 'mcd_projects', record_id: 'mcd-002', user_id: 'u-003', user_email: 's.mthembu@npc-cimpor.co.za', action: 'UPDATE', old_values: { status: 'in_progress', actual_spend: 1620000 }, new_values: { status: 'completed', actual_spend: 1800000 }, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'al-005', table_name: 'ee_workforce_matrix', record_id: 'ee-013', user_id: 'u-002', user_email: 'n.dlamini@npc-cimpor.co.za', action: 'UPDATE', old_values: { headcount: 138 }, new_values: { headcount: 145 }, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'al-006', table_name: 'hlc_housing', record_id: 'hlc-001', user_id: 'u-001', user_email: 'p.naidoo@npc-cimpor.co.za', action: 'UPDATE', old_values: { labour_consultation_date: null }, new_values: { labour_consultation_date: '2024-02-28' }, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
]
