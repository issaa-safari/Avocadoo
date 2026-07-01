-- PLATFORM-005: Tenant-scoped security audit log
--
-- Distinct from the system-wide `audit_log` (System Plan §3, Cross-Module) —
-- this one is specifically for org-admin self-service visibility into
-- security-relevant events in their own org.

create table security_audit_log (
  log_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index security_audit_log_org_id_idx on security_audit_log (org_id);

alter table security_audit_log enable row level security;

-- Only org admins can read their own org's audit trail.
create policy "security_audit_log_admin_select" on security_audit_log
  for select
  using (
    org_id = public.current_org_id()
    and public.current_user_role() = 'admin'
  );

-- No insert/update/delete policy for authenticated/anon roles: rows are
-- written exclusively through log_security_event() below, so org_id and
-- user_id are always resolved server-side and can never be forged by a
-- client-supplied value. Rows are never edited or deleted (immutable trail).
create or replace function public.log_security_event(
  p_action text,
  p_resource_type text,
  p_resource_id uuid default null,
  p_ip_address inet default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into security_audit_log (org_id, user_id, action, resource_type, resource_id, ip_address)
  values (public.current_org_id(), auth.uid(), p_action, p_resource_type, p_resource_id, p_ip_address);
end;
$$;

revoke execute on function public.log_security_event from public;
grant execute on function public.log_security_event to authenticated;
