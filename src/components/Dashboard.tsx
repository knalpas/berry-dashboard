"use client";

import { useCallback, useEffect, useState } from "react";
import { BerryLogo } from "./BerryLogo";
import { SessionUser } from "@/lib/types";
import { FinancialTab } from "./tabs/FinancialTab";
import { AdminTab } from "./tabs/AdminTab";
import { useWorkspace } from "./useWorkspace";
import { Icon } from "./ui";
import { today } from "@/lib/dates";

const TABS = [
  { id: "money", label: "Money", icon: "coins" },
  { id: "admin", label: "Admin", icon: "list" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function readTab(): TabId {
  if (typeof window === "undefined") return "money";
  return window.location.hash === "#admin" ? "admin" : "money";
}

export function Dashboard({
  user,
  onLogout,
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<TabId>("money");
  const signedOut = useCallback(() => onLogout(), [onLogout]);
  const { data, error, send } = useWorkspace(signedOut);

  useEffect(() => {
    setTab(readTab());
    const onHash = () => setTab(readTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function go(id: TabId) {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  }

  const overdue =
    data?.tasks.filter((t) => !t.done && t.dueDate && t.dueDate < today())
      .length ?? 0;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <BerryLogo size={30} />
          <span className="brand-name">Berry</span>
        </div>

        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="tab-btn"
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => go(t.id)}
            >
              <Icon name={t.icon} size={18} />
              <span>{t.label}</span>
              {t.id === "admin" && overdue ? (
                <span className="badge" aria-label={`${overdue} overdue`}>
                  {overdue}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="account">
          <span className="account-name">{user.name.split(" ")[0]}</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              onLogout();
            }}
          >
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <main className="main">
        {error ? <p className="form-error">{error}</p> : null}
        {!data && !error ? (
          <div className="loading" aria-label="Loading" />
        ) : null}
        {data && tab === "money" ? (
          <FinancialTab data={data} send={send} />
        ) : null}
        {data && tab === "admin" ? <AdminTab data={data} send={send} /> : null}
      </main>
    </div>
  );
}
