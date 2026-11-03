"use client";

import { useEffect, useState } from "react";
import { Contact } from "@/lib/types";

const STATUSES: Contact["status"][] = [
  "to_find",
  "identified",
  "reached_out",
  "replied",
];

export function NetworkTab() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);

  async function load() {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    setContacts(data.contacts || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(id: string, body: Partial<Contact>) {
    const res = await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    const data = await res.json();
    setContacts(data.contacts || []);
    setSelected((data.contacts || []).find((c: Contact) => c.id === id) || null);
  }

  return (
    <div className="tab-stack animate-fade">
      <header className="section-head">
        <h2>Network</h2>
        <p>
          Track hiring managers, recruiters, and peers. Berry seeds search hints and
          outreach drafts from Jobs — you fill real names and contact details.
        </p>
      </header>

      {!contacts.length ? (
        <section className="panel callout">
          <h3>No people leads yet</h3>
          <p>
            In Jobs, open a listing and tap <strong>Find people</strong> to generate
            role targets and message drafts for that company.
          </p>
        </section>
      ) : (
        <div className="split">
          <ul className="simple-list">
            {contacts.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={selected?.id === c.id ? "list-btn active" : "list-btn"}
                  onClick={() => setSelected(c)}
                >
                  <strong>
                    {c.name || c.roleHint} · {c.company}
                  </strong>
                  <span>{c.status.replace("_", " ")}</span>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <div className="panel app-detail">
              <p className="muted">{selected.whyInteresting}</p>
              <label>
                Name
                <input
                  defaultValue={selected.name || ""}
                  onBlur={(e) => patch(selected.id, { name: e.target.value })}
                  placeholder="Full name once identified"
                />
              </label>
              <label>
                Email
                <input
                  defaultValue={selected.email || ""}
                  onBlur={(e) => patch(selected.id, { email: e.target.value })}
                  placeholder="name@company.com"
                />
              </label>
              <label>
                LinkedIn / profile URL
                <input
                  defaultValue={selected.linkedinUrl || ""}
                  onBlur={(e) => patch(selected.id, { linkedinUrl: e.target.value })}
                  placeholder="https://"
                />
              </label>
              <label>
                Status
                <select
                  value={selected.status}
                  onChange={(e) =>
                    patch(selected.id, {
                      status: e.target.value as Contact["status"],
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
                Outreach draft
                <textarea
                  rows={8}
                  defaultValue={selected.outreachDraft || ""}
                  onBlur={(e) =>
                    patch(selected.id, { outreachDraft: e.target.value })
                  }
                />
              </label>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
