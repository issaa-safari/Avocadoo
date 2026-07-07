import { createClient } from "@/lib/supabase/server";

export type PalletContentLine = {
  runId: string;
  sizeGrade: string;
  boxCount: number;
  totalWeightKg: number;
};

function key(runId: string, sizeGrade: string) {
  return `${runId}|${sizeGrade}`;
}

/**
 * Current contents of a pallet = its own pallet_run_contents rows minus rows
 * moved out via splits. Content rows are immutable (the plan's immutability
 * rule explicitly covers pallet contents), so a split never edits the
 * original pallet's rows — moved quantities live on the new pallet tagged
 * with split_id, and this computes the net.
 */
export async function getCurrentContents(palletId: string): Promise<PalletContentLine[]> {
  const supabase = await createClient();

  const [{ data: ownRows }, { data: splits }] = await Promise.all([
    supabase
      .from("pallet_run_contents")
      .select("run_id, size_grade, box_count, total_weight_kg")
      .eq("pallet_id", palletId),
    supabase.from("pallet_split_log").select("split_id").eq("original_pallet_id", palletId),
  ]);

  const byLine = new Map<string, PalletContentLine>();
  for (const r of ownRows ?? []) {
    const k = key(r.run_id, r.size_grade);
    const cur = byLine.get(k) ?? { runId: r.run_id, sizeGrade: r.size_grade, boxCount: 0, totalWeightKg: 0 };
    cur.boxCount += r.box_count;
    cur.totalWeightKg += r.total_weight_kg;
    byLine.set(k, cur);
  }

  const splitIds = (splits ?? []).map((s) => s.split_id);
  if (splitIds.length > 0) {
    const { data: movedOut } = await supabase
      .from("pallet_run_contents")
      .select("run_id, size_grade, box_count, total_weight_kg")
      .in("split_id", splitIds);
    for (const r of movedOut ?? []) {
      const cur = byLine.get(key(r.run_id, r.size_grade));
      if (cur) {
        cur.boxCount -= r.box_count;
        cur.totalWeightKg -= r.total_weight_kg;
      }
    }
  }

  return Array.from(byLine.values()).filter((l) => l.boxCount > 0);
}

/**
 * Boxes of a run (by size) still available to palletize = boxes packed minus
 * boxes already placed on any pallet. Split-fragment rows (split_id set) are
 * relocations of already-palletized boxes, not new allocations from the
 * line, so they are excluded from the palletized total.
 */
export async function getAvailableBySize(runId: string): Promise<Map<string, { boxes: number; kgPerBox: number }>> {
  const supabase = await createClient();

  const [{ data: packed }, { data: palletized }] = await Promise.all([
    supabase.from("packed_units").select("size_grade, net_weight_kg, box_count").eq("run_id", runId),
    supabase
      .from("pallet_run_contents")
      .select("size_grade, box_count")
      .eq("run_id", runId)
      .is("split_id", null),
  ]);

  const bySize = new Map<string, { boxes: number; weight: number }>();
  for (const p of packed ?? []) {
    const cur = bySize.get(p.size_grade) ?? { boxes: 0, weight: 0 };
    cur.boxes += p.box_count;
    cur.weight += p.box_count * p.net_weight_kg;
    bySize.set(p.size_grade, cur);
  }

  const result = new Map<string, { boxes: number; kgPerBox: number }>();
  for (const [size, v] of bySize) {
    result.set(size, { boxes: v.boxes, kgPerBox: v.boxes > 0 ? v.weight / v.boxes : 0 });
  }
  for (const r of palletized ?? []) {
    const cur = result.get(r.size_grade);
    if (cur) cur.boxes -= r.box_count;
  }
  for (const [size, v] of result) {
    if (v.boxes <= 0) result.delete(size);
  }
  return result;
}
