"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error: string | null };

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Fallback org provisioning for any confirmed account that reaches login
  // without having gone through signup's immediate-session path or the
  // /auth/callback confirmation link — see create_org_and_admin_rpc.sql.
  // A no-op (RPC raises, ignored) for every user who already has an org.
  await supabase.rpc("create_org_and_admin");

  redirect("/dashboard");
}
