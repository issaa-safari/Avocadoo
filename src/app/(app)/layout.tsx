import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrgContext } from "@/lib/auth/org-context";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getOrgContext();

  if (!ctx) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("company_name")
    .eq("org_id", ctx.orgId)
    .single();

  return (
    <div>
      <header className="top-nav">
        <div>
          <strong>{org?.company_name ?? "Packhouse"}</strong>
          <span className="muted" style={{ marginLeft: "0.6rem" }}>
            {ctx.role}
          </span>
        </div>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/receiving">Receiving</Link>
          <Link href="/runs">Run Control</Link>
          <Link href="/qc">QC</Link>
          <Link href="/suppliers">Suppliers</Link>
          <Link href="/farmers">Farmers</Link>
          <Link href="/farms">Farms</Link>
        </nav>
        <SignOutButton />
      </header>
      <main className="page-shell">{children}</main>
    </div>
  );
}
