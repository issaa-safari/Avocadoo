"use client";

/**
 * Safety-net error boundary for the authenticated app. Server actions return
 * their errors for inline display, so landing here means something genuinely
 * unexpected happened — show a recoverable screen instead of the raw
 * production digest message.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="stack" style={{ maxWidth: "32rem", margin: "3rem auto", textAlign: "center" }}>
      <h1>Something went wrong</h1>
      <p className="muted">
        The action could not be completed. Your data has not been lost — go back and try again.
        {error.digest ? ` (Error reference: ${error.digest})` : ""}
      </p>
      <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
        <button className="button button-primary" type="button" onClick={reset}>
          Try again
        </button>
        <a className="button button-secondary" href="/dashboard">
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
