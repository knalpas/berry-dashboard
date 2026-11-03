"use client";

import { useEffect, useState } from "react";

type ProfilePayload = {
  notes: string;
  tips: string[];
  stats: {
    applications: number;
    contacts: number;
    financeOpen: number;
    hasCv: boolean;
  };
  cv: { headline?: string; skills: string[]; updatedAt: string } | null;
};

export function OverviewTab({
  userName,
  onGo,
}: {
  userName: string;
  onGo: (tab: string) => void;
}) {
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setNotes(d.notes || "");
      });
  }, []);

  async function saveNotes() {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
  }

  if (!data) return <p className="muted">Loading your berry patch…</p>;

  return (
    <div className="tab-stack animate-fade">
      <header className="section-head">
        <h2>Hello, {userName.split(" ")[0]}</h2>
        <p>One place for career moves and life admin — private to your login.</p>
      </header>

      <div className="stat-row">
        <button type="button" className="stat-chip" onClick={() => onGo("jobs")}>
          <span>{data.stats.applications}</span>
          Applications
        </button>
        <button type="button" className="stat-chip" onClick={() => onGo("network")}>
          <span>{data.stats.contacts}</span>
          People leads
        </button>
        <button type="button" className="stat-chip" onClick={() => onGo("admin")}>
          <span>{data.stats.financeOpen}</span>
          Admin open
        </button>
        <button type="button" className="stat-chip" onClick={() => onGo("jobs")}>
          <span>{data.stats.hasCv ? "Yes" : "No"}</span>
          CV profile
        </button>
      </div>

      <section className="panel">
        <h3>Scratchpad</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Weekly priorities, reminders, interview debriefs…"
        />
        <button type="button" className="btn-secondary" onClick={saveNotes}>
          {saving ? "Saving…" : "Save notes"}
        </button>
      </section>

      {data.cv ? (
        <section className="panel">
          <h3>Active profile</h3>
          <p className="muted">
            {data.cv.headline || "CV uploaded"} · updated{" "}
            {new Date(data.cv.updatedAt).toLocaleDateString()}
          </p>
          <div className="tag-wrap">
            {data.cv.skills.slice(0, 10).map((s) => (
              <span key={s} className="tag">
                {s}
              </span>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel callout">
          <h3>Start with your CV</h3>
          <p>
            Upload or paste a CV in Jobs to unlock relevance ranking, tailored cover
            letters, and improvement tips.
          </p>
          <button type="button" className="btn-primary" onClick={() => onGo("jobs")}>
            Open Jobs
          </button>
        </section>
      )}

      {data.tips.length ? (
        <section className="panel">
          <h3>CV advice snapshot</h3>
          <ul className="advice-list">
            {data.tips.slice(0, 4).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
