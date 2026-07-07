import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAvailableBySize, getCurrentContents } from "@/lib/pallets";
import { AddContentsForm, type AvailableRun } from "./add-contents-form";
import { SplitPalletForm, type SplitLine } from "./split-pallet-form";
import { assignColdRoom, closePallet } from "./actions";

export default async function PalletDetailPage({ params }: { params: Promise<{ palletId: string }> }) {
  const { palletId } = await params;
  const supabase = await createClient();

  const { data: pallet } = await supabase
    .from("pallets")
    .select("pallet_id, pallet_code, status, cold_room_id, build_datetime, closed_at, cold_rooms ( name )")
    .eq("pallet_id", palletId)
    .single();

  if (!pallet) notFound();

  const [contents, { data: coldRooms }] = await Promise.all([
    getCurrentContents(palletId),
    supabase.from("cold_rooms").select("cold_room_id, name").order("name"),
  ]);

  // Farmer/supplier attribution for every run on the pallet (and for the
  // add-from-run list below) in one query.
  const { data: allRuns } = await supabase
    .from("processing_runs")
    .select("run_id, station, status, intake_batches ( farmers ( name ), suppliers ( name ) )")
    .order("opened_at", { ascending: false });

  const runMeta = new Map(
    (allRuns ?? []).map((r) => [
      r.run_id,
      {
        station: r.station,
        status: r.status,
        farmerName: r.intake_batches?.farmers?.name ?? "Unknown farmer",
        supplierName: r.intake_batches?.suppliers?.name ?? "Unknown supplier",
      },
    ]),
  );

  const totalBoxes = contents.reduce((sum, l) => sum + l.boxCount, 0);
  const totalWeight = contents.reduce((sum, l) => sum + l.totalWeightKg, 0);

  // Per-run contribution — blended pallets attribute origin by share, never
  // to a single farmer (plan §"Blended pallets/runs").
  const byRun = new Map<string, { boxes: number; weight: number }>();
  for (const l of contents) {
    const cur = byRun.get(l.runId) ?? { boxes: 0, weight: 0 };
    cur.boxes += l.boxCount;
    cur.weight += l.totalWeightKg;
    byRun.set(l.runId, cur);
  }

  let availableRuns: AvailableRun[] = [];
  if (pallet.status === "open") {
    availableRuns = (
      await Promise.all(
        (allRuns ?? []).map(async (r) => {
          const available = await getAvailableBySize(r.run_id);
          if (available.size === 0) return null;
          const meta = runMeta.get(r.run_id)!;
          return {
            runId: r.run_id,
            label: `${meta.farmerName} (${meta.station}${meta.status === "active" ? ", active" : ""})`,
            sizes: Array.from(available.entries()).map(([sizeGrade, v]) => ({
              sizeGrade,
              availableBoxes: v.boxes,
            })),
          };
        }),
      )
    ).filter((r): r is AvailableRun => r !== null);
  }

  const splitLines: SplitLine[] = contents.map((l) => ({
    runId: l.runId,
    sizeGrade: l.sizeGrade,
    farmerName: runMeta.get(l.runId)?.farmerName ?? "Unknown farmer",
    boxCount: l.boxCount,
  }));

  // Split history in both directions, so each fragment shows its lineage.
  const { data: splits } = await supabase
    .from("pallet_split_log")
    .select("split_id, original_pallet_id, new_pallet_id, reason, split_datetime")
    .or(`original_pallet_id.eq.${palletId},new_pallet_id.eq.${palletId}`)
    .order("split_datetime", { ascending: false });

  const otherPalletIds = Array.from(
    new Set(
      (splits ?? []).flatMap((s) => [s.original_pallet_id, s.new_pallet_id]).filter((id) => id !== palletId),
    ),
  );
  const { data: otherPallets } = otherPalletIds.length
    ? await supabase.from("pallets").select("pallet_id, pallet_code").in("pallet_id", otherPalletIds)
    : { data: [] };
  const codeById = new Map((otherPallets ?? []).map((p) => [p.pallet_id, p.pallet_code]));

  return (
    <div className="stack">
      <h1>Pallet {pallet.pallet_code}</h1>
      <p className="muted">
        status: {pallet.status} · built {new Date(pallet.build_datetime).toLocaleString()}
        {pallet.closed_at ? ` · closed ${new Date(pallet.closed_at).toLocaleString()}` : ""}
      </p>

      <div className="card stack">
        <strong>
          Contents — {totalBoxes} boxes / {totalWeight.toFixed(1)} kg
        </strong>
        <table className="data-table">
          <thead>
            <tr>
              <th>Farmer</th>
              <th>Supplier</th>
              <th>Size</th>
              <th>Boxes</th>
              <th>Weight (kg)</th>
              <th>Contribution</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((l) => {
              const meta = runMeta.get(l.runId);
              const runTotal = byRun.get(l.runId)!;
              return (
                <tr key={`${l.runId}|${l.sizeGrade}`}>
                  <td>{meta?.farmerName ?? "—"}</td>
                  <td>{meta?.supplierName ?? "—"}</td>
                  <td>{l.sizeGrade}</td>
                  <td>{l.boxCount}</td>
                  <td>{l.totalWeightKg.toFixed(1)}</td>
                  <td>{totalWeight > 0 ? `${((runTotal.weight / totalWeight) * 100).toFixed(0)}% (run)` : "—"}</td>
                </tr>
              );
            })}
            {contents.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Nothing on this pallet yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card stack">
        <strong>Cold room</strong>
        <form
          action={async (formData) => {
            "use server";
            await assignColdRoom(palletId, String(formData.get("cold_room_id") ?? ""));
          }}
          className="stack"
        >
          <div className="field">
            <select name="cold_room_id" defaultValue={pallet.cold_room_id ?? ""}>
              <option value="">— not in cold storage —</option>
              {(coldRooms ?? []).map((c) => (
                <option key={c.cold_room_id} value={c.cold_room_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button className="button button-secondary" type="submit">
            Move
          </button>
        </form>
      </div>

      {pallet.status === "open" && (
        <>
          <AddContentsForm palletId={palletId} runs={availableRuns} />
          {contents.length > 0 && (
            <form
              action={async () => {
                "use server";
                await closePallet(palletId);
              }}
            >
              <button className="button button-primary" type="submit">
                Close pallet
              </button>
            </form>
          )}
        </>
      )}

      {pallet.status === "closed" && (
        <>
          <div className="card stack">
            <strong>Pallet summary label</strong>
            <p>
              {pallet.pallet_code} · {totalBoxes} boxes · {totalWeight.toFixed(1)} kg
            </p>
            <ul>
              {Array.from(byRun.entries()).map(([runId, v]) => {
                const meta = runMeta.get(runId);
                return (
                  <li key={runId}>
                    {meta?.farmerName} ({meta?.supplierName}) — {v.boxes} boxes,{" "}
                    {totalWeight > 0 ? ((v.weight / totalWeight) * 100).toFixed(0) : 0}%
                  </li>
                );
              })}
            </ul>
            <p className="muted">
              Sizes:{" "}
              {contents
                .map((l) => `${l.sizeGrade}×${l.boxCount}`)
                .join(" · ") || "—"}
            </p>
          </div>
          {contents.length > 0 && <SplitPalletForm palletId={palletId} lines={splitLines} />}
        </>
      )}

      {(splits ?? []).length > 0 && (
        <div className="card stack">
          <strong>Split history</strong>
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Direction</th>
                <th>Other pallet</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {(splits ?? []).map((s) => {
                const outbound = s.original_pallet_id === palletId;
                const otherId = outbound ? s.new_pallet_id : s.original_pallet_id;
                return (
                  <tr key={s.split_id}>
                    <td>{new Date(s.split_datetime).toLocaleString()}</td>
                    <td>{outbound ? "Split out to" : "Split off from"}</td>
                    <td>
                      <a href={`/pallets/${otherId}`}>{codeById.get(otherId) ?? otherId}</a>
                    </td>
                    <td>{s.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
