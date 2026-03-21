-- ============================================================
-- NotoCharter™ — Mining Charter III Compliance Platform
-- Database Schema v1.0
-- Kwahlelwa Group (Pty) Ltd — March 2026
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'compliance_officer', 'hr_manager', 'procurement_lead',
  'slp_coordinator', 'executive', 'auditor'
);

CREATE TYPE compliance_tier AS ENUM ('compliant', 'non_compliant', 'ring_fenced');

CREATE TYPE race_type AS ENUM ('african', 'coloured', 'indian', 'white', 'foreign');

CREATE TYPE gender_type AS ENUM ('male', 'female');

CREATE TYPE occupational_level AS ENUM (
  'top_management', 'senior_management', 'professionally_qualified',
  'skilled_technical', 'semi_skilled', 'unskilled'
);

CREATE TYPE training_programme AS ENUM (
  'abet', 'bursary', 'learnership', 'skills_programme',
  'internship', 'apprenticeship', 'other'
);

CREATE TYPE community_type AS ENUM (
  'mine_community', 'adjacent_community', 'labour_sending_area'
);

CREATE TYPE project_status AS ENUM ('not_started', 'in_progress', 'completed', 'delayed');

-- ────────────────────────────────────────────────────────────
-- CORE REFERENCE TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE mining_rights (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mr_number       TEXT NOT NULL UNIQUE,  -- e.g. GP30/5/1/2/xxx
  right_type      TEXT NOT NULL DEFAULT 'existing' CHECK (right_type IN ('existing','new','pending')),
  holder_entity   TEXT NOT NULL,
  province        TEXT NOT NULL,
  commodity       TEXT NOT NULL DEFAULT 'Cement / Limestone',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE suppliers (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  registration_number TEXT NOT NULL UNIQUE,
  trading_name        TEXT NOT NULL,
  bee_level           INTEGER CHECK (bee_level BETWEEN 1 AND 8),
  bee_cert_expiry     DATE,
  is_hdp_owned        BOOLEAN NOT NULL DEFAULT FALSE,
  is_women_owned      BOOLEAN NOT NULL DEFAULT FALSE,
  is_youth_owned      BOOLEAN NOT NULL DEFAULT FALSE,
  is_local            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- USER PROFILES (linked to auth.users)
-- ────────────────────────────────────────────────────────────

CREATE TABLE user_profiles (
  id                UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name         TEXT NOT NULL,
  role              user_role NOT NULL DEFAULT 'executive',
  mining_right_ids  UUID[] DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- AUDIT LOG
-- ────────────────────────────────────────────────────────────

CREATE TABLE audit_log (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  user_id     UUID,
  user_email  TEXT,
  action      TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_values  JSONB,
  new_values  JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_fn() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, user_id, user_email, action, old_values, new_values)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    auth.uid(),
    auth.email(),
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- MCIII SCORECARD VIEW (computed)
-- ────────────────────────────────────────────────────────────

CREATE TABLE mciii_scorecard (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id       UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year         INTEGER NOT NULL,
  ownership_compliant   BOOLEAN,
  mcd_compliant         BOOLEAN,
  hlc_compliant         BOOLEAN,
  ee_score              NUMERIC(5,2) DEFAULT 0,
  procurement_score     NUMERIC(5,2) DEFAULT 0,
  hrd_score             NUMERIC(5,2) DEFAULT 0,
  overall_score         NUMERIC(5,2) GENERATED ALWAYS AS (
    ROUND(ee_score * 0.30 + procurement_score * 0.40 + hrd_score * 0.30, 2)
  ) STORED,
  overall_tier          compliance_tier GENERATED ALWAYS AS (
    CASE
      WHEN ownership_compliant = FALSE OR mcd_compliant = FALSE OR hlc_compliant = FALSE
      THEN 'non_compliant'::compliance_tier
      WHEN ROUND(ee_score * 0.30 + procurement_score * 0.40 + hrd_score * 0.30, 2) >= 100
      THEN 'compliant'::compliance_tier
      ELSE 'non_compliant'::compliance_tier
    END
  ) STORED,
  submission_deadline   DATE,
  last_updated          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (mining_right_id, calendar_year)
);

-- ────────────────────────────────────────────────────────────
-- MODULE A–G: OWNERSHIP
-- ────────────────────────────────────────────────────────────

CREATE TABLE ownership_existing (
  id                          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id             UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year               INTEGER NOT NULL,
  shareholder_name            TEXT NOT NULL,
  shareholder_type            TEXT NOT NULL CHECK (shareholder_type IN ('hdp_individual','esop','host_community','bee_entrepreneur','other')),
  bee_percentage              NUMERIC(5,2) NOT NULL DEFAULT 0,
  effective_voting_rights     NUMERIC(5,2) NOT NULL DEFAULT 0,
  effective_economic_interest NUMERIC(5,2) NOT NULL DEFAULT 0,
  financing_method            TEXT NOT NULL DEFAULT 'own_funds' CHECK (financing_method IN ('own_funds','third_party_loan','vendor_financing','equity_equivalent')),
  loan_balance                NUMERIC(15,2),
  notes                       TEXT,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ownership_esop (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id     UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year       INTEGER NOT NULL,
  employee_name       TEXT NOT NULL,
  employee_id_number  TEXT NOT NULL,
  race                race_type NOT NULL,
  gender              gender_type NOT NULL,
  occupational_level  occupational_level NOT NULL,
  units_held          INTEGER NOT NULL DEFAULT 0,
  value_per_unit      NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_value         NUMERIC(15,2) GENERATED ALWAYS AS (units_held * value_per_unit) STORED,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ownership_host_community (
  id                              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id                 UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year                   INTEGER NOT NULL,
  trust_name                      TEXT NOT NULL,
  trust_registration              TEXT NOT NULL,
  host_community_name             TEXT NOT NULL,
  equity_percentage               NUMERIC(5,2) NOT NULL DEFAULT 0,
  development_programme_description TEXT NOT NULL,
  consultation_date               DATE NOT NULL,
  created_at                      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ownership_beneficiation (
  id                          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id             UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year               INTEGER NOT NULL,
  beneficiation_activity      TEXT NOT NULL,
  equity_equivalent_value     NUMERIC(15,2) NOT NULL DEFAULT 0,
  monetary_value              NUMERIC(15,2) NOT NULL DEFAULT 0,
  plan_reference              TEXT NOT NULL,
  created_at                  TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- MODULE H–M: PROCUREMENT
-- ────────────────────────────────────────────────────────────

CREATE TABLE procurement_goods (
  id                          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id             UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year               INTEGER NOT NULL,
  goods_description           TEXT NOT NULL,
  supplier_id                 UUID REFERENCES suppliers(id),
  is_mining_good              BOOLEAN NOT NULL DEFAULT TRUE,
  total_spend                 NUMERIC(15,2) NOT NULL DEFAULT 0,
  local_content_percentage    NUMERIC(5,2) NOT NULL DEFAULT 0,
  hdp_supplier                BOOLEAN NOT NULL DEFAULT FALSE,
  women_owned_supplier        BOOLEAN NOT NULL DEFAULT FALSE,
  youth_owned_supplier        BOOLEAN NOT NULL DEFAULT FALSE,
  quarter                     INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE procurement_services (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id     UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year       INTEGER NOT NULL,
  service_description TEXT NOT NULL,
  supplier_id         UUID REFERENCES suppliers(id),
  is_discretionary    BOOLEAN NOT NULL DEFAULT TRUE,
  total_spend         NUMERIC(15,2) NOT NULL DEFAULT 0,
  hdp_owned           BOOLEAN NOT NULL DEFAULT FALSE,
  women_owned         BOOLEAN NOT NULL DEFAULT FALSE,
  youth_owned         BOOLEAN NOT NULL DEFAULT FALSE,
  quarter             INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE procurement_esd (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id         UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year           INTEGER NOT NULL,
  beneficiary_company     TEXT NOT NULL,
  development_activities  TEXT NOT NULL,
  contract_start_date     DATE NOT NULL,
  monetary_value          NUMERIC(15,2) NOT NULL DEFAULT 0,
  bee_level               INTEGER CHECK (bee_level BETWEEN 1 AND 8),
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE procurement_oem (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year   INTEGER NOT NULL,
  oem_name        TEXT NOT NULL,
  contract_value  NUMERIC(15,2) NOT NULL DEFAULT 0,
  local_spend     NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE procurement_rnd (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year   INTEGER NOT NULL,
  project_name    TEXT NOT NULL,
  budget          NUMERIC(15,2) NOT NULL DEFAULT 0,
  actual_spend    NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- MODULE Q–R: HUMAN RESOURCE DEVELOPMENT
-- ────────────────────────────────────────────────────────────

CREATE TABLE hrd_employees (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id     UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year       INTEGER NOT NULL,
  employee_name       TEXT NOT NULL,
  id_number           TEXT NOT NULL,
  race                race_type NOT NULL,
  gender              gender_type NOT NULL,
  occupational_level  occupational_level NOT NULL,
  is_hdp              BOOLEAN NOT NULL DEFAULT TRUE,
  programme_type      training_programme NOT NULL,
  provider            TEXT NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  cost                NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hrd_non_employees (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year   INTEGER NOT NULL,
  beneficiary_name TEXT NOT NULL,
  community_name   TEXT NOT NULL,
  race             race_type NOT NULL,
  gender           gender_type NOT NULL,
  programme_type   training_programme NOT NULL,
  provider         TEXT NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  cost             NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- MODULE T–V: EMPLOYMENT EQUITY
-- ────────────────────────────────────────────────────────────

CREATE TABLE ee_workforce_matrix (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id     UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year       INTEGER NOT NULL,
  occupational_level  occupational_level NOT NULL,
  race                race_type NOT NULL,
  gender              gender_type NOT NULL,
  headcount           INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (mining_right_id, calendar_year, occupational_level, race, gender)
);

CREATE TABLE ee_income_differentials (
  id                      UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id         UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year           INTEGER NOT NULL,
  occupational_level      occupational_level NOT NULL,
  avg_income_hdp_male     NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_income_hdp_female   NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_income_white_male   NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_income_white_female NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ee_transitional_targets (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id     UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  ee_plan_reference   TEXT NOT NULL,
  occupational_level  occupational_level NOT NULL,
  race                race_type NOT NULL,
  gender              gender_type NOT NULL,
  year_1_target       INTEGER NOT NULL DEFAULT 0,
  year_2_target       INTEGER NOT NULL DEFAULT 0,
  year_3_target       INTEGER NOT NULL DEFAULT 0,
  year_4_target       INTEGER NOT NULL DEFAULT 0,
  year_5_target       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- MODULE S: MINE COMMUNITY DEVELOPMENT
-- ────────────────────────────────────────────────────────────

CREATE TABLE mcd_projects (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id     UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year       INTEGER NOT NULL,
  project_description TEXT NOT NULL,
  slp_reference       TEXT NOT NULL,
  municipality        TEXT NOT NULL,
  province            TEXT NOT NULL,
  community_type      community_type NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  committed_budget    NUMERIC(15,2) NOT NULL DEFAULT 0,
  actual_spend        NUMERIC(15,2) NOT NULL DEFAULT 0,
  status              project_status NOT NULL DEFAULT 'not_started',
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- MODULE W: HOUSING & LIVING CONDITIONS
-- ────────────────────────────────────────────────────────────

CREATE TABLE hlc_housing (
  id                              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id                 UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year                   INTEGER NOT NULL,
  housing_plan_in_place           BOOLEAN NOT NULL DEFAULT FALSE,
  housing_plan_date               DATE,
  single_units_company_owned      INTEGER NOT NULL DEFAULT 0,
  single_units_subsidised         INTEGER NOT NULL DEFAULT 0,
  family_units_company_owned      INTEGER NOT NULL DEFAULT 0,
  family_units_subsidised         INTEGER NOT NULL DEFAULT 0,
  housing_allowance_recipients    INTEGER NOT NULL DEFAULT 0,
  labour_consultation_date        DATE,
  labour_consultation_notes       TEXT,
  created_at                      TIMESTAMPTZ DEFAULT now(),
  updated_at                      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (mining_right_id, calendar_year)
);

-- ────────────────────────────────────────────────────────────
-- MODULE X: SOCIO-ECONOMIC DEVELOPMENT
-- ────────────────────────────────────────────────────────────

CREATE TABLE sed_projects (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mining_right_id     UUID NOT NULL REFERENCES mining_rights(id) ON DELETE CASCADE,
  calendar_year       INTEGER NOT NULL,
  project_description TEXT NOT NULL,
  licence_type        TEXT NOT NULL CHECK (licence_type IN ('diamonds_act','precious_metals_act')),
  municipality        TEXT NOT NULL,
  province            TEXT NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  approved_budget     NUMERIC(15,2) NOT NULL DEFAULT 0,
  actual_spend        NUMERIC(15,2) NOT NULL DEFAULT 0,
  progress_vs_plan    TEXT,
  status              project_status NOT NULL DEFAULT 'not_started',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- AUDIT TRIGGERS (attach to all data tables)
-- ────────────────────────────────────────────────────────────

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'ownership_existing','ownership_esop','ownership_host_community','ownership_beneficiation',
    'procurement_goods','procurement_services','procurement_esd','procurement_oem','procurement_rnd',
    'hrd_employees','hrd_non_employees',
    'ee_workforce_matrix','ee_income_differentials','ee_transitional_targets',
    'mcd_projects','hlc_housing','sed_projects','mciii_scorecard'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('
      CREATE TRIGGER audit_%s
      AFTER INSERT OR UPDATE OR DELETE ON %s
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
    ', t, t);
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE mining_rights         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mciii_scorecard       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_existing    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_esop        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_host_community ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_beneficiation  ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_goods     ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_services  ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_esd       ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_oem       ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_rnd       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrd_employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrd_non_employees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ee_workforce_matrix   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ee_income_differentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ee_transitional_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcd_projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hlc_housing           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sed_projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log             ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Mining rights: all authenticated users can read
CREATE POLICY "mining_rights_read" ON mining_rights
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Compliance officer: full admin on all tables
-- We create a reusable approach using role-based policies per table

-- Example policies for ownership_existing (pattern applied to all)
CREATE POLICY "ownership_select" ON ownership_existing
  FOR SELECT USING (
    current_user_role() IN ('compliance_officer','auditor','executive')
  );

CREATE POLICY "ownership_insert" ON ownership_existing
  FOR INSERT WITH CHECK (current_user_role() = 'compliance_officer');

CREATE POLICY "ownership_update" ON ownership_existing
  FOR UPDATE USING (current_user_role() = 'compliance_officer');

CREATE POLICY "ownership_delete" ON ownership_existing
  FOR DELETE USING (current_user_role() = 'compliance_officer');

-- Procurement policies
CREATE POLICY "procurement_select" ON procurement_goods
  FOR SELECT USING (current_user_role() IN ('compliance_officer','procurement_lead','auditor','executive'));

CREATE POLICY "procurement_write" ON procurement_goods
  FOR ALL USING (current_user_role() IN ('compliance_officer','procurement_lead'));

-- HRD policies
CREATE POLICY "hrd_select" ON hrd_employees
  FOR SELECT USING (current_user_role() IN ('compliance_officer','hr_manager','auditor','executive'));

CREATE POLICY "hrd_write" ON hrd_employees
  FOR ALL USING (current_user_role() IN ('compliance_officer','hr_manager'));

-- EE policies
CREATE POLICY "ee_select" ON ee_workforce_matrix
  FOR SELECT USING (current_user_role() IN ('compliance_officer','hr_manager','auditor','executive'));

CREATE POLICY "ee_write" ON ee_workforce_matrix
  FOR ALL USING (current_user_role() IN ('compliance_officer','hr_manager'));

-- MCD policies
CREATE POLICY "mcd_select" ON mcd_projects
  FOR SELECT USING (current_user_role() IN ('compliance_officer','slp_coordinator','auditor','executive'));

CREATE POLICY "mcd_write" ON mcd_projects
  FOR ALL USING (current_user_role() IN ('compliance_officer','slp_coordinator'));

-- Scorecard: all can read
CREATE POLICY "scorecard_read" ON mciii_scorecard
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "scorecard_write" ON mciii_scorecard
  FOR ALL USING (current_user_role() = 'compliance_officer');

-- Audit log: compliance officer and auditor can read, no one can write directly
CREATE POLICY "audit_read" ON audit_log
  FOR SELECT USING (current_user_role() IN ('compliance_officer','auditor'));

-- ────────────────────────────────────────────────────────────
-- SEED DATA — NPC-Cimpor Mining Rights
-- ────────────────────────────────────────────────────────────

INSERT INTO mining_rights (mr_number, right_type, holder_entity, province, commodity) VALUES
  ('NC 30/5/1/2/10000 MR', 'existing', 'NPC-Cimpor (Pty) Ltd', 'Northern Cape', 'Limestone / Cement'),
  ('LP 30/5/1/2/20000 MR', 'existing', 'NPC-Cimpor (Pty) Ltd', 'Limpopo', 'Limestone / Cement'),
  ('FS 30/5/1/2/30000 MR', 'existing', 'NPC-Cimpor (Pty) Ltd', 'Free State', 'Limestone / Cement');

-- Insert initial scorecard rows for the current reporting year
INSERT INTO mciii_scorecard (mining_right_id, calendar_year, submission_deadline)
SELECT id, EXTRACT(YEAR FROM now())::INTEGER - 1, (EXTRACT(YEAR FROM now())::TEXT || '-03-31')::DATE
FROM mining_rights WHERE is_active = TRUE;
