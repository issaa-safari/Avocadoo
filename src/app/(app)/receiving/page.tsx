import { createClient } from "@/lib/supabase/server";
import { ReceivingForm } from "./receiving-form";

export default async function ReceivingPage() {
  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const [{ data: suppliers }, { data: farmers }, { data: todayIntakes }, { data: recentIntakes }] =
    await Promise.all([
      supabase.from("suppliers").select("supplier_id, name").order("name"),
      supabase
        .from("farmers")
        .select("farmer_id, name, supplier_id, farm_id, farms ( name )")
        .order("name"),
      supabase
        .from("intake_batches")
        .select("gross_weight_kg")
        .gte("arrival_datetime", startOfToday.toISOString()),
      supabase
        .from("intake_batches")
        .select("intake_id, arrival_datetime, gross_weight_kg, bin_count, suppliers ( name ), farmers ( name )")
        .order("arrival_datetime", { ascending: false })
        .limit(10),
    ]);

  const todayCount = todayIntakes?.length ?? 0;
  const todayKg = (todayIntakes ?? []).reduce((sum, r) => sum + Number(r.gross_weight_kg), 0);

  // RECON-003: batch-level rollup — once every run against a batch is
  // closed, sum(processing_runs.qty_received_kg) should reconcile against
  // intake_batches.gross_weight_kg.
  const intakeIds = (recentIntakes ?? []).map((i) => i.intake_id);
  const { data: runsForIntakes } = intakeIds.length
    ? await supabase
        .from("processing_runs")
        .select("intake_id, status, qty_received_kg")
        .in("intake_id", intakeIds)
    : { data: [] };

  const batchStatus = new Map<string, "no_runs" | "in_progress" | "reconciled" | "flagged">();
  for (const intake of recentIntakes ?? []) {
    const runs = (runsForIntakes ?? []).filter((r) => r.intake_id === intake.intake_id);
    if (runs.length === 0) {
      batchStatus.set(intake.intake_id, "no_runs");
      continue;
    }
    if (runs.some((r) => r.status !== "closed")) {
      batchStatus.set(intake.intake_id, "in_progress");
      continue;
    }
    const sumReceived = runs.reduce((sum, r) => sum + r.qty_received_kg, 0);
    const tolerance = Math.max(intake.gross_weight_kg * 0.01, 0.5);
    batchStatus.set(
      intake.intake_id,
      Math.abs(sumReceived - intake.gross_weight_kg) <= tolerance ? "reconciled" : "flagged",
    );
  }

  const batchStatusLabel: Record<string, string> = {
    no_runs: "—",
    in_progress: "Runs in progress",
    reconciled: "✓ Reconciled",
    flagged: "⚠ Flagged",
  };

  return (
    <div className="stack">
      <h1>Receiving — New Delivery</h1>

      <ReceivingForm suppliers={suppliers ?? []} farmers={farmers ?? []} />

      <p className="muted">
        Today&apos;s intakes: {todayCount} batches · {todayKg.toLocaleString()} kg
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Arrived</th>
            <th>Supplier</th>
            <th>Farmer</th>
            <th>Crates</th>
            <th>Gross kg</th>
            <th>Reconciliation</th>
          </tr>
        </thead>
        <tbody>
          {(recentIntakes ?? []).map((i) => (
            <tr key={i.intake_id}>
              <td>{new Date(i.arrival_datetime).toLocaleString()}</td>
              <td>{i.suppliers?.name ?? "—"}</td>
              <td>{i.farmers?.name ?? "—"}</td>
              <td>{i.bin_count ?? "—"}</td>
              <td>{i.gross_weight_kg}</td>
              <td>{batchStatusLabel[batchStatus.get(i.intake_id) ?? "no_runs"]}</td>
            </tr>
          ))}
          {(recentIntakes ?? []).length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No intakes logged yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
