-- PLATFORM-002: Tenant isolation via Supabase RLS
--
-- current_org_id()/current_user_role() are SECURITY DEFINER so they can read
-- org_users regardless of the caller's RLS visibility. This is deliberate and
-- safe: they run as the function owner (the migration/table owner), and table
-- owners bypass RLS by default in Postgres unless FORCE ROW LEVEL SECURITY is
-- set (which we intentionally do NOT set on org_users below). Do not add
-- FORCE ROW LEVEL SECURITY here or these helpers will recurse into the RLS
-- policy they're used to build.

create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from org_users where user_id = auth.uid()
$$;

revoke execute on function public.current_org_id() from public;
grant execute on function public.current_org_id() to authenticated;

create or replace function public.current_user_role()
returns org_role
language sql
security definer
stable
set search_path = public
as $$
  select role from org_users where user_id = auth.uid()
$$;

revoke execute on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

-- organizations: readable/updatable only within the caller's own org.
-- No insert/delete policy for authenticated users — org onboarding/suspension
-- is a platform super-admin action performed with the service_role key
-- (which bypasses RLS by design), not a client-side operation.
create policy "organizations_isolation_select" on organizations
  for select
  using (org_id = public.current_org_id());

create policy "organizations_isolation_update" on organizations
  for update
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- org_users: readable/updatable only within the caller's own org.
-- No insert/delete policy yet — user provisioning permissions are formalized
-- under RBAC-001 (Phase 6); until then, provisioning happens server-side.
create policy "org_users_isolation_select" on org_users
  for select
  using (org_id = public.current_org_id());

create policy "org_users_isolation_update" on org_users
  for update
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- org_settings: readable/updatable only within the caller's own org.
create policy "org_settings_isolation_select" on org_settings
  for select
  using (org_id = public.current_org_id());

create policy "org_settings_isolation_update" on org_settings
  for update
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
