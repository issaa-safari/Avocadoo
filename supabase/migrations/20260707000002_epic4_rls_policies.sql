-- cold_rooms: full CRUD, admin-managed config (same treatment as
-- commodity_loss_tolerances). pallets: select/insert/update (closing a
-- pallet and assigning it to a cold room update its own row) — no delete,
-- pallets are operational history. pallet_run_contents, pallet_split_log,
-- cold_storage_logs: select/insert only — pallet contents are on the plan's
-- explicit immutability list, splits are lineage evidence, and temperature
-- logs are an evidentiary series for the trace report.

create policy "cold_rooms_org_select" on cold_rooms for select using (org_id = public.current_org_id());
create policy "cold_rooms_org_insert" on cold_rooms for insert with check (org_id = public.current_org_id());
create policy "cold_rooms_org_update" on cold_rooms for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "cold_rooms_org_delete" on cold_rooms for delete using (org_id = public.current_org_id());

create policy "pallets_org_select" on pallets for select using (org_id = public.current_org_id());
create policy "pallets_org_insert" on pallets for insert with check (org_id = public.current_org_id());
create policy "pallets_org_update" on pallets for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

create policy "pallet_split_log_org_select" on pallet_split_log for select using (org_id = public.current_org_id());
create policy "pallet_split_log_org_insert" on pallet_split_log for insert with check (org_id = public.current_org_id());

create policy "pallet_run_contents_org_select" on pallet_run_contents for select using (org_id = public.current_org_id());
create policy "pallet_run_contents_org_insert" on pallet_run_contents for insert with check (org_id = public.current_org_id());

create policy "cold_storage_logs_org_select" on cold_storage_logs for select using (org_id = public.current_org_id());
create policy "cold_storage_logs_org_insert" on cold_storage_logs for insert with check (org_id = public.current_org_id());
