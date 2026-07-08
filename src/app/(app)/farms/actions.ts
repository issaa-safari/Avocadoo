"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

export async function createRegion(formData: FormData) {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase.from("regions").insert({
    org_id: ctx.orgId,
    name: String(formData.get("region_name") ?? "").trim(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/farms");
}

export async function createFarm(formData: FormData) {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase.from("farms").insert({
    org_id: ctx.orgId,
    name: String(formData.get("name") ?? "").trim(),
    region_id: String(formData.get("region_id") ?? ""),
    block_label: String(formData.get("block_label") ?? "").trim() || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/farms");
}

export async function deleteFarm(farmId: string) {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase
    .from("farms")
    .delete()
    .eq("farm_id", farmId)
    .eq("org_id", ctx.orgId);

  if (error) throw new Error(error.message);
  revalidatePath("/farms");
}
