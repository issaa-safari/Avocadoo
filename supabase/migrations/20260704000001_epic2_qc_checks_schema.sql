-- QC-001: the packed-box defect check, tied to run_id (not intake_id).
-- This matches the wireframe's "active-run aware" design and the ticket's
-- literal AC ("each log increments a tally against the active run_id") —
-- it's a different concept from the System Plan's Module B pre-processing
-- brix/size evaluation, which isn't in the actual ticket backlog at all.
--
-- No insert policy: writes go exclusively through log_qc_check() below
-- (same pattern as security_audit_log/log_security_event), because QC-002's
-- AC requires "reject with zero photos is blocked client- AND server-side".
-- A plain insert policy would let any client bypass the photo rule by
-- writing to the table directly via PostgREST. No update/delete either:
-- each check is an immutable log entry, same append-only posture as
-- packed_units.

create table qc_checks (
  qc_check_id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (org_id) on delete cascade,
  run_id uuid not null,
  defects text[] not null default '{}',
  disposition text not null check (disposition in ('approve', 'hold', 'reject')),
  notes text,
  inspector_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (org_id, run_id) references processing_runs (org_id, run_id)
);
alter table qc_checks enable row level security;
create index qc_checks_org_id_idx on qc_checks (org_id);
create index qc_checks_run_id_idx on qc_checks (run_id);

create policy "qc_checks_org_select" on qc_checks for select using (org_id = public.current_org_id());

-- Atomic write path: inserts the check and its evidence photos in one
-- transaction, enforcing the mandatory-photo rule for hold/reject.
-- org_id and inspector_id are resolved server-side, never from the caller.
create or replace function public.log_qc_check(
  p_run_id uuid,
  p_disposition text,
  p_defects text[] default '{}',
  p_notes text default null,
  p_photo_urls text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_run_org_id uuid;
  v_run_status text;
  v_qc_check_id uuid;
  v_url text;
begin
  v_org_id := public.current_org_id();
  if v_org_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_disposition not in ('approve', 'hold', 'reject') then
    raise exception 'Invalid disposition';
  end if;

  select org_id, status into v_run_org_id, v_run_status
    from processing_runs where run_id = p_run_id;

  if v_run_org_id is null or v_run_org_id <> v_org_id then
    raise exception 'Run not found';
  end if;
  if v_run_status <> 'active' then
    raise exception 'Cannot log QC checks on a closed run';
  end if;

  if p_disposition <> 'approve'
     and (p_photo_urls is null or coalesce(array_length(p_photo_urls, 1), 0) = 0) then
    raise exception 'A photo is required for hold/reject dispositions';
  end if;

  insert into qc_checks (org_id, run_id, defects, disposition, notes, inspector_id)
  values (v_org_id, p_run_id, coalesce(p_defects, '{}'), p_disposition, nullif(trim(p_notes), ''), auth.uid())
  returning qc_check_id into v_qc_check_id;

  foreach v_url in array coalesce(p_photo_urls, '{}'::text[]) loop
    insert into stage_photos (org_id, reference_type, reference_id, photo_url, taken_by)
    values (v_org_id, 'qc_check', v_qc_check_id, v_url, auth.uid());
  end loop;

  return v_qc_check_id;
end;
$$;

revoke execute on function public.log_qc_check(uuid, text, text[], text, text[]) from public, anon;
grant execute on function public.log_qc_check(uuid, text, text[], text, text[]) to authenticated;
