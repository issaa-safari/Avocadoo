-- Penalized-query isolation test for PLATFORM-002.
--
-- Run with the Supabase CLI: `supabase test db` (requires pgTAP, which the
-- CLI's local Postgres image has enabled by default).
--
-- Proves: an Org A user querying `organizations`/`org_users` sees only Org A
-- rows, and a request with no valid session (anon, no JWT) gets ZERO rows,
-- not all rows. This is the one test every future domain table must repeat
-- once it gets its own RLS policies.

begin;
select plan(6);

-- Two fake orgs.
insert into organizations (org_id, company_name, subdomain)
values
  ('11111111-1111-1111-1111-111111111111', 'Org A Exporters', 'org-a'),
  ('22222222-2222-2222-2222-222222222222', 'Org B Exporters', 'org-b');

-- Two fake auth.users (minimal columns; the rest take Supabase defaults).
insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@org-a.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin@org-b.test');

insert into org_users (user_id, org_id, role, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin', 'admin@org-a.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'admin', 'admin@org-b.test');

-- Simulate an authenticated request from the Org A admin.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text,
  true
);

select is(
  (select count(*) from organizations)::int, 1,
  'Org A session sees exactly one organizations row (its own)'
);

select is(
  (select org_id from organizations limit 1), '11111111-1111-1111-1111-111111111111'::uuid,
  'Org A session sees Org A''s organizations row, not Org B''s'
);

select is(
  (select count(*) from org_users)::int, 1,
  'Org A session sees exactly one org_users row (its own)'
);

select is(
  (select count(*) from org_users where org_id = '22222222-2222-2222-2222-222222222222')::int, 0,
  'Org A session cannot see Org B''s org_users row even when filtering by Org B''s org_id directly'
);

-- Simulate an anonymous request: no JWT claims at all.
set local role anon;
select set_config('request.jwt.claims', '', true);

select is(
  (select count(*) from organizations)::int, 0,
  'Penalized query: no session returns ZERO organizations rows, not all rows'
);

select is(
  (select count(*) from org_users)::int, 0,
  'Penalized query: no session returns ZERO org_users rows, not all rows'
);

select * from finish();
rollback;
