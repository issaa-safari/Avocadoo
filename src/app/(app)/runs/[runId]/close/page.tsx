import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CloseRunForm } from "./close-run-form";

export default async function CloseRunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const supabase = await createClient();

  const { data: run } = await supabase
    .from("processing_runs")
    .select("run_id, station, status, intake_batches ( farmers ( name ) )")
    .eq("run_id", runId)
    .single();

  if (!run) notFound();

  if (run.status !== "active") {
    return (
      <div className="stack">
        <h1>Close run</h1>
        <p className="muted">This run is already closed.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <h1>
        Close run — {run.station} · {run.intake_batches?.farmers?.name ?? "Unknown farmer"}
      </h1>
      <CloseRunForm runId={run.run_id} />
    </div>
  );
}
