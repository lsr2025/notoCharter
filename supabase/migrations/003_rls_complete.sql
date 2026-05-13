-- 003_rls_complete.sql
-- Drops stub policies from 001, adds user_has_mining_right() helper,
-- enables RLS on suppliers, and writes correct scoped policies for all tables.

-- HELPER FUNCTION
CREATE OR REPLACE FUNCTION user_has_mining_right(mr_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND (
      mr_id = ANY(mining_right_ids)
      OR role IN ('executive', 'compliance_officer')
    )
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- DROP ALL STUB POLICIES FROM 001 (names may vary — use IF EXISTS)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- SUPPLIERS: enable RLS (not enabled in 001)
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- OWNERSHIP tables (compliance_officer write only)
CREATE POLICY "own_ex_sel" ON ownership_existing FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "own_ex_ins" ON ownership_existing FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');
CREATE POLICY "own_ex_upd" ON ownership_existing FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');
CREATE POLICY "own_ex_del" ON ownership_existing FOR DELETE USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');

CREATE POLICY "own_esop_sel" ON ownership_esop FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "own_esop_ins" ON ownership_esop FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');
CREATE POLICY "own_esop_upd" ON ownership_esop FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');

CREATE POLICY "own_hc_sel" ON ownership_host_community FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "own_hc_ins" ON ownership_host_community FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');
CREATE POLICY "own_hc_upd" ON ownership_host_community FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');

CREATE POLICY "own_ben_sel" ON ownership_beneficiation FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "own_ben_ins" ON ownership_beneficiation FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');
CREATE POLICY "own_ben_upd" ON ownership_beneficiation FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');

-- PROCUREMENT tables (compliance_officer + procurement_lead write)
CREATE POLICY "proc_g_sel" ON procurement_goods FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "proc_g_ins" ON procurement_goods FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));
CREATE POLICY "proc_g_upd" ON procurement_goods FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));

CREATE POLICY "proc_s_sel" ON procurement_services FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "proc_s_ins" ON procurement_services FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));
CREATE POLICY "proc_s_upd" ON procurement_services FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));

CREATE POLICY "proc_e_sel" ON procurement_esd FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "proc_e_ins" ON procurement_esd FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));
CREATE POLICY "proc_e_upd" ON procurement_esd FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));

CREATE POLICY "proc_o_sel" ON procurement_oem FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "proc_o_ins" ON procurement_oem FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));
CREATE POLICY "proc_o_upd" ON procurement_oem FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));

CREATE POLICY "proc_r_sel" ON procurement_rnd FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "proc_r_ins" ON procurement_rnd FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));
CREATE POLICY "proc_r_upd" ON procurement_rnd FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));

CREATE POLICY "supp_sel" ON suppliers FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "supp_ins" ON suppliers FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));
CREATE POLICY "supp_upd" ON suppliers FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','procurement_lead'));

-- HRD tables (compliance_officer + hr_manager write)
CREATE POLICY "hrd_e_sel" ON hrd_employees FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "hrd_e_ins" ON hrd_employees FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','hr_manager'));
CREATE POLICY "hrd_e_upd" ON hrd_employees FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','hr_manager'));

CREATE POLICY "hrd_n_sel" ON hrd_non_employees FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "hrd_n_ins" ON hrd_non_employees FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','hr_manager'));
CREATE POLICY "hrd_n_upd" ON hrd_non_employees FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','hr_manager'));

-- EE tables
CREATE POLICY "ee_wm_sel" ON ee_workforce_matrix FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "ee_wm_ins" ON ee_workforce_matrix FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','hr_manager'));
CREATE POLICY "ee_wm_upd" ON ee_workforce_matrix FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','hr_manager'));

CREATE POLICY "ee_id_sel" ON ee_income_differentials FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "ee_id_ins" ON ee_income_differentials FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','hr_manager'));
CREATE POLICY "ee_id_upd" ON ee_income_differentials FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','hr_manager'));

CREATE POLICY "ee_tt_sel" ON ee_transitional_targets FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "ee_tt_ins" ON ee_transitional_targets FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','hr_manager'));
CREATE POLICY "ee_tt_upd" ON ee_transitional_targets FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','hr_manager'));

-- MCD/HLC/SED (compliance_officer + slp_coordinator write)
CREATE POLICY "mcd_sel" ON mcd_projects FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "mcd_ins" ON mcd_projects FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','slp_coordinator'));
CREATE POLICY "mcd_upd" ON mcd_projects FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','slp_coordinator'));

CREATE POLICY "hlc_sel" ON hlc_housing FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "hlc_ins" ON hlc_housing FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','slp_coordinator'));
CREATE POLICY "hlc_upd" ON hlc_housing FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','slp_coordinator'));

CREATE POLICY "sed_sel" ON sed_projects FOR SELECT USING (user_has_mining_right(mining_right_id));
CREATE POLICY "sed_ins" ON sed_projects FOR INSERT WITH CHECK (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','slp_coordinator'));
CREATE POLICY "sed_upd" ON sed_projects FOR UPDATE USING (user_has_mining_right(mining_right_id) AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','slp_coordinator'));

-- SCORECARD (no direct write — trigger only)
CREATE POLICY "sc_sel" ON mciii_scorecard FOR SELECT USING (user_has_mining_right(mining_right_id));

-- MINING RIGHTS
CREATE POLICY "mr_sel" ON mining_rights FOR SELECT USING (user_has_mining_right(id));
CREATE POLICY "mr_ins" ON mining_rights FOR INSERT WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');
CREATE POLICY "mr_upd" ON mining_rights FOR UPDATE USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');

-- USER PROFILES (own row + compliance_officer can see all)
CREATE POLICY "up_sel" ON user_profiles FOR SELECT USING (id = auth.uid() OR (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'compliance_officer');

-- AUDIT LOG (SELECT only for JWT roles; INSERT via SECURITY DEFINER trigger)
CREATE POLICY "audit_sel" ON audit_log FOR SELECT USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('compliance_officer','auditor','executive'));
