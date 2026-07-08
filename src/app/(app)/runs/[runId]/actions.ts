"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

export async function logBox(runId: string, formData: FormData) {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");

  const sizeGrade = String(formData.get("size_grade") ?? "").trim();
  const netWeightKg = Number(formData.get("net_weight_kg"));
  const boxCount = Number(formData.get("box_count") ?? 1);
  const packingMethod = String(formData.get("packing_method") ?? "");

  if (!sizeGrade) throw new Error("Size grade is required");
  if (!Number.isFinite(netWeightKg) || netWeightKg <= 0) throw new Error("Weight must be positive");
  if (!Number.isInteger(boxCount) || boxCount <= 0) throw new Error("Box count must be a positive integer");
  if (packingMethod !== "hand" && packingMethod !== "machine") throw new Error("Invalid packing method");

  const supabase = await createClient();

  const { data: run, error: runError } = await supabase
    .from("processing_runs")
    .select("run_id, status")
    .eq("run_id", runId)
    .single();

  if (runError || !run) throw new Error("Run not found");
  if (run.status !== "active") throw new Error("Cannot log boxes on a closed run");

  const { error } = await supabase.from("packed_units").insert({
    org_id: ctx.orgId,
    run_id: runId,
    size_grade: sizeGrade,
    net_weight_kg: netWeightKg,
    box_count: boxCount,
    packing_method: packingMethod,
    packer_id: ctx.userId,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/runs/${runId}`);
}
