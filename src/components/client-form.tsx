"use client";

import { useRef, useState, useTransition } from "react";

/**
 * Form wired to a server action that returns { error }. Shows the returned
 * error inline and resets the form on success. Exists because thrown
 * server-action errors are redacted in production builds — actions must
 * return their messages for the user to ever see them.
 */
export function ClientForm({
  action,
  submitLabel,
  pendingLabel,
  className = "card stack",
  submitClassName = "button button-primary",
  submitDisabled = false,
  children,
}: {
  action: (formData: FormData) => Promise<{ error: string | null }>;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  submitClassName?: string;
  submitDisabled?: boolean;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} className={className} action={handleSubmit}>
      {children}
      {error && <p className="error-text">{error}</p>}
      <button className={submitClassName} type="submit" disabled={submitDisabled || isPending}>
        {isPending ? (pendingLabel ?? "Saving…") : submitLabel}
      </button>
    </form>
  );
}
