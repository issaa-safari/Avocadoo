-- Penalized-query isolation test for Epic 2 (qc_checks), plus the QC-002
-- server-side rule: hold/reject without a photo must be rejected by
-- log_qc_check(), and direct table inserts must be impossible (no insert
-- policy — the RPC is the only write path).
--
-- Run with the Supabase CLI: `supabase test db`.

begin;
select plan(8);

insert into organizations (org_id, company_name, subdomain)
values
  ('11111111-1111-1111-1111-111111111111', 'Org A Exporters', 'org-a'),
  ('22222222-2222-2222-2222-222222222222', 'Org B Exporters', 'org-b');

insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@org-a.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin@org-b.test');

insert into org_users (user_id, org_id, role, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin', 'admin@org-a.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'admin', 'admin@org-b.test');

insert into regions (region_id, org_id, name)
values
  ('a1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Region A'),
  ('b2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Region B');

insert into suppliers (supplier_id, org_id, name)
values
  ('a1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Supplier A'),
  ('b2222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Supplier B');

insert into farms (farm_id, org_id, region_id, name)
values
  ('a1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000001', 'Farm A'),
  ('b2222222-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'b2222222-0000-0000-0000-000000000001', 'Farm B');

insert into farmers (farmer_id, org_id, supplier_id, farm_id, name)
values
  ('a1111111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000003', 'Farmer A'),
  ('b2222222-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'b2222222-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000003', 'Farmer B');

insert into intake_batches (intake_id, org_id, supplier_id, farmer_id, farm_id, gross_weight_kg)
values
  ('a1111111-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000003', 1200),
  ('b2222222-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'b2222222-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000004', 'b2222222-0000-0000-0000-000000000003', 900);

insert into processing_runs (run_id, org_id, intake_id, station, packing_method, qty_received_kg)
values
  ('a1111111-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000005', 'Table 1', 'hand', 1200),
  ('b2222222-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'b2222222-0000-0000-0000-000000000005', 'Table 1', 'hand', 900);

-- Simulate an authenticated request from the Org A admin.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text,
  true
);

select lives_ok(
  $$select public.log_qc_check('a1111111-0000-0000-0000-000000000006', 'approve')$$,
  'Org A can log an approve check with no photo'
);

select throws_ok(
  $$select public.log_qc_check('a1111111-0000-0000-0000-000000000006', 'reject', '{bruise}', null, '{}')$$,
  'A photo is required for hold/reject dispositions',
  'Reject with zero photos is blocked server-side'
);

select lives_ok(
  $$select public.log_qc_check('a1111111-0000-0000-0000-000000000006', 'reject', '{bruise}', 'soft spots', '{11111111-1111-1111-1111-111111111111/qc_check/test/photo1.jpg}')$$,
  'Reject with a photo succeeds'
);

select throws_ok(
  $$select public.log_qc_check('b2222222-0000-0000-0000-000000000006', 'approve')$$,
  'Run not found',
  'Org A cannot log a QC check against Org B''s run'
);

select throws_ok(
  $$insert into qc_checks (org_id, run_id, disposition) values ('11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000006', 'reject')$$,
  '42501',
  'new row violates row-level security policy for table "qc_checks"',
  'Direct table insert is blocked — the RPC is the only write path'
);

select is((select count(*) from qc_checks)::int, 2, 'Org A session sees its own two checks');
select is(
  (select count(*) from stage_photos where reference_type = 'qc_check')::int, 1,
  'The reject''s photo landed in stage_photos linked to the check'
);

-- Simulate an anonymous request: no JWT claims at all.
set local role anon;
select set_config('request.jwt.claims', '', true);

select is((select count(*) from qc_checks)::int, 0, 'Penalized query: no session returns ZERO qc_checks rows, not all rows');

select * from finish();
rollback;
