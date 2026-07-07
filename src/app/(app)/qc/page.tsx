import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QcCheckForm } from "./qc-check-form";

export default async function QcPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const { run: selectedRunId } = await searchParams;
  const supabase = await createClient();

  const { data: activeRuns } = await supabase
    .from("processing_runs")
    .select("run_id, station, packing_method, intake_batches ( farmers ( name ), suppliers ( name ) )")
    .eq("status", "active")
    .order("opened_at", { ascending: false });

  const run = (activeRuns ?? []).find((r) => r.run_id === selectedRunId) ?? null;

  const { data: checks } = run
    ? await supabase
        .from("qc_checks")
        .select("qc_check_id, disposition, defects, notes, created_at")
        .eq("run_id", run.run_id)
        .order("created_at", { ascending: false })
    : { data: null };

  const tally = { approve: 0, hold: 0, reject: 0 };
  for (const c of checks ?? []) {
    tally[c.disposition as keyof typeof tally] += 1;
  }

  return (
    <div className="stack">
      <h1>QC — Packed Box Check</h1>

      {(activeRuns ?? []).length === 0 ? (
        <p className="muted">
          No active runs. QC checks log against a station&apos;s active run — open one in{" "}
          <Link href="/runs">Run Control</Link> first.
        </p>
      ) : (
        <div className="card stack">
          <strong>Active run</strong>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {(activeRuns ?? []).map((r) => (
              <Link
                key={r.run_id}
                className={`button ${r.run_id === run?.run_id ? "button-primary" : "button-secondary"}`}
                href={`/qc?run=${r.run_id}`}
              >
                {r.station} · {r.intake_batches?.farmers?.name ?? "Unknown farmer"}
              </Link>
            ))}
          </div>
        </div>
      )}

      {run && (
        <>
          <p className="muted">
            {run.station} · {run.intake_batches?.suppliers?.name} · {run.intake_batches?.farmers?.name} ·{" "}
            {run.packing_method} — checks this run: {tally.approve} approve / {tally.hold} hold /{" "}
            {tally.reject} reject
          </p>

          <QcCheckForm runId={run.run_id} />

          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Disposition</th>
                <th>Defects</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {(checks ?? []).map((c) => (
                <tr key={c.qc_check_id}>
                  <td>{new Date(c.created_at).toLocaleTimeString()}</td>
                  <td>{c.disposition}</td>
                  <td>{c.defects.length > 0 ? c.defects.join(", ") : "—"}</td>
                  <td>{c.notes ?? "—"}</td>
                </tr>
              ))}
              {(checks ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    No checks logged for this run yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
