"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logQcCheck } from "./actions";

const DEFECT_OPTIONS = ["Pest", "Bruise", "Rot", "Size mismatch", "Other"];

export function QcCheckForm({ runId }: { runId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [disposition, setDisposition] = useState<"approve" | "hold" | "reject">("approve");
  const [photoCount, setPhotoCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const photoRequired = disposition !== "approve";
  const photoMissing = photoRequired && photoCount === 0;

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await logQcCheck(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(`${disposition === "approve" ? "Approve" : disposition === "hold" ? "Hold" : "Reject"} check logged.`);
      formRef.current?.reset();
      setDisposition("approve");
      setPhotoCount(0);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} className="card stack" action={handleSubmit}>
      <input type="hidden" name="run_id" value={runId} />

      <div className="field">
        <label>Defects</label>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {DEFECT_OPTIONS.map((defect) => (
            <label key={defect} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 400 }}>
              <input type="checkbox" name="defects" value={defect} />
              {defect}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Disposition</label>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          {(["approve", "hold", "reject"] as const).map((d) => (
            <label key={d} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 400 }}>
              <input
                type="radio"
                name="disposition"
                value={d}
                checked={disposition === d}
                onChange={() => setDisposition(d)}
              />
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="photos">
          Photo{photoRequired ? " — required for hold/reject" : " (optional)"}
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotoCount(e.target.files?.length ?? 0)}
        />
        {photoMissing && <p className="error-text">Add at least one photo to submit a {disposition}.</p>}
      </div>

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <input id="notes" name="notes" placeholder="Optional" />
      </div>

      {error && <p className="error-text">{error}</p>}
      {success && <p className="muted">{success}</p>}

      <button className="button button-primary" type="submit" disabled={isPending || photoMissing}>
        {isPending ? "Logging…" : "Log check"}
      </button>
    </form>
  );
}
