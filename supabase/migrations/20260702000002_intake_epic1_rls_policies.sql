-- Full CRUD, org-scoped, for regions/suppliers/farms/farmers/intake_batches:
-- these are working data that org members create and edit directly, unlike
-- organizations/org_users which are provisioned server-side. Fine-grained
-- role restriction (e.g. only admin/supervisor can delete a supplier) is
-- deferred to RBAC-001 (Phase 6) per the backlog; for now every authenticated
-- member of the org can manage their own org's master data.
--
-- stage_photos gets select+insert only — evidence photos are never edited
-- or deleted once captured.

create policy "regions_org_select" on regions for select using (org_id = public.current_org_id());
create policy "regions_org_insert" on regions for insert with check (org_id = public.current_org_id());
create policy "regions_org_update" on regions for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "regions_org_delete" on regions for delete using (org_id = public.current_org_id());

create policy "suppliers_org_select" on suppliers for select using (org_id = public.current_org_id());
create policy "suppliers_org_insert" on suppliers for insert with check (org_id = public.current_org_id());
create policy "suppliers_org_update" on suppliers for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "suppliers_org_delete" on suppliers for delete using (org_id = public.current_org_id());

create policy "farms_org_select" on farms for select using (org_id = public.current_org_id());
create policy "farms_org_insert" on farms for insert with check (org_id = public.current_org_id());
create policy "farms_org_update" on farms for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "farms_org_delete" on farms for delete using (org_id = public.current_org_id());

create policy "farmers_org_select" on farmers for select using (org_id = public.current_org_id());
create policy "farmers_org_insert" on farmers for insert with check (org_id = public.current_org_id());
create policy "farmers_org_update" on farmers for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "farmers_org_delete" on farmers for delete using (org_id = public.current_org_id());

create policy "intake_batches_org_select" on intake_batches for select using (org_id = public.current_org_id());
create policy "intake_batches_org_insert" on intake_batches for insert with check (org_id = public.current_org_id());
create policy "intake_batches_org_update" on intake_batches for update using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "intake_batches_org_delete" on intake_batches for delete using (org_id = public.current_org_id());

create policy "stage_photos_org_select" on stage_photos for select using (org_id = public.current_org_id());
create policy "stage_photos_org_insert" on stage_photos for insert with check (org_id = public.current_org_id());
