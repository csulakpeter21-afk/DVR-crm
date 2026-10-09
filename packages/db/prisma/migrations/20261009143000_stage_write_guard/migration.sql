-- DEV_PLAN.domain_frame.transition_rules: "Transitions only through the state
-- machine API in packages/domain; direct writes to stage are forbidden and
-- blocked by a database constraint or service guard."
--
-- A lint rule catches direct assignment in TypeScript, but lint is not a
-- guarantee: raw SQL, a migration, psql or a future service would all slip past
-- it. This trigger makes the rule hold in the database.
--
-- The state machine sets `devora.transition_ok` inside its transaction before
-- updating the stage, so a legitimate transition passes and anything else
-- raises. The setting is transaction-scoped (set_config with is_local = true),
-- so it cannot leak into another statement or another connection.

CREATE OR REPLACE FUNCTION devora_guard_lead_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    IF current_setting('devora.transition_ok', true) IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION
        'Direct write to leads.stage is forbidden (% -> %). Use the pipeline state machine in @devora/domain.',
        OLD.stage, NEW.stage
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_stage_write_guard
  BEFORE UPDATE OF stage ON leads
  FOR EACH ROW
  EXECUTE FUNCTION devora_guard_lead_stage();
