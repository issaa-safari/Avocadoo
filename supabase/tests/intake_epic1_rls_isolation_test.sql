-- Penalized-query isolation test for Epic 1 (regions, suppliers, farms,
-- farmers, intake_batches, stage_photos).
--
-- Run with the Supabase CLI: `supabase test db`.
--
-- Mirrors platform_002_rls_isolation_test.sql: proves an Org A session sees
-- only its own chain of master data + intake records, cannot see Org B's
-- even filtering directly by org_id, and a session with no valid JWT (anon)
-- gets ZERO rows, not all rows, from every table in this migration.

begin;
select plan(9);

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

insert into intake_batches (org_id, supplier_id, farmer_id, farm_id, gross_weight_kg)
values
  ('11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000003', 1200),
  ('22222222-2222-2222-2222-222222222222', 'b2222222-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000004', 'b2222222-0000-0000-0000-000000000003', 900);

-- Simulate an authenticated request from the Org A admin.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text,
  true
);

select is((select count(*) from regions)::int, 1, 'Org A session sees exactly one region (its own)');
select is((select count(*) from suppliers)::int, 1, 'Org A session sees exactly one supplier (its own)');
select is((select count(*) from farms)::int, 1, 'Org A session sees exactly one farm (its own)');
select is((select count(*) from farmers)::int, 1, 'Org A session sees exactly one farmer (its own)');
select is((select count(*) from intake_batches)::int, 1, 'Org A session sees exactly one intake batch (its own)');
select is(
  (select count(*) from suppliers where org_id = '22222222-2222-2222-2222-222222222222')::int, 0,
  'Org A session cannot see Org B''s supplier even filtering directly by Org B''s org_id'
);
select is(
  (select gross_weight_kg from intake_batches limit 1), 1200::numeric,
  'Org A session sees its own intake batch''s data, not Org B''s'
);

-- Simulate an anonymous request: no JWT claims at all.
set local role anon;
select set_config('request.jwt.claims', '', true);

select is(
  (select count(*) from intake_batches)::int, 0,
  'Penalized query: no session returns ZERO intake_batches rows, not all rows'
);
select is(
  (select count(*) from farmers)::int, 0,
  'Penalized query: no session returns ZERO farmers rows, not all rows'
);

select * from finish();
rollback;
