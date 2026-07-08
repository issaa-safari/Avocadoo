-- QC-002: real photo storage. Epic 1 created the stage_photos metadata
-- table but no actual file storage. Private bucket; every object path is
-- {org_id}/{reference_type}/{reference_id}/{filename}, and the storage
-- policies key on that first path segment matching current_org_id() —
-- same isolation rule as every table, applied to files.
--
-- Select + insert only: evidence photos are never edited or deleted,
-- matching the stage_photos table's append-only policy.

insert into storage.buckets (id, name, public)
values ('stage-photos', 'stage-photos', false)
on conflict (id) do nothing;

create policy "stage_photos_storage_org_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'stage-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy "stage_photos_storage_org_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'stage-photos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
