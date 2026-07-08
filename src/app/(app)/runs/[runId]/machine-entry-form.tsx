"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logBox } from "./actions";

export function MachineEntryForm({ runId }: { runId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("packing_method", "machine");

    startTransition(async () => {
      try {
        await logBox(runId, formData);
        router.refresh();
        e.currentTarget?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to log boxes");
      }
    });
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <strong>Machine-line intake — bulk entry by size</strong>
      <div style={{ display: "flex", gap: "0.8rem" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="size_grade">Size grade</label>
          <input id="size_grade" name="size_grade" required placeholder="e.g. 18" />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="net_weight_kg">Box weight (kg)</label>
          <input id="net_weight_kg" name="net_weight_kg" type="number" min={0} step="0.1" required />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="box_count">Box count</label>
          <input id="box_count" name="box_count" type="number" min={1} step={1} required />
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <button className="button button-primary" type="submit" disabled={isPending}>
        {isPending ? "Logging…" : "Log boxes"}
      </button>
    </form>
  );
}
