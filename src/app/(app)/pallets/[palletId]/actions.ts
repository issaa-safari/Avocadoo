"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";
import { getAvailableBySize, getCurrentContents } from "@/lib/pallets";

export type PalletActionState = { error: string | null };

async function getOpenPallet(palletId: string) {
  const supabase = await createClient();
  const { data: pallet } = await supabase
    .from("pallets")
    .select("pallet_id, status")
    .eq("pallet_id", palletId)
    .single();
  if (!pallet) throw new Error("Pallet not found");
  return pallet;
}

export async function addRunToPallet(
  _prevState: PalletActionState,
  formData: FormData,
): Promise<PalletActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const palletId = String(formData.get("pallet_id") ?? "");
  const runId = String(formData.get("run_id") ?? "");
  const sizeGrade = String(formData.get("size_grade") ?? "").trim();
  const boxCount = Number(formData.get("box_count"));

  if (!palletId || !runId || !sizeGrade) return { error: "Run and size are required" };
  if (!Number.isInteger(boxCount) || boxCount <= 0) return { error: "Box count must be a positive whole number" };

  try {
    const pallet = await getOpenPallet(palletId);
    if (pallet.status !== "open") return { error: "This pallet is closed — open a new one" };

    const supabase = await createClient();

    // RECON-001: a flagged run cannot proceed to palletization. Runs can only
    // close as within_tolerance or manager_override today, so this guards the
    // future path where a flagged reconciliation exists without an override.
    const { data: recon } = await supabase
      .from("reconciliation_records")
      .select("status")
      .eq("run_id", runId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recon?.status === "flagged") {
      return { error: "This run is flagged out of tolerance — it cannot be palletized without a manager override on its reconciliation" };
    }

    const available = await getAvailableBySize(runId);
    const slot = available.get(sizeGrade);
    if (!slot || slot.boxes < boxCount) {
      return {
        error: `Only ${slot?.boxes ?? 0} unpalletized box(es) of size ${sizeGrade} remain on this run`,
      };
    }

    const { error } = await supabase.from("pallet_run_contents").insert({
      org_id: ctx.orgId,
      pallet_id: palletId,
      run_id: runId,
      size_grade: sizeGrade,
      box_count: boxCount,
      total_weight_kg: Math.round(slot.kgPerBox * boxCount * 100) / 100,
      added_by: ctx.userId,
    });
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add boxes" };
  }

  revalidatePath(`/pallets/${palletId}`);
  return { error: null };
}

export async function closePallet(palletId: string): Promise<PalletActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  try {
    const pallet = await getOpenPallet(palletId);
    if (pallet.status !== "open") return { error: "Pallet is already closed" };

    const contents = await getCurrentContents(palletId);
    if (contents.length === 0) return { error: "Cannot close an empty pallet" };

    const supabase = await createClient();
    const { error } = await supabase
      .from("pallets")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("pallet_id", palletId);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to close pallet" };
  }

  revalidatePath(`/pallets/${palletId}`);
  revalidatePath("/pallets");
  return { error: null };
}

export async function assignColdRoom(palletId: string, coldRoomId: string): Promise<PalletActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pallets")
    .update({ cold_room_id: coldRoomId || null })
    .eq("pallet_id", palletId);
  if (error) return { error: error.message };

  revalidatePath(`/pallets/${palletId}`);
  revalidatePath("/pallets");
  return { error: null };
}

export async function splitPallet(
  _prevState: PalletActionState,
  formData: FormData,
): Promise<PalletActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const palletId = String(formData.get("pallet_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason for the split is required" };

  let newPalletId: string | null = null;
  try {
    const pallet = await getOpenPallet(palletId);
    if (pallet.status !== "closed") {
      return { error: "Only a closed pallet can be split (partial pick)" };
    }

    const contents = await getCurrentContents(palletId);
    const moves: { runId: string; sizeGrade: string; boxCount: number; weightKg: number }[] = [];
    for (const line of contents) {
      const raw = formData.get(`move_${line.runId}_${line.sizeGrade}`);
      const move = raw === null || String(raw).trim() === "" ? 0 : Number(raw);
      if (!Number.isInteger(move) || move < 0) {
        return { error: `Boxes to move for size ${line.sizeGrade} must be a whole number` };
      }
      if (move > line.boxCount) {
        return { error: `Only ${line.boxCount} box(es) of size ${line.sizeGrade} are on this pallet` };
      }
      if (move > 0) {
        const kgPerBox = line.totalWeightKg / line.boxCount;
        moves.push({
          runId: line.runId,
          sizeGrade: line.sizeGrade,
          boxCount: move,
          weightKg: Math.round(kgPerBox * move * 100) / 100,
        });
      }
    }
    if (moves.length === 0) return { error: "Enter at least one box to move" };

    const supabase = await createClient();

    const { data: newPallet, error: palletError } = await supabase
      .from("pallets")
      .insert({
        org_id: ctx.orgId,
        status: "closed",
        built_by: ctx.userId,
        closed_at: new Date().toISOString(),
      })
      .select("pallet_id")
      .single();
    if (palletError) return { error: palletError.message };
    const createdPalletId: string = newPallet.pallet_id;
    newPalletId = createdPalletId;

    const { data: split, error: splitError } = await supabase
      .from("pallet_split_log")
      .insert({
        org_id: ctx.orgId,
        original_pallet_id: palletId,
        new_pallet_id: createdPalletId,
        reason,
        split_by: ctx.userId,
      })
      .select("split_id")
      .single();
    if (splitError) return { error: splitError.message };

    const { error: contentsError } = await supabase.from("pallet_run_contents").insert(
      moves.map((m) => ({
        org_id: ctx.orgId,
        pallet_id: createdPalletId,
        run_id: m.runId,
        size_grade: m.sizeGrade,
        box_count: m.boxCount,
        total_weight_kg: m.weightKg,
        split_id: split.split_id,
        added_by: ctx.userId,
      })),
    );
    if (contentsError) return { error: contentsError.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to split pallet" };
  }

  if (!newPalletId) return { error: "Failed to split pallet" };

  revalidatePath(`/pallets/${palletId}`);
  revalidatePath("/pallets");
  redirect(`/pallets/${newPalletId}`);
}
