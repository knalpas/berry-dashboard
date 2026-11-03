"use client";

import { useEffect, useMemo, useState } from "react";
import { FinanceItem, FinanceItemStatus } from "@/lib/types";

const STATUSES: FinanceItemStatus[] = ["todo", "doing", "done", "n_a"];

export function AdminTab() {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/finance")
      .then((r) => r.json())
      .then((d) => setItems(d.finance || []));
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category)))],
    [items]
  );

  const visible = items.filter(
    (i) => filter === "All" || i.category === filter
  );

  async function patch(id: string, body: Partial<FinanceItem>) {
    const res = await fetch("/api/finance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    const data = await res.json();
    setItems(data.finance || []);
  }

  return (
    <div className="tab-stack animate-fade">
      <header className="section-head">
        <h2>Admin & financials</h2>
        <p>
          A living checklist with advice and official references — tax, health cover,
          pension, investing, and household admin.
        </p>
      </header>

      <div className="filter-row">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={filter === c ? "pill active" : "pill"}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="admin-list">
        {visible.map((item) => {
          const open = openId === item.id;
          return (
            <article key={item.id} className="admin-item">
              <button
                type="button"
                className="admin-item-head"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
              >
                <div>
                  <p className="eyebrow">{item.category}</p>
                  <h3>{item.title}</h3>
                  <p className="muted">{item.description}</p>
                </div>
                <span className={`status-badge status-${item.status}`}>
                  {item.status.replace("_", " ")}
                </span>
              </button>
              {open ? (
                <div className="admin-item-body">
                  <h4>Advice</h4>
                  <p>{item.advice}</p>
                  {item.dueHint ? (
                    <p className="muted">Timing cue: {item.dueHint}</p>
                  ) : null}
                  <h4>References</h4>
                  <ul className="ref-list">
                    {item.references.map((r) => (
                      <li key={r.url}>
                        <a href={r.url} target="_blank" rel="noreferrer">
                          {r.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <label>
                    Status
                    <select
                      value={item.status}
                      onChange={(e) =>
                        patch(item.id, {
                          status: e.target.value as FinanceItemStatus,
                        })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Your notes
                    <textarea
                      rows={3}
                      defaultValue={item.notes || ""}
                      placeholder="Policy numbers, accountant email, next action…"
                      onBlur={(e) => patch(item.id, { notes: e.target.value })}
                    />
                  </label>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
