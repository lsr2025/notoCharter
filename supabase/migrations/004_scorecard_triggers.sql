-- 004_scorecard_triggers.sql
-- Recalculates the mciii_scorecard row on any module table change.
-- Does NOT write to GENERATED ALWAYS AS columns (overall_score, overall_tier).
--
-- Schema adaptations from 001_initial_schema.sql:
--   ownership_existing: uses effective_economic_interest (HDP economic stake %) — no hdp_percentage column
--   ee_workforce_matrix: uses headcount + race to derive HDP count (african/coloured/indian) — no hdp_count column
--   hrd_employees: uses SUM(cost) as training_spend; leviable_payroll not stored, so score =
--                  LEAST(100, training_spend_per_headcount / 5000 * 100) approximation
--   procurement_goods: hdp_spend approximated as total_spend WHERE hdp_supplier = TRUE

CREATE OR REPLACE FUNCTION recalculate_scorecard_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_mr_id UUID := NEW.mining_right_id;
  v_year  SMALLINT := NEW.calendar_year;

  v_ownership_compliant BOOLEAN;
  v_mcd_compliant       BOOLEAN;
  v_hlc_compliant       BOOLEAN;
  v_ee_score            NUMERIC(5,2);
  v_proc_score          NUMERIC(5,2);
  v_hrd_score           NUMERIC(5,2);
BEGIN
  -- Ring-fenced: Ownership — sum of effective_economic_interest for HDP shareholders >= 26%
  -- ownership_existing uses effective_economic_interest; hdp_percentage column does not exist.
  SELECT COALESCE(SUM(effective_economic_interest), 0) >= 26
  INTO v_ownership_compliant
  FROM ownership_existing
  WHERE mining_right_id = v_mr_id AND calendar_year = v_year;

  -- Ring-fenced: MCD has at least one active (non-cancelled) project
  SELECT EXISTS(
    SELECT 1 FROM mcd_projects
    WHERE mining_right_id = v_mr_id AND calendar_year = v_year
      AND status != 'cancelled'
  ) INTO v_mcd_compliant;

  -- Ring-fenced: HLC has at least one entry for this mining right / year
  SELECT EXISTS(
    SELECT 1 FROM hlc_housing
    WHERE mining_right_id = v_mr_id AND calendar_year = v_year
  ) INTO v_hlc_compliant;

  -- EE score: HDP workforce % (30% weight)
  -- ee_workforce_matrix stores individual headcount rows by race/gender.
  -- HDP races per MPRDA: african, coloured, indian (not white, not foreign).
  SELECT LEAST(100,
    CASE WHEN COALESCE(SUM(headcount), 0) = 0 THEN 0
    ELSE (
      SUM(CASE WHEN race IN ('african','coloured','indian') THEN headcount ELSE 0 END)::NUMERIC
      / SUM(headcount)::NUMERIC
    ) * 100
    END
  ) INTO v_ee_score
  FROM ee_workforce_matrix
  WHERE mining_right_id = v_mr_id AND calendar_year = v_year;

  -- Procurement score: HDP supplier spend % (40% weight)
  -- procurement_goods stores hdp_supplier BOOLEAN; no separate hdp_spend column.
  -- HDP spend is approximated as total_spend where hdp_supplier = TRUE.
  SELECT LEAST(100,
    CASE WHEN COALESCE(SUM(total_spend), 0) = 0 THEN 0
    ELSE (
      SUM(CASE WHEN hdp_supplier THEN total_spend ELSE 0 END)::NUMERIC
      / SUM(total_spend)::NUMERIC
    ) * 100
    END
  ) INTO v_proc_score
  FROM procurement_goods
  WHERE mining_right_id = v_mr_id AND calendar_year = v_year;

  -- HRD score: training spend as % of 5% of leviable payroll (30% weight)
  -- hrd_employees stores cost per training record; leviable_payroll not in schema.
  -- Score = LEAST(100, total_training_cost / (estimated_payroll * 0.05) * 100).
  -- Estimated payroll is derived as: total training cost / 0.01 (assume 1% spend ratio as floor).
  -- Fallback: score is LEAST(100, 100 * SUM(cost) / NULLIF(SUM(cost) * 5, 0))
  -- which is not useful. Better: use HDP trainee count vs EE headcount as proxy.
  -- Score = LEAST(100, (trained_hdp_count / total_headcount) * 100 / 0.05)
  -- where 0.05 represents the 5% MCIII target.
  -- Using cost-based approach: assume target = R5,000 per employee per year.
  -- v_hrd_score = LEAST(100, SUM(cost) / (headcount * 5000) * 100).
  SELECT LEAST(100,
    CASE
      WHEN COALESCE(SUM(cost), 0) = 0 THEN 0
      ELSE (
        SUM(cost)::NUMERIC
        / NULLIF(
            (SELECT SUM(headcount) FROM ee_workforce_matrix
             WHERE mining_right_id = v_mr_id AND calendar_year = v_year)
            * 5000.0,
            0
          )
      ) * 100
    END
  ) INTO v_hrd_score
  FROM hrd_employees
  WHERE mining_right_id = v_mr_id AND calendar_year = v_year;

  -- Upsert scorecard row — ONLY write source columns, NOT generated columns.
  -- GENERATED ALWAYS AS columns: overall_score, overall_tier (do not include in INSERT/UPDATE).
  INSERT INTO mciii_scorecard (
    mining_right_id,
    calendar_year,
    ownership_compliant,
    mcd_compliant,
    hlc_compliant,
    ee_score,
    procurement_score,
    hrd_score
  ) VALUES (
    v_mr_id,
    v_year,
    COALESCE(v_ownership_compliant, false),
    COALESCE(v_mcd_compliant, false),
    COALESCE(v_hlc_compliant, false),
    COALESCE(v_ee_score, 0),
    COALESCE(v_proc_score, 0),
    COALESCE(v_hrd_score, 0)
  )
  ON CONFLICT (mining_right_id, calendar_year) DO UPDATE SET
    ownership_compliant = EXCLUDED.ownership_compliant,
    mcd_compliant       = EXCLUDED.mcd_compliant,
    hlc_compliant       = EXCLUDED.hlc_compliant,
    ee_score            = EXCLUDED.ee_score,
    procurement_score   = EXCLUDED.procurement_score,
    hrd_score           = EXCLUDED.hrd_score,
    last_updated        = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to all module tables that feed into scorecard calculations
CREATE TRIGGER scorecard_ownership   AFTER INSERT OR UPDATE ON ownership_existing   FOR EACH ROW EXECUTE FUNCTION recalculate_scorecard_trigger();
CREATE TRIGGER scorecard_esop        AFTER INSERT OR UPDATE ON ownership_esop        FOR EACH ROW EXECUTE FUNCTION recalculate_scorecard_trigger();
CREATE TRIGGER scorecard_proc_goods  AFTER INSERT OR UPDATE ON procurement_goods     FOR EACH ROW EXECUTE FUNCTION recalculate_scorecard_trigger();
CREATE TRIGGER scorecard_proc_svc    AFTER INSERT OR UPDATE ON procurement_services  FOR EACH ROW EXECUTE FUNCTION recalculate_scorecard_trigger();
CREATE TRIGGER scorecard_hrd         AFTER INSERT OR UPDATE ON hrd_employees         FOR EACH ROW EXECUTE FUNCTION recalculate_scorecard_trigger();
CREATE TRIGGER scorecard_ee          AFTER INSERT OR UPDATE ON ee_workforce_matrix   FOR EACH ROW EXECUTE FUNCTION recalculate_scorecard_trigger();
CREATE TRIGGER scorecard_mcd         AFTER INSERT OR UPDATE ON mcd_projects          FOR EACH ROW EXECUTE FUNCTION recalculate_scorecard_trigger();
CREATE TRIGGER scorecard_hlc         AFTER INSERT OR UPDATE ON hlc_housing           FOR EACH ROW EXECUTE FUNCTION recalculate_scorecard_trigger();
CREATE TRIGGER scorecard_sed         AFTER INSERT OR UPDATE ON sed_projects          FOR EACH ROW EXECUTE FUNCTION recalculate_scorecard_trigger();
