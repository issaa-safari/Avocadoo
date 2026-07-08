-- Penalized-query isolation test for Epic 3 (processing_runs, packed_units,
-- reconciliation_records, supplier_returns).
--
-- Run with the Supabase CLI: `supabase test db`.

begin;
select plan(6);

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

insert into packed_units (org_id, run_id, size_grade, net_weight_kg, box_count, packing_method)
values
  ('11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000006', '18', 4, 40, 'hand'),
  ('22222222-2222-2222-2222-222222222222', 'b2222222-0000-0000-0000-000000000006', '18', 4, 30, 'hand');

-- Simulate an authenticated request from the Org A admin.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text,
  true
);

select is((select count(*) from processing_runs)::int, 1, 'Org A session sees exactly one run (its own)');
select is((select count(*) from packed_units)::int, 1, 'Org A session sees exactly one packed_units row (its own)');
select is(
  (select count(*) from processing_runs where org_id = '22222222-2222-2222-2222-222222222222')::int, 0,
  'Org A session cannot see Org B''s run even filtering directly by Org B''s org_id'
);
select is(
  (select qty_received_kg from processing_runs limit 1), 1200::numeric,
  'Org A session sees its own run''s data, not Org B''s'
);

-- Simulate an anonymous request: no JWT claims at all.
set local role anon;
select set_config('request.jwt.claims', '', true);

select is((select count(*) from processing_runs)::int, 0, 'Penalized query: no session returns ZERO processing_runs rows, not all rows');
select is((select count(*) from packed_units)::int, 0, 'Penalized query: no session returns ZERO packed_units rows, not all rows');

select * from finish();
rollback;
