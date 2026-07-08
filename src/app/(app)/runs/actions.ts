"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

export type OpenRunState = { error: string | null };

export async function openRun(_prevState: OpenRunState, formData: FormData): Promise<OpenRunState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const intakeId = String(formData.get("intake_id") ?? "");
  const station = String(formData.get("station") ?? "").trim();
  const packingMethod = String(formData.get("packing_method") ?? "");
  const qtyReceivedKg = Number(formData.get("qty_received_kg"));

  if (!intakeId || !station) return { error: "Batch and station are required" };
  if (packingMethod !== "hand" && packingMethod !== "machine") {
    return { error: "Invalid packing method" };
  }
  if (!Number.isFinite(qtyReceivedKg) || qtyReceivedKg <= 0) {
    return { error: "Qty received must be a positive number" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processing_runs")
    .insert({
      org_id: ctx.orgId,
      intake_id: intakeId,
      station,
      packing_method: packingMethod,
      qty_received_kg: qtyReceivedKg,
      opened_by: ctx.userId,
    })
    .select("run_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `Station "${station}" already has an active run — close it first.` };
    }
    return { error: error.message };
  }

  revalidatePath("/runs");
  redirect(`/runs/${data.run_id}`);
}
