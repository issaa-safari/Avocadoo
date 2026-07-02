-- Fixes two issues surfaced by the Supabase security advisor after applying
-- PLATFORM-002/003/005:
--
-- 1. current_auth_aal() had a mutable search_path.
-- 2. current_org_id(), current_user_role(), and log_security_event() were
--    still executable by the `anon` role. `revoke ... from public` does not
--    revoke a role-specific grant — Supabase's default privileges grant
--    EXECUTE to `anon`/`authenticated` directly (not just via PUBLIC) at
--    function-creation time, so anon must be revoked explicitly.

alter function public.current_auth_aal() set search_path = '';

revoke execute on function public.current_org_id() from public, anon, authenticated;
grant execute on function public.current_org_id() to authenticated;

revoke execute on function public.current_user_role() from public, anon, authenticated;
grant execute on function public.current_user_role() to authenticated;

revoke execute on function public.log_security_event(text, text, uuid, inet) from public, anon, authenticated;
grant execute on function public.log_security_event(text, text, uuid, inet) to authenticated;
