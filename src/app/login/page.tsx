"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div className="auth-shell">
      <div className="card">
        <h1 style={{ marginBottom: "1.25rem", fontSize: "1.3rem" }}>Sign in</h1>
        <form className="stack" action={formAction}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state.error && <p className="error-text">{state.error}</p>}
          <button className="button button-primary" type="submit" disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1rem" }}>
          New exporter? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
