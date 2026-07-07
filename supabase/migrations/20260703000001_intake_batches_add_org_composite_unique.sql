-- Needed so later tables (processing_runs) can use a composite FK
-- (org_id, intake_id) -> intake_batches, same pattern as Epic 1.
alter table intake_batches add constraint intake_batches_org_id_intake_id_key unique (org_id, intake_id);
