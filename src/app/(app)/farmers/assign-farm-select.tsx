"use client";

import { useState, useTransition } from "react";
import { assignFarmToFarmer } from "./actions";

type Farm = { farm_id: string; name: string };

/** Inline fix-up for farmers created without a farm — receiving is blocked
 * until every farmer traces to a farm. */
export function AssignFarmSelect({ farmerId, farms }: { farmerId: string; farms: Farm[] }) {
  const [farmId, setFarmId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAssign() {
    setError(null);
    startTransition(async () => {
      const result = await assignFarmToFarmer(farmerId, farmId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
      <span className="error-text">⚠ no farm</span>
      <select value={farmId} onChange={(e) => setFarmId(e.target.value)}>
        <option value="">assign…</option>
        {farms.map((f) => (
          <option key={f.farm_id} value={f.farm_id}>
            {f.name}
          </option>
        ))}
      </select>
      <button
        className="button button-secondary"
        type="button"
        disabled={!farmId || isPending}
        onClick={handleAssign}
      >
        {isPending ? "Saving…" : "Set"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
