"use client";

import { useState, useTransition } from "react";

/**
 * Button wired to a (pre-bound) server action that returns { error }.
 * Displays the returned error inline instead of crashing the page —
 * thrown server-action errors are redacted in production builds.
 */
export function ActionButton({
  action,
  label,
  pendingLabel,
  className = "button button-secondary",
}: {
  action: () => Promise<{ error: string | null }>;
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div>
      <button className={className} type="button" disabled={isPending} onClick={handleClick}>
        {isPending ? (pendingLabel ?? "…") : label}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
