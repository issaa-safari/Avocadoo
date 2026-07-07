"use client";

import { useActionState } from "react";
import { splitPallet, type PalletActionState } from "./actions";

export type SplitLine = {
  runId: string;
  sizeGrade: string;
  farmerName: string;
  boxCount: number;
};

const initialState: PalletActionState = { error: null };

export function SplitPalletForm({ palletId, lines }: { palletId: string; lines: SplitLine[] }) {
  const [state, formAction, isPending] = useActionState(splitPallet, initialState);

  return (
    <form className="card stack" action={formAction}>
      <strong>Split pallet (partial pick)</strong>
      <p className="muted">
        Moves boxes to a new pallet. Both fragments stay traceable to the same source runs via the split log.
      </p>
      <input type="hidden" name="pallet_id" value={palletId} />
      <table className="data-table">
        <thead>
          <tr>
            <th>Farmer</th>
            <th>Size</th>
            <th>On pallet</th>
            <th>Boxes to move</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={`${l.runId}|${l.sizeGrade}`}>
              <td>{l.farmerName}</td>
              <td>{l.sizeGrade}</td>
              <td>{l.boxCount}</td>
              <td>
                <input
                  name={`move_${l.runId}_${l.sizeGrade}`}
                  type="number"
                  min={0}
                  max={l.boxCount}
                  step={1}
                  placeholder="0"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="field">
        <label htmlFor="reason">Reason</label>
        <input id="reason" name="reason" placeholder="e.g. Partial pick for order #123" required />
      </div>
      {state.error && <p className="error-text">{state.error}</p>}
      <button className="button button-primary" type="submit" disabled={isPending}>
        {isPending ? "Splitting…" : "Split pallet"}
      </button>
    </form>
  );
}
