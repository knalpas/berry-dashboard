"use client";

import { FormEvent, useState } from "react";
import { BerryLogo } from "./BerryLogo";
import { SessionUser } from "@/lib/types";

export function LoginScreen({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [email, setEmail] = useState("karl@berry.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLogin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <div className="login-atmosphere" aria-hidden />
      <section className="login-panel animate-rise">
        <div className="brand-lockup">
          <BerryLogo size={72} className="berry-bob" />
          <div>
            <p className="brand-name">Berry Dashboard</p>
            <p className="brand-tag">Personal admin for work, money, and next moves.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Enter dashboard"}
          </button>
        </form>

        <p className="login-hint">
          Credentials live in <code>data/CREDENTIALS.txt</code> on the server. Each
          account keeps its own CV, jobs, and finance list.
        </p>
      </section>
    </main>
  );
}
