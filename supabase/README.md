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
- Paste the project's URL/anon key into `.env.local` (see `.env.example`) so the Next.js app can actually connect.
- PLATFORM-004 (branding injection) and PLATFORM-006 (rate limiting) were deferred out of this four-ticket pass per your call — pick those up before Phase 3 (ADMIN-001) needs branding, and before load starts mattering.
