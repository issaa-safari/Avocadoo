"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewClose, confirmClose, type ReconciliationPreview } from "./actions";

export function CloseRunForm({ runId }: { runId: string }) {
  const router = useRouter();
  const [qtyRejectedKg, setQtyRejectedKg] = useState("0");
  const [preview, setPreview] = useState<ReconciliationPreview | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnSignoff, setReturnSignoff] = useState("");
  const [returnTransportPlate, setReturnTransportPlate] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCalculate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await previewClose(runId, Number(qtyRejectedKg));
        setPreview(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to calculate reconciliation");
      }
    });
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await confirmClose(runId, {
          qtyRejectedKg: Number(qtyRejectedKg),
          returnReason,
          returnSignoff,
          returnTransportPlate,
          overrideReason,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to close run");
        return;
      }
      router.push(`/runs/${runId}`);
      router.refresh();
    });
  }

  return (
    <div className="stack">
      <div className="card stack">
        <div className="field">
          <label htmlFor="qty_rejected_kg">Rejected (kg)</label>
          <input
            id="qty_rejected_kg"
            type="number"
            min={0}
            step="0.1"
            value={qtyRejectedKg}
            onChange={(e) => {
              setQtyRejectedKg(e.target.value);
              setPreview(null);
            }}
          />
        </div>
        <button className="button button-secondary" type="button" disabled={isPending} onClick={handleCalculate}>
          {isPending ? "Calculating…" : "Calculate reconciliation"}
        </button>
      </div>

      {preview && (
        <div className="card stack">
          <strong>Mass balance: Received = Packed + Rejected + Loss</strong>
          <table className="data-table">
            <tbody>
              <tr>
                <td>Received (A)</td>
                <td>{preview.qtyReceivedKg.toFixed(1)} kg</td>
              </tr>
              <tr>
                <td>Packed (B)</td>
                <td>{preview.qtyPackedKg.toFixed(1)} kg</td>
              </tr>
              <tr>
                <td>Rejected (C)</td>
                <td>{preview.qtyRejectedKg.toFixed(1)} kg</td>
              </tr>
              <tr>
                <td>Actual loss (D = A - B - C)</td>
                <td>{preview.actualLossKg.toFixed(1)} kg</td>
              </tr>
              <tr>
                <td>Expected loss (tolerance)</td>
                <td>{preview.expectedLossKg.toFixed(1)} kg</td>
              </tr>
              <tr>
                <td>Variance</td>
                <td>{preview.varianceKg.toFixed(1)} kg</td>
              </tr>
              <tr>
                <td>Status</td>
                <td>{preview.status === "flagged" ? "⚠ Flagged — out of tolerance" : "✓ Within tolerance"}</td>
              </tr>
            </tbody>
          </table>

          {preview.needsReturn && (
            <div className="stack">
              <strong>Supplier return required before this run can close</strong>
              <div className="field">
                <label htmlFor="return_reason">Rejection reason</label>
                <input
                  id="return_reason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="return_signoff">Supplier signoff (name)</label>
                <input
                  id="return_signoff"
                  value={returnSignoff}
                  onChange={(e) => setReturnSignoff(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="return_transport_plate">Transport plate out (optional)</label>
                <input
                  id="return_transport_plate"
                  value={returnTransportPlate}
                  onChange={(e) => setReturnTransportPlate(e.target.value)}
                />
              </div>
            </div>
          )}

          {preview.status === "flagged" && (
            <div className="field">
              <label htmlFor="override_reason">Manager override reason (required — this run is flagged)</label>
              <input
                id="override_reason"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                required
              />
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          <button className="button button-primary" type="button" disabled={isPending} onClick={handleConfirm}>
            {isPending ? "Closing…" : "Confirm close"}
          </button>
        </div>
      )}

      {!preview && error && <p className="error-text">{error}</p>}
    </div>
  );
}
