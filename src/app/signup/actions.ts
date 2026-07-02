"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type SignUpState = { error: string | null; checkEmail: boolean; email: string | null };

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function signUp(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { company_name: companyName },
      emailRedirectTo: `${await getOrigin()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message, checkEmail: false, email: null };
  }

  // Email confirmation disabled: session exists immediately, so we can
  // provision the org right here. Otherwise /auth/callback does it once the
  // confirmation link is clicked and the session exists.
  if (data.session) {
    const { error: rpcError } = await supabase.rpc("create_org_and_admin", {
      p_company_name: companyName,
    });
    if (rpcError) {
      return { error: rpcError.message, checkEmail: false, email: null };
    }
    redirect("/dashboard");
  }

  return { error: null, checkEmail: true, email };
}
