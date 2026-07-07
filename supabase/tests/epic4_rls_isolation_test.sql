-- Penalized-query isolation test for Epic 4 (cold_rooms, pallets,
-- pallet_run_contents, pallet_split_log, cold_storage_logs).
--
-- Run with the Supabase CLI: `supabase test db`.

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

insert into intake_batches (intake_id, org_id, supplier_id, farmer_id, farm_id, gross_weight_kg)
values
  ('a1111111-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000003', 1200),
  ('b2222222-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'b2222222-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000004', 'b2222222-0000-0000-0000-000000000003', 900);

insert into processing_runs (run_id, org_id, intake_id, station, packing_method, qty_received_kg)
values
  ('a1111111-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000005', 'Table 1', 'hand', 1200),
  ('b2222222-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'b2222222-0000-0000-0000-000000000005', 'Table 1', 'hand', 900);

insert into cold_rooms (cold_room_id, org_id, name, target_temp_c)
values
  ('a1111111-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Cold Room 1', 5),
  ('b2222222-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'Cold Room 1', 5);

insert into pallets (pallet_id, org_id, pallet_code, cold_room_id)
values
  ('a1111111-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'PLT-TESTA001', 'a1111111-0000-0000-0000-000000000007'),
  ('a1111111-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'PLT-TESTA002', null),
  ('b2222222-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'PLT-TESTB001', 'b2222222-0000-0000-0000-000000000007');

insert into pallet_split_log (split_id, org_id, original_pallet_id, new_pallet_id, reason)
values
  ('a1111111-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000008', 'a1111111-0000-0000-0000-000000000009', 'Partial pick for order X');

insert into pallet_run_contents (org_id, pallet_id, run_id, size_grade, box_count, total_weight_kg, split_id)
values
  ('11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000008', 'a1111111-0000-0000-0000-000000000006', '18', 40, 160, null),
  ('11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000009', 'a1111111-0000-0000-0000-000000000006', '18', 10, 40, 'a1111111-0000-0000-0000-00000000000a'),
  ('22222222-2222-2222-2222-222222222222', 'b2222222-0000-0000-0000-000000000008', 'b2222222-0000-0000-0000-000000000006', '20', 30, 150, null);

insert into cold_storage_logs (org_id, cold_room_id, temp_c, humidity_pct)
values
  ('11111111-1111-1111-1111-111111111111', 'a1111111-0000-0000-0000-000000000007', 5.1, 90),
  ('22222222-2222-2222-2222-222222222222', 'b2222222-0000-0000-0000-000000000007', 4.8, 88);

-- Simulate an authenticated request from the Org A admin.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text,
  true
);

select is((select count(*) from cold_rooms)::int, 1, 'Org A session sees exactly one cold room (its own)');
select is((select count(*) from pallets)::int, 2, 'Org A session sees exactly its own two pallets');
select is((select count(*) from pallet_run_contents)::int, 2, 'Org A session sees exactly its own pallet content rows');
select is(
  (select count(*) from pallets where org_id = '22222222-2222-2222-2222-222222222222')::int, 0,
  'Org A session cannot see Org B''s pallet even filtering directly by Org B''s org_id'
);
select is(
  (select count(*) from pallet_split_log where original_pallet_id = 'a1111111-0000-0000-0000-000000000008'
     and new_pallet_id = 'a1111111-0000-0000-0000-000000000009')::int, 1,
  'Split lineage is intact: both fragments link through the split log to the same source'
);

-- Simulate an anonymous request: no JWT claims at all.
set local role anon;
select set_config('request.jwt.claims', '', true);

select is((select count(*) from cold_rooms)::int, 0, 'Penalized query: no session returns ZERO cold_rooms rows, not all rows');
select is((select count(*) from pallets)::int, 0, 'Penalized query: no session returns ZERO pallets rows, not all rows');
select is((select count(*) from pallet_run_contents)::int, 0, 'Penalized query: no session returns ZERO pallet_run_contents rows, not all rows');
select is((select count(*) from cold_storage_logs)::int, 0, 'Penalized query: no session returns ZERO cold_storage_logs rows, not all rows');

select * from finish();
rollback;
