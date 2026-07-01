import { createClient } from "@/lib/supabase/server";

export type OrgRole =
  | "admin"
  | "supervisor"
  | "receiving_clerk"
  | "qc_inspector"
  | "palletizer"
  | "viewer";

export type OrgContext = {
  userId: string;
  orgId: string;
  role: OrgRole;
  aal: "aal1" | "aal2";
};

const ROLES_REQUIRING_MFA: OrgRole[] = ["admin", "supervisor"];

/**
 * Resolves the current user's org_id/role/aal entirely server-side from the
 * Supabase session (org_users + JWT claims). Never accepts org_id from a
 * client header, query param, or form field — every caller must go through
 * this function instead of trusting request input.
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: orgUser } = await supabase
    .from("org_users")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single();

  if (!orgUser) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const aal = (session?.user.app_metadata?.aal as "aal1" | "aal2") ?? "aal1";

  return {
    userId: user.id,
    orgId: orgUser.org_id,
    role: orgUser.role,
    aal,
  };
}

/**
 * Throws unless the current session belongs to a role that doesn't require
 * MFA, or has completed an MFA challenge (aal2). Call this at the top of any
 * admin/supervisor-only server action or route handler.
 */
export async function requireMfaForRole(ctx: OrgContext): Promise<void> {
  if (!ROLES_REQUIRING_MFA.includes(ctx.role)) return;
  if (ctx.aal === "aal2") return;

  throw new Error("MFA_REQUIRED");
}
