"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logBox } from "./actions";

const SIZE_GRADES = ["14", "16", "18", "20", "22"];
const WEIGHT_PRESETS = ["2", "4", "10"];

export function HandPackButtons({ runId }: { runId: string }) {
  const router = useRouter();
  const [weight, setWeight] = useState(WEIGHT_PRESETS[1]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function tap(sizeGrade: string) {
    setError(null);
    const formData = new FormData();
    formData.set("size_grade", sizeGrade);
    formData.set("net_weight_kg", weight);
    formData.set("box_count", "1");
    formData.set("packing_method", "hand");

    startTransition(async () => {
      const result = await logBox(runId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="card stack">
      <strong>Hand-pack — one tap = one box</strong>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        {SIZE_GRADES.map((size) => (
          <button
            key={size}
            className="button button-primary"
            style={{ minWidth: "4rem" }}
            disabled={isPending}
            onClick={() => tap(size)}
          >
            {size}
          </button>
        ))}
        <button
          className="button button-secondary"
          style={{ minWidth: "4rem" }}
          disabled={isPending}
          onClick={() => tap("MIX")}
        >
          MIX
        </button>
      </div>
      <div className="field" style={{ maxWidth: "10rem" }}>
        <label htmlFor="weight-preset">Box weight</label>
        <select id="weight-preset" value={weight} onChange={(e) => setWeight(e.target.value)}>
          {WEIGHT_PRESETS.map((w) => (
            <option key={w} value={w}>
              {w}kg
            </option>
          ))}
        </select>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
