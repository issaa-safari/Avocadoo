"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

// Returns an error string instead of throwing — thrown server-action error
// messages are redacted in production builds, so they can never reach the UI.
export type LogBoxResult = { error: string | null };

export async function logBox(runId: string, formData: FormData): Promise<LogBoxResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const sizeGrade = String(formData.get("size_grade") ?? "").trim();
  const netWeightKg = Number(formData.get("net_weight_kg"));
  const boxCount = Number(formData.get("box_count") ?? 1);
  const packingMethod = String(formData.get("packing_method") ?? "");

  if (!sizeGrade) return { error: "Size grade is required" };
  if (!Number.isFinite(netWeightKg) || netWeightKg <= 0) return { error: "Weight must be positive" };
  if (!Number.isInteger(boxCount) || boxCount <= 0) return { error: "Box count must be a positive integer" };
  if (packingMethod !== "hand" && packingMethod !== "machine") return { error: "Invalid packing method" };

  const supabase = await createClient();

  const { data: run, error: runError } = await supabase
    .from("processing_runs")
    .select("run_id, status")
    .eq("run_id", runId)
    .single();

  if (runError || !run) return { error: "Run not found" };
  if (run.status !== "active") return { error: "Cannot log boxes on a closed run" };

  const { error } = await supabase.from("packed_units").insert({
    org_id: ctx.orgId,
    run_id: runId,
    size_grade: sizeGrade,
    net_weight_kg: netWeightKg,
    box_count: boxCount,
    packing_method: packingMethod,
    packer_id: ctx.userId,
  });

  if (error) return { error: error.message };
  revalidatePath(`/runs/${runId}`);
  return { error: null };
}
