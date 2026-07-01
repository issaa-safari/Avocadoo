# Phase 0 schema — PLATFORM-001, 002, 003, 005

`migrations/` contains the tenant-foundation schema in apply order:

1. `20260701000001_platform_001_tenant_data_model.sql` — `organizations`, `org_users`, `org_settings`. RLS is enabled with zero policies (fails closed).
2. `20260701000002_platform_002_rls_helpers_and_policies.sql` — `current_org_id()`/`current_user_role()` helpers plus the actual RLS policies.
3. `20260701000003_platform_003_org_routing_support.sql` — `current_auth_aal()` helper for MFA gating (the routing logic itself lives in `src/proxy.ts` and `src/lib/supabase/server.ts`).
4. `20260701000004_platform_005_security_audit_log.sql` — tenant-scoped `security_audit_log`, writable only via `log_security_event()`.

## Applying to a real project

Once you have a Supabase project:

- **Supabase CLI**: `supabase link --project-ref <ref>` then `supabase db push`.
- **Dashboard**: paste each migration file's contents into the SQL editor, in order, and run them one at a time.
- **MCP tools** (once connected in this session): I can run `apply_migration` for each file directly.

## Running the isolation test

`tests/platform_002_rls_isolation_test.sql` is a pgTAP test — the "penalized query" test required by PLATFORM-002's acceptance criteria. Run it with:

```
supabase test db
```

It proves an Org A session sees only Org A rows, and a request with no session gets zero rows back, not all rows.

## Still needed before Phase 0 is fully done

- Enable TOTP MFA in the Supabase Dashboard (Authentication → Providers → Multi-Factor) — this is a project setting, not a migration.
- Wire `requireMfaForRole()` (`src/lib/auth/org-context.ts`) into the login flow once there's a real admin screen to protect.
- PLATFORM-004 (branding injection) and PLATFORM-006 (rate limiting) were deferred out of this four-ticket pass per your call — pick those up before Phase 3 (ADMIN-001) needs branding, and before load starts mattering.
