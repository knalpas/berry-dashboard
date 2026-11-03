"use client";

import { useEffect, useState } from "react";
import { SessionUser } from "@/lib/types";
import { LoginScreen } from "./LoginScreen";
import { Dashboard } from "./Dashboard";

export function AppClient() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) return null;
        const data = await r.json();
        return data.user as SessionUser;
      })
      .then((u) => setUser(u))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <main className="boot-shell">
        <p className="muted">Opening Berry…</p>
      </main>
    );
  }

  if (!user) return <LoginScreen onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
