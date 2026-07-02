"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type SignUpState } from "./actions";

const initialState: SignUpState = { error: null, checkEmail: false, email: null };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  if (state.checkEmail) {
    return (
      <div className="auth-shell">
        <div className="card">
          <h1 style={{ marginBottom: "0.75rem", fontSize: "1.3rem" }}>Check your email</h1>
          <p className="muted">
            We sent a confirmation link to {state.email}. Click it to finish setting up your
            organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="card">
        <h1 style={{ marginBottom: "1.25rem", fontSize: "1.3rem" }}>Create your organization</h1>
        <form className="stack" action={formAction}>
          <div className="field">
            <label htmlFor="companyName">Company name</label>
            <input id="companyName" name="companyName" type="text" required />
          </div>
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
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          {state.error && <p className="error-text">{state.error}</p>}
          <button className="button button-primary" type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create organization"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1rem" }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
