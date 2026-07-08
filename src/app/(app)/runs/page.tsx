import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OpenRunForm } from "./open-run-form";

export default async function RunControlPage() {
  const supabase = await createClient();

  const [{ data: activeRuns }, { data: recentBatches }, { data: allPackedUnits }] = await Promise.all([
    supabase
      .from("processing_runs")
      .select("run_id, station, packing_method, qty_received_kg, opened_at, intake_batches ( farmers ( name ) )")
      .eq("status", "active")
      .order("opened_at", { ascending: false }),
    supabase
      .from("intake_batches")
      .select("intake_id, arrival_datetime, gross_weight_kg, variety, suppliers ( name ), farmers ( name )")
      .order("arrival_datetime", { ascending: false })
      .limit(20),
    supabase.from("packed_units").select("run_id, box_count"),
  ]);

  const boxesByRun = new Map<string, number>();
  for (const pu of allPackedUnits ?? []) {
    boxesByRun.set(pu.run_id, (boxesByRun.get(pu.run_id) ?? 0) + pu.box_count);
  }

  return (
    <div className="stack">
      <h1>Run Control</h1>

      <table className="data-table">
        <thead>
          <tr>
            <th>Station</th>
            <th>Farmer</th>
            <th>Method</th>
            <th>Received (kg)</th>
            <th>Boxes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(activeRuns ?? []).map((r) => (
            <tr key={r.run_id}>
              <td>{r.station}</td>
              <td>{r.intake_batches?.farmers?.name ?? "—"}</td>
              <td>{r.packing_method}</td>
              <td>{r.qty_received_kg}</td>
              <td>{boxesByRun.get(r.run_id) ?? 0}</td>
              <td>
                <Link className="button button-secondary" href={`/runs/${r.run_id}`}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
          {(activeRuns ?? []).length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No active runs. Open one below.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <OpenRunForm batches={recentBatches ?? []} />
    </div>
  );
}
