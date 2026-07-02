-- Lets a freshly signed-up user provision their own organization and become
-- its admin, in one atomic call. This is the "first user of a new exporter"
-- flow — subsequent users within that org are invited by its admin, not via
-- public signup (that distinction belongs to Phase 6 RBAC/invites; there is
-- no invite flow yet, so for now every self-signup gets its own new org).
--
-- company_name comes from auth.users.raw_user_meta_data, set at signup time
-- via supabase.auth.signUp({ options: { data: { company_name } } }) — this
-- means it survives the email-confirmation redirect regardless of whether
-- the session exists at signup time or only after the user clicks the
-- confirmation link. subdomain is derived server-side from company_name,
-- never accepted from the client, since it's a globally unique identifier
-- and letting a client pick it risks squatting/collisions.

create or replace function public.create_org_and_admin(p_company_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_company_name text;
  v_email text;
  v_base_subdomain text;
  v_subdomain text;
  v_suffix int := 0;
begin
  select email, coalesce(p_company_name, raw_user_meta_data ->> 'company_name')
    into v_email, v_company_name
    from auth.users
    where id = auth.uid();

  if v_company_name is null or length(trim(v_company_name)) = 0 then
    raise exception 'company_name is required';
  end if;

  if exists (select 1 from org_users where user_id = auth.uid()) then
    raise exception 'User already belongs to an organization';
  end if;

  v_base_subdomain := trim(both '-' from regexp_replace(lower(trim(v_company_name)), '[^a-z0-9]+', '-', 'g'));
  v_subdomain := v_base_subdomain;

  while exists (select 1 from organizations where subdomain = v_subdomain) loop
    v_suffix := v_suffix + 1;
    v_subdomain := v_base_subdomain || '-' || v_suffix;
  end loop;

  insert into organizations (company_name, subdomain)
  values (v_company_name, v_subdomain)
  returning org_id into v_org_id;

  insert into org_settings (org_id) values (v_org_id);

  insert into org_users (user_id, org_id, role, email)
  values (auth.uid(), v_org_id, 'admin', v_email);

  return v_org_id;
end;
$$;

revoke execute on function public.create_org_and_admin(text) from public, anon;
grant execute on function public.create_org_and_admin(text) to authenticated;
