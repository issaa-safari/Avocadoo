"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";
import { friendlyDbError } from "@/lib/db-errors";

export type SupplierActionResult = { error: string | null };

export async function createSupplier(formData: FormData): Promise<SupplierActionResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Supplier name is required" };

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    org_id: ctx.orgId,
    name,
    contact_name: String(formData.get("contact_name") ?? "").trim() || null,
    contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
    contact_email: String(formData.get("contact_email") ?? "").trim() || null,
  });

  if (error) return { error: friendlyDbError(error, "supplier") };
  revalidatePath("/suppliers");
  return { error: null };
}

export async function deleteSupplier(supplierId: string): Promise<SupplierActionResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("supplier_id", supplierId)
    .eq("org_id", ctx.orgId);

  if (error) return { error: friendlyDbError(error, "supplier") };
  revalidatePath("/suppliers");
  return { error: null };
}
