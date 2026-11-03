"use client";

import { useState } from "react";
import { BerryLogo } from "./BerryLogo";
import { SessionUser } from "@/lib/types";
import { OverviewTab } from "./tabs/OverviewTab";
import { JobsTab } from "./tabs/JobsTab";
import { AdminTab } from "./tabs/AdminTab";
import { NetworkTab } from "./tabs/NetworkTab";
import { DocsTab } from "./tabs/DocsTab";

const TABS = [
  { id: "overview", label: "Home" },
  { id: "jobs", label: "Jobs" },
  { id: "admin", label: "Admin" },
  { id: "network", label: "Network" },
  { id: "docs", label: "Playbook" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Dashboard({
  user,
  onLogout,
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="dash-shell">
      <div className="dash-atmosphere" aria-hidden />
      <header className="dash-top">
        <div className="brand-lockup compact">
          <BerryLogo size={44} className="berry-bob" />
          <div>
            <p className="brand-name">Berry Dashboard</p>
            <p className="brand-tag tiny">
              {user.name}
              {user.role === "admin" ? " · admin" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            onLogout();
          }}
        >
          Sign out
        </button>
      </header>

      <nav className="tab-nav" aria-label="Primary">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "tab-btn active" : "tab-btn"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="dash-main">
        {tab === "overview" ? (
          <OverviewTab userName={user.name} onGo={(id) => setTab(id as TabId)} />
        ) : null}
        {tab === "jobs" ? <JobsTab /> : null}
        {tab === "admin" ? <AdminTab /> : null}
        {tab === "network" ? <NetworkTab /> : null}
        {tab === "docs" ? <DocsTab /> : null}
      </main>
    </div>
  );
}
