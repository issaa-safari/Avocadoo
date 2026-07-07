"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";
import { friendlyDbError } from "@/lib/db-errors";

export type FarmerActionResult = { error: string | null };

export async function createFarmer(formData: FormData): Promise<FarmerActionResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const name = String(formData.get("name") ?? "").trim();
  const supplierId = String(formData.get("supplier_id") ?? "");
  if (!name) return { error: "Farmer name is required" };
  if (!supplierId) return { error: "Every farmer must belong to a supplier" };

  const supabase = await createClient();
  const farmId = String(formData.get("farm_id") ?? "");
  const { error } = await supabase.from("farmers").insert({
    org_id: ctx.orgId,
    name,
    supplier_id: supplierId,
    farm_id: farmId || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
  });

  if (error) return { error: friendlyDbError(error, "farmer") };
  revalidatePath("/farmers");
  return { error: null };
}

export async function assignFarmToFarmer(farmerId: string, farmId: string): Promise<FarmerActionResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };
  if (!farmId) return { error: "Pick a farm" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("farmers")
    .update({ farm_id: farmId })
    .eq("farmer_id", farmerId)
    .eq("org_id", ctx.orgId);

  if (error) return { error: friendlyDbError(error, "farmer") };
  revalidatePath("/farmers");
  revalidatePath("/receiving");
  return { error: null };
}

export async function deleteFarmer(farmerId: string): Promise<FarmerActionResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("farmers")
    .delete()
    .eq("farmer_id", farmerId)
    .eq("org_id", ctx.orgId);

  if (error) return { error: friendlyDbError(error, "farmer") };
  revalidatePath("/farmers");
  return { error: null };
}
