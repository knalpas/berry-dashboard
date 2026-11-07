"use client";

import { FormEvent, useState } from "react";
import { BerryLogo } from "./BerryLogo";
import { SessionUser } from "@/lib/types";

/* Decorative only: the same spending bar the Money tab draws, with made-up proportions. */
const FLOW = [
  { cls: "seg-0", grow: 38 },
  { cls: "seg-1", grow: 7 },
  { cls: "seg-2", grow: 9 },
  { cls: "seg-3", grow: 6 },
  { cls: "seg-4", grow: 4 },
  { cls: "seg-saved", grow: 14 },
  { cls: "seg-left", grow: 22 },
];

export function LoginScreen({
  onLogin,
}: {
  onLogin: (user: SessionUser) => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          res.status === 401
            ? "That email and password don't match."
            : data.error,
        );
      onLogin(data.user);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't sign in. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <section className="login-hero">
        <div className="login-brand">
          <BerryLogo size={40} />
          <span>Berry</span>
        </div>
        <div className="login-pitch">
          <h1 className="login-headline">
            Where your money went, and what&apos;s due next.
          </h1>
          <div className="login-flow" aria-hidden>
            {FLOW.map((s, i) => (
              <span
                key={i}
                className={`flow-seg ${s.cls}`}
                style={{ flexGrow: s.grow, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
          <p className="login-sub">
            Spending, bills, budgets and goals on one side. Tax, pension and
            life admin on the other.
          </p>
        </div>
      </section>

      <section className="login-panel">
        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="login-title">Sign in</h2>
          <label className="field wide">
            <span className="field-label">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              defaultValue="karl@berry.local"
              required
            />
          </label>
          <label className="field wide">
            <span className="field-label">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
