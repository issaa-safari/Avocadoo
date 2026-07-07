-- processing_runs: select/insert (open) + update (close) — no delete, runs
-- are operational history. packed_units: select/insert only, append-only
-- per tap. commodity_loss_tolerances: full CRUD, admin-managed config.
-- reconciliation_records and supplier_returns: select/insert only — both
-- are immutable evidentiary records per the plan's immutability rule
-- (corrections create new linked records, never overwrite).

create policy "processing_runs_org_select" on processing_runs for select using (org_id = public.current_org_id());
create policy "processing_runs_org_insert" on processing_runs for insert with check (org_id = public.current_org_id());
create policy "processing_runs_org_update" on processing_runs for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

create policy "packed_units_org_select" on packed_units for select using (org_id = public.current_org_id());
create policy "packed_units_org_insert" on packed_units for insert with check (org_id = public.current_org_id());

create policy "commodity_loss_tolerances_org_select" on commodity_loss_tolerances for select using (org_id = public.current_org_id());
create policy "commodity_loss_tolerances_org_insert" on commodity_loss_tolerances for insert with check (org_id = public.current_org_id());
create policy "commodity_loss_tolerances_org_update" on commodity_loss_tolerances for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "commodity_loss_tolerances_org_delete" on commodity_loss_tolerances for delete using (org_id = public.current_org_id());

create policy "reconciliation_records_org_select" on reconciliation_records for select using (org_id = public.current_org_id());
create policy "reconciliation_records_org_insert" on reconciliation_records for insert with check (org_id = public.current_org_id());

create policy "supplier_returns_org_select" on supplier_returns for select using (org_id = public.current_org_id());
create policy "supplier_returns_org_insert" on supplier_returns for insert with check (org_id = public.current_org_id());
