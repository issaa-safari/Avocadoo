"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

// Server actions RETURN error strings instead of throwing: Next.js redacts
// thrown error messages in production builds ("An error occurred in the
// Server Components render…"), so a throw can never carry a user-facing
// validation message to the client in prod.
export type IntakeResult = { error: string | null };

export async function createIntakeBatch(formData: FormData): Promise<IntakeResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const supplierId = String(formData.get("supplier_id") ?? "");
  const farmerId = String(formData.get("farmer_id") ?? "");
  const farmId = String(formData.get("farm_id") ?? "");
  const grossWeightKg = Number(formData.get("gross_weight_kg"));

  if (!supplierId || !farmerId) {
    return { error: "Supplier and farmer are required" };
  }
  if (!farmId) {
    return {
      error:
        "This farmer has no farm/block on file, so the delivery can't be traced to a farm. Add a farm to the farmer on the Farmers page first.",
    };
  }
  if (!Number.isFinite(grossWeightKg) || grossWeightKg <= 0) {
    return { error: "Gross weight must be a positive number" };
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

  if (error) return { error: error.message };
  revalidatePath("/receiving");
  return { error: null };
}
