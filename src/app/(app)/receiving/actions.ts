"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

export async function createIntakeBatch(formData: FormData) {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");

  const supplierId = String(formData.get("supplier_id") ?? "");
  const farmerId = String(formData.get("farmer_id") ?? "");
  const farmId = String(formData.get("farm_id") ?? "");
  const grossWeightKg = Number(formData.get("gross_weight_kg"));

  if (!supplierId || !farmerId || !farmId) {
    throw new Error("Supplier, farmer, and farm are required");
  }
  if (!Number.isFinite(grossWeightKg) || grossWeightKg <= 0) {
    throw new Error("Gross weight must be a positive number");
  }

  const supabase = await createClient();
  const binCountRaw = formData.get("bin_count");
  const fieldTempRaw = formData.get("field_temp_c");

  const { error } = await supabase.from("intake_batches").insert({
    org_id: ctx.orgId,
    supplier_id: supplierId,
    farmer_id: farmerId,
    farm_id: farmId,
    gross_weight_kg: grossWeightKg,
    bin_count: binCountRaw ? Number(binCountRaw) : null,
    field_temp_c: fieldTempRaw ? Number(fieldTempRaw) : null,
    transport_plate: String(formData.get("transport_plate") ?? "").trim() || null,
    driver_name: String(formData.get("driver_name") ?? "").trim() || null,
    variety: String(formData.get("variety") ?? "").trim() || null,
    created_by: ctx.userId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/receiving");
}
