-- Revoking EXECUTE on current_org_id()/current_user_role() from anon made
-- unauthenticated queries error with "permission denied for function
-- current_org_id" instead of cleanly returning zero rows, because the RLS
-- policy predicate itself couldn't evaluate. PLATFORM-002's acceptance
-- criteria is specifically "returns zero rows, not all rows" for a request
-- without the correct session — an error is a different failure mode and
-- also leaks an internal function name in the error message to an
-- unauthenticated caller.
--
-- Safe to grant EXECUTE to anon here: both functions take no arguments and
-- only ever evaluate `... where user_id = auth.uid()`, which is NULL for an
-- anon session, so they just return NULL and every org_id/role comparison
-- in a policy fails closed to zero rows. There's no parameter surface for
-- an anon caller to manipulate.
--
-- log_security_event() is NOT re-granted to anon — it performs a write and
-- anon has no legitimate reason to log a security event against no org.

grant execute on function public.current_org_id() to anon;
grant execute on function public.current_user_role() to anon;
