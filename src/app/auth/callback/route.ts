import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Idempotent from the caller's perspective: if this user already has
      // an org (e.g. the confirmation link was clicked twice), the RPC
      // raises and we just ignore it — the org was already provisioned the
      // first time.
      await supabase.rpc("create_org_and_admin");
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
