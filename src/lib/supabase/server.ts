import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads the session from cookies so org_id can be resolved
 * server-side via auth.uid() — never from a client-supplied header/param.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no ability to set cookies.
            // Safe to ignore when middleware is refreshing the session.
          }
        },
      },
    },
  );
}
