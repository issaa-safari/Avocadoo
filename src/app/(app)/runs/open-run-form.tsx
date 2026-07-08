"use client";

import { useActionState } from "react";
import { openRun, type OpenRunState } from "./actions";

type Batch = {
  intake_id: string;
  gross_weight_kg: number;
  variety: string | null;
  suppliers: { name: string } | null;
  farmers: { name: string } | null;
};

const initialState: OpenRunState = { error: null };

export function OpenRunForm({ batches }: { batches: Batch[] }) {
  const [state, formAction, isPending] = useActionState(openRun, initialState);

  return (
    <form className="card stack" action={formAction}>
      <strong>Open run</strong>
      <div className="field">
        <label htmlFor="intake_id">Batch</label>
        <select id="intake_id" name="intake_id" required defaultValue="">
          <option value="" disabled>
            Select a batch
          </option>
          {batches.map((b) => (
            <option key={b.intake_id} value={b.intake_id}>
              {b.suppliers?.name} — {b.farmers?.name} ({b.gross_weight_kg} kg
              {b.variety ? `, ${b.variety}` : ""})
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="station">Table / station</label>
        <input id="station" name="station" placeholder="e.g. Table 1" required />
      </div>
      <div className="field">
        <label htmlFor="packing_method">Method</label>
        <select id="packing_method" name="packing_method" required defaultValue="hand">
          <option value="hand">Hand</option>
          <option value="machine">Machine</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="qty_received_kg">Qty received for this run (kg)</label>
        <input id="qty_received_kg" name="qty_received_kg" type="number" min={0} step="0.1" required />
      </div>
      {state.error && <p className="error-text">{state.error}</p>}
      <button className="button button-primary" type="submit" disabled={batches.length === 0 || isPending}>
        {isPending ? "Opening…" : "Open run"}
      </button>
    </form>
  );
}
