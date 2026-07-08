-- PLATFORM-003: Auth & org routing support
--
-- The routing itself (subdomain -> org, session handling) lives in the
-- Next.js app (src/proxy.ts, src/lib/supabase/server.ts) and always resolves
-- org_id server-side from auth.uid() via current_org_id() — never from a
-- client header or parameter. This migration adds the one piece of DB-side
-- support that's missing: reading the auth strength (aal) of the current
-- session, so app code and future RLS policies can require a completed MFA
-- challenge (aal2) for admin/supervisor actions.
--
-- MFA itself (TOTP enrollment/verification) is enabled per-project in the
-- Supabase Dashboard under Authentication -> Providers -> Multi-Factor, and
-- enforced in the app layer (src/lib/auth/org-context.ts) by redirecting
-- admin/supervisor users to complete an MFA challenge before granting access
-- to anything beyond enrollment. There is no separate "MFA table" to create.

create or replace function public.current_auth_aal()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1')
$$;

comment on function public.current_auth_aal() is
  'Returns the authenticator assurance level (aal1/aal2) of the current session, for gating admin/supervisor actions behind completed MFA.';
