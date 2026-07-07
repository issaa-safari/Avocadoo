"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

const DEFAULT_LOSS_TOLERANCE_PCT = 2;

export type ReconciliationPreview = {
  qtyReceivedKg: number;
  qtyPackedKg: number;
  qtyRejectedKg: number;
  expectedLossKg: number;
  actualLossKg: number;
  varianceKg: number;
  status: "within_tolerance" | "flagged";
  needsReturn: boolean;
};

async function computePreview(runId: string, qtyRejectedKg: number): Promise<ReconciliationPreview> {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");
  if (!Number.isFinite(qtyRejectedKg) || qtyRejectedKg < 0) {
    throw new Error("Rejected kg must be zero or a positive number");
  }

  const supabase = await createClient();

  const { data: run } = await supabase
    .from("processing_runs")
    .select("run_id, status, qty_received_kg, intake_batches ( variety )")
    .eq("run_id", runId)
    .single();

  if (!run) throw new Error("Run not found");
  if (run.status !== "active") throw new Error("Run is already closed");

  const { data: packedUnits } = await supabase
    .from("packed_units")
    .select("net_weight_kg, box_count")
    .eq("run_id", runId);

  const qtyPackedKg = (packedUnits ?? []).reduce((sum, p) => sum + p.net_weight_kg * p.box_count, 0);
  const qtyReceivedKg = run.qty_received_kg;

  if (qtyRejectedKg > qtyReceivedKg) {
    throw new Error("Rejected kg cannot exceed received kg");
  }

  const variety = run.intake_batches?.variety ?? null;
  let maxLossPct = DEFAULT_LOSS_TOLERANCE_PCT;
  if (variety) {
    const { data: tolerance } = await supabase
      .from("commodity_loss_tolerances")
      .select("max_loss_pct")
      .eq("variety", variety)
      .lte("effective_date", new Date().toISOString().slice(0, 10))
      .order("effective_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (tolerance) maxLossPct = tolerance.max_loss_pct;
  }

  const expectedLossKg = qtyReceivedKg * (maxLossPct / 100);
  const actualLossKg = qtyReceivedKg - qtyPackedKg - qtyRejectedKg;
  const varianceKg = actualLossKg - expectedLossKg;
  const status: ReconciliationPreview["status"] = varianceKg > 0 ? "flagged" : "within_tolerance";

  return {
    qtyReceivedKg,
    qtyPackedKg,
    qtyRejectedKg,
    expectedLossKg,
    actualLossKg,
    varianceKg,
    status,
    needsReturn: qtyRejectedKg > 0,
  };
}

// The exported actions RETURN error strings instead of throwing — thrown
// server-action error messages are redacted in production builds, so they
// can never carry a user-facing validation message to the client in prod.
export type PreviewCloseResult =
  | { error: string; preview: null }
  | { error: null; preview: ReconciliationPreview };

export async function previewClose(runId: string, qtyRejectedKg: number): Promise<PreviewCloseResult> {
  try {
    return { error: null, preview: await computePreview(runId, qtyRejectedKg) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to calculate reconciliation", preview: null };
  }
}

export type ConfirmCloseResult = { error: string | null };

export async function confirmClose(
  runId: string,
  input: {
    qtyRejectedKg: number;
    returnReason?: string;
    returnSignoff?: string;
    returnTransportPlate?: string;
    overrideReason?: string;
  },
): Promise<ConfirmCloseResult> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  let preview: ReconciliationPreview;
  try {
    preview = await computePreview(runId, input.qtyRejectedKg);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to calculate reconciliation" };
  }

  // Re-validate server-side — never trust that the client actually filled in
  // what the preview said was required.
  if (preview.needsReturn && (!input.returnReason?.trim() || !input.returnSignoff?.trim())) {
    return { error: "A supplier return record (reason + signoff) is required before this run can close" };
  }
  if (preview.status === "flagged" && !input.overrideReason?.trim()) {
    return { error: "A documented override reason is required to close a flagged run" };
  }

  const supabase = await createClient();

  const { data: run } = await supabase
    .from("processing_runs")
    .select("run_id, intake_id")
    .eq("run_id", runId)
    .single();
  if (!run) return { error: "Run not found" };

  let returnConfirmationId: string | null = null;
  if (preview.needsReturn) {
    const { data: ret, error: retError } = await supabase
      .from("supplier_returns")
      .insert({
        org_id: ctx.orgId,
        run_id: runId,
        intake_id: run.intake_id,
        qty_returned_kg: preview.qtyRejectedKg,
        rejection_reason_summary: input.returnReason!.trim(),
        supplier_signoff: input.returnSignoff!.trim(),
        transport_plate_out: input.returnTransportPlate?.trim() || null,
        created_by: ctx.userId,
      })
      .select("return_id")
      .single();
    if (retError) return { error: retError.message };
    returnConfirmationId = ret.return_id;
  }

  const recStatus = preview.status === "flagged" ? "manager_override" : "within_tolerance";

  const { error: recError } = await supabase.from("reconciliation_records").insert({
    org_id: ctx.orgId,
    run_id: runId,
    qty_received_kg: preview.qtyReceivedKg,
    qty_packed_kg: preview.qtyPackedKg,
    qty_rejected_kg: preview.qtyRejectedKg,
    expected_loss_kg: preview.expectedLossKg,
    actual_loss_kg: preview.actualLossKg,
    variance_kg: preview.varianceKg,
    status: recStatus,
    override_reason: preview.status === "flagged" ? input.overrideReason!.trim() : null,
    override_by: preview.status === "flagged" ? ctx.userId : null,
    override_datetime: preview.status === "flagged" ? new Date().toISOString() : null,
    rejection_disposition: preview.needsReturn ? "returned_to_supplier" : null,
    return_confirmation_id: returnConfirmationId,
  });
  if (recError) return { error: recError.message };

  const { error: closeError } = await supabase
    .from("processing_runs")
    .update({
      status: "closed",
      qty_packed_kg: preview.qtyPackedKg,
      qty_rejected_kg: preview.qtyRejectedKg,
      closed_by: ctx.userId,
      closed_at: new Date().toISOString(),
    })
    .eq("run_id", runId);
  if (closeError) return { error: closeError.message };

  revalidatePath("/runs");
  revalidatePath(`/runs/${runId}`);
  return { error: null };
}
