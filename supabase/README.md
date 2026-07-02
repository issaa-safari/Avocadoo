# Phase 0 schema — PLATFORM-001, 002, 003, 005

**Status: applied to the live project** (`yuakvjrcbielrcknfnrt`, "Avocadoo") via the Supabase MCP `apply_migration` tool. `migrations/` is the source of truth — re-run these against any other environment (staging, a teammate's project) in this order:

1. `20260701000001_platform_001_tenant_data_model.sql` — `organizations`, `org_users`, `org_settings`. RLS is enabled with zero policies (fails closed).
2. `20260701000002_platform_002_rls_helpers_and_policies.sql` — `current_org_id()`/`current_user_role()` helpers plus the actual RLS policies.
3. `20260701000003_platform_003_org_routing_support.sql` — `current_auth_aal()` helper for MFA gating (the routing logic itself lives in `src/proxy.ts` and `src/lib/supabase/server.ts`).
4. `20260701000004_platform_005_security_audit_log.sql` — tenant-scoped `security_audit_log`, writable only via `log_security_event()`.
5. `20260701000005_platform_002_lockdown_function_privileges.sql` — fixes the search_path warning on `current_auth_aal()` and strips `anon`'s default EXECUTE grant that Supabase adds automatically on function creation.
6. `20260701000006_platform_002_allow_anon_org_id_lookup.sql` — re-grants `current_org_id()`/`current_user_role()` (not `log_security_event()`) to `anon`, deliberately: without it, an unauthenticated request errors with "permission denied" instead of cleanly returning zero rows, which is what PLATFORM-002's acceptance criteria actually asks for.

(Note: the version numbers Supabase recorded server-side, e.g. `20260702154856`, don't match these filenames exactly — `apply_migration` timestamps them at apply time. The filenames are for readable ordering in the repo; `list_migrations` against the live project is the actual applied history.)

## Applying to a real project

- **Supabase CLI**: `supabase link --project-ref <ref>` then `supabase db push`.
- **Dashboard**: paste each migration file's contents into the SQL editor, in order, and run them one at a time.
- **MCP tools**: `apply_migration` for each file, in order — this is how they were applied here.

## Isolation test — run twice, two different ways

1. **`tests/platform_002_rls_isolation_test.sql`** — a pgTAP test for local/CI use via `supabase test db`.
2. **Already run live**, directly against `yuakvjrcbielrcknfnrt`, using temporary fixture rows (two orgs, two `org_users`, two `auth.users`) that were deleted immediately after: an Org A session saw exactly its own `organizations`/`org_users` row and could not see Org B's even when filtering directly by its `org_id`; a session with no JWT claims at all (simulating `anon`, no session) got **zero rows** back from every Phase 0 table — `organizations`, `org_users`, `org_settings`, `security_audit_log`. `log_security_event()` was confirmed to reject `anon` outright (permission denied).

`get_advisors` (security) was run after applying — the only remaining warnings are the five expected ones: `current_org_id()`/`current_user_role()` being callable by `anon`/`authenticated`, and `log_security_event()` by `authenticated`. All three are required for the RLS scheme to function and were verified above to fail closed, not open.

## Still needed before Phase 0 is fully done

- Enable TOTP MFA in the Supabase Dashboard (Authentication → Providers → Multi-Factor) — this is a project setting, not a migration.
- Wire `requireMfaForRole()` (`src/lib/auth/org-context.ts`) into the login flow once there's a real admin screen to protect.
- PLATFORM-004 (branding injection) and PLATFORM-006 (rate limiting) were deferred out of this four-ticket pass per your call — pick those up before Phase 3 (ADMIN-001) needs branding, and before load starts mattering.

---

# Phase 1 — Epic 1: Intake & Receiving (INTAKE-001, INTAKE-002)

**Status: applied to the live project.**

7. `20260702000001_intake_epic1_schema.sql` — `regions`, `suppliers`, `farms`, `farmers`, `stage_photos`, `intake_batches`. Uses composite FKs (`(org_id, x_id)`, not plain `x_id`) so the database itself rejects a row referencing another org's supplier/farm/farmer — defense-in-depth on top of RLS, not instead of it.
8. `20260702000002_intake_epic1_rls_policies.sql` — full CRUD org-scoped policies for the five tables above (`stage_photos` gets select+insert only — evidence is never edited/deleted). Fine-grained role restriction (who can delete a supplier, etc.) is deferred to RBAC-001 (Phase 6).
9. `20260702000003_create_org_and_admin_rpc.sql` — `create_org_and_admin()` RPC: lets a freshly signed-up user provision their own org and become its admin in one atomic call. `subdomain` is derived server-side from `company_name`, never accepted from the client.

Isolation re-verified the same way as Phase 0: two-org fixtures inserted live, an Org A session saw only its own region/supplier/farm/farmer/intake row and couldn't see Org B's even filtering directly by `org_id`, an anon session got zero rows from every table, fixtures deleted after. Mirrored in `tests/intake_epic1_rls_isolation_test.sql` for CI.

## App layer built alongside this schema

- `/login`, `/signup`, `/auth/callback` — email/password auth via **Server Actions** (not client-side `supabase-js` calls) — see note below.
- `(app)/layout.tsx` — auth guard (redirects to `/login` if no session or no org) + nav, shared by all authenticated pages.
- `/dashboard`, `/suppliers`, `/farms` (+ inline region quick-add), `/farmers`, `/receiving` — full working CRUD + the INTAKE-001 receiving form (supplier → farmer filter → farm auto-fill, matching the wireframe).
- End-to-end tested live in a real browser (Playwright): signup → org auto-provisioning → create supplier/region/farm/farmer → log an intake with the supplier-filtered farmer dropdown and farm auto-fill → dashboard counts update → sign-out correctly blocks the protected routes. All test fixtures were deleted from the live project afterward.

**Why Server Actions instead of client-side Supabase Auth calls:** this sandboxed environment's headless browser can't complete TLS with the outbound proxy for direct browser→Supabase calls (a testing-environment limitation, not a Supabase issue). Rather than route around it, auth was moved server-side entirely — which also keeps every Supabase Auth call server-side, consistent with the "org_id resolved server-side" posture elsewhere in this codebase.
