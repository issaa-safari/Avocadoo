"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

export async function createSupplier(formData: FormData) {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    org_id: ctx.orgId,
    name: String(formData.get("name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim() || null,
    contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
    contact_email: String(formData.get("contact_email") ?? "").trim() || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/suppliers");
}

export async function deleteSupplier(supplierId: string) {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("supplier_id", supplierId)
    .eq("org_id", ctx.orgId);

  if (error) throw new Error(error.message);
  revalidatePath("/suppliers");
}
