"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

export async function createFarmer(formData: FormData) {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const farmId = String(formData.get("farm_id") ?? "");
  const { error } = await supabase.from("farmers").insert({
    org_id: ctx.orgId,
    name: String(formData.get("name") ?? "").trim(),
    supplier_id: String(formData.get("supplier_id") ?? ""),
    farm_id: farmId || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/farmers");
}

export async function deleteFarmer(farmerId: string) {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase
    .from("farmers")
    .delete()
    .eq("farmer_id", farmerId)
    .eq("org_id", ctx.orgId);

  if (error) throw new Error(error.message);
  revalidatePath("/farmers");
}
