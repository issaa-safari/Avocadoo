"use client";

import { useActionState, useState } from "react";
import { addRunToPallet, type PalletActionState } from "./actions";

export type AvailableRun = {
  runId: string;
  label: string;
  sizes: { sizeGrade: string; availableBoxes: number }[];
};

const initialState: PalletActionState = { error: null };

export function AddContentsForm({ palletId, runs }: { palletId: string; runs: AvailableRun[] }) {
  const [state, formAction, isPending] = useActionState(addRunToPallet, initialState);
  const [runId, setRunId] = useState(runs[0]?.runId ?? "");

  const selectedRun = runs.find((r) => r.runId === runId);

  return (
    <form className="card stack" action={formAction}>
      <strong>Add from run</strong>
      <input type="hidden" name="pallet_id" value={palletId} />
      <div className="field">
        <label htmlFor="run_id">Run</label>
        <select id="run_id" name="run_id" value={runId} onChange={(e) => setRunId(e.target.value)} required>
          {runs.map((r) => (
            <option key={r.runId} value={r.runId}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="size_grade">Size</label>
        <select id="size_grade" name="size_grade" key={runId} defaultValue={selectedRun?.sizes[0]?.sizeGrade} required>
          {(selectedRun?.sizes ?? []).map((s) => (
            <option key={s.sizeGrade} value={s.sizeGrade}>
              {s.sizeGrade} ({s.availableBoxes} available)
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="box_count">Boxes</label>
        <input id="box_count" name="box_count" type="number" min={1} step={1} required />
      </div>
      {state.error && <p className="error-text">{state.error}</p>}
      <button className="button button-primary" type="submit" disabled={runs.length === 0 || isPending}>
        {isPending ? "Adding…" : "Add to pallet"}
      </button>
      {runs.length === 0 && <p className="muted">No runs have unpalletized boxes right now.</p>}
    </form>
  );
}
