"use client";

const DOCS = [
  {
    title: "How personal data works here",
    body: "Berry Dashboard stores each user’s CV, applications, contacts, finance checklist, and notes in a local server file (data/store.json). Accounts are isolated by user id. This repo is not shared multi-tenant SaaS — deploy your own instance or keep the data directory private.",
  },
  {
    title: "Job sources & compliance",
    body: "Listings are pulled from public APIs (Remotive, Arbeitnow). LinkedIn and Indeed are not scraped. Use Apply Assist to draft materials, then submit on the employer’s official apply page. That keeps you inside platform terms and reduces account-ban risk.",
  },
  {
    title: "Suggested weekly rhythm",
    body: "Mon: refresh job search + rank. Tue/Wed: 3 tailored applications + 2 outreach notes. Thu: admin checklist (tax/pension/ISA). Fri: update statuses and scratchpad. Small consistent loops beat heroic bursts.",
  },
  {
    title: "Deploy / backup tips",
    body: "Back up data/ regularly. Set BERRY_SESSION_SECRET in production. Put the app behind HTTPS. For multi-device sync later, swap the JSON store for Postgres — the API shape already assumes per-user documents.",
  },
];

export function DocsTab() {
  return (
    <div className="tab-stack animate-fade">
      <header className="section-head">
        <h2>Playbook</h2>
        <p>How Berry is meant to be used — privacy, job sourcing, and a simple cadence.</p>
      </header>
      {DOCS.map((d) => (
        <section key={d.title} className="panel">
          <h3>{d.title}</h3>
          <p>{d.body}</p>
        </section>
      ))}
    </div>
  );
}
