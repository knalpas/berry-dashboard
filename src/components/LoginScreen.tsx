"use client";

import { FormEvent, useState } from "react";
import { BerryLogo } from "./BerryLogo";
import { SessionUser } from "@/lib/types";

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
      <section className="login-card">
        <BerryLogo size={56} />
        <h1 className="login-title">Berry</h1>
        <p className="login-sub">Your money and life admin, in one place.</p>

        <form onSubmit={handleSubmit} className="login-form">
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
              autoFocus
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
