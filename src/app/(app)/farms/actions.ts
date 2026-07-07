"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";
import { friendlyDbError } from "@/lib/db-errors";

export type FarmActionResult = { error: string | null };

export async function createRegion(formData: FormData): Promise<FarmActionResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const name = String(formData.get("region_name") ?? "").trim();
  if (!name) return { error: "Region name is required" };

  const supabase = await createClient();
  const { error } = await supabase.from("regions").insert({
    org_id: ctx.orgId,
    name,
  });

  if (error) return { error: friendlyDbError(error, "region") };
  revalidatePath("/farms");
  return { error: null };
}

export async function createFarm(formData: FormData): Promise<FarmActionResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const name = String(formData.get("name") ?? "").trim();
  const regionId = String(formData.get("region_id") ?? "");
  if (!name) return { error: "Farm name is required" };
  if (!regionId) return { error: "Region is required on a farm" };

  const supabase = await createClient();
  const { error } = await supabase.from("farms").insert({
    org_id: ctx.orgId,
    name,
    region_id: regionId,
    block_label: String(formData.get("block_label") ?? "").trim() || null,
  });

  if (error) return { error: friendlyDbError(error, "farm") };
  revalidatePath("/farms");
  return { error: null };
}

export async function deleteFarm(farmId: string): Promise<FarmActionResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("farms")
    .delete()
    .eq("farm_id", farmId)
    .eq("org_id", ctx.orgId);

  if (error) return { error: friendlyDbError(error, "farm") };
  revalidatePath("/farms");
  return { error: null };
}
