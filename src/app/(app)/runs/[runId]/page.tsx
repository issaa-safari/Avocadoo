import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HandPackButtons } from "./hand-pack-buttons";
import { MachineEntryForm } from "./machine-entry-form";

export default async function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const supabase = await createClient();

  const { data: run } = await supabase
    .from("processing_runs")
    .select(
      "run_id, station, packing_method, status, qty_received_kg, opened_at, intake_batches ( farmers ( name ), suppliers ( name ) )",
    )
    .eq("run_id", runId)
    .single();

  if (!run) notFound();

  const { data: packedUnits } = await supabase
    .from("packed_units")
    .select("size_grade, net_weight_kg, box_count")
    .eq("run_id", runId)
    .order("created_at", { ascending: false });

  const totalBoxes = (packedUnits ?? []).reduce((sum, p) => sum + p.box_count, 0);
  const totalWeight = (packedUnits ?? []).reduce((sum, p) => sum + p.box_count * p.net_weight_kg, 0);

  const bySize = new Map<string, { boxes: number; weight: number }>();
  for (const p of packedUnits ?? []) {
    const cur = bySize.get(p.size_grade) ?? { boxes: 0, weight: 0 };
    cur.boxes += p.box_count;
    cur.weight += p.box_count * p.net_weight_kg;
    bySize.set(p.size_grade, cur);
  }

  return (
    <div className="stack">
      <h1>
        {run.station} · {run.intake_batches?.farmers?.name ?? "Unknown farmer"}
      </h1>
      <p className="muted">
        {run.intake_batches?.suppliers?.name} · {run.packing_method} · status: {run.status} · received{" "}
        {run.qty_received_kg} kg
      </p>

      {run.status === "active" ? (
        run.packing_method === "hand" ? (
          <HandPackButtons runId={run.run_id} />
        ) : (
          <MachineEntryForm runId={run.run_id} />
        )
      ) : (
        <p className="muted">This run is closed.</p>
      )}

      <div className="card">
        <strong>
          Boxes this run: {totalBoxes} ({totalWeight.toFixed(1)} kg)
        </strong>
        <table className="data-table" style={{ marginTop: "0.75rem" }}>
          <thead>
            <tr>
              <th>Size</th>
              <th>Boxes</th>
              <th>Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(bySize.entries()).map(([size, v]) => (
              <tr key={size}>
                <td>{size}</td>
                <td>{v.boxes}</td>
                <td>{v.weight.toFixed(1)}</td>
              </tr>
            ))}
            {bySize.size === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  No boxes logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {run.status === "active" && (
        <Link className="button button-primary" href={`/runs/${run.run_id}/close`}>
          Close run
        </Link>
      )}
    </div>
  );
}
