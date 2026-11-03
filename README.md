# Berry Dashboard

Personal admin workspace for career moves and life admin. Berry logo, mobile-friendly tabs, and **per-user private data** stored on the server (not shared across accounts).

## Tabs

- **Home** — snapshot, scratchpad, CV advice
- **Jobs** — CV upload/profile, public job APIs ranked by relevance, CV tips, Apply Assist, people targeting
- **Admin** — tax / health insurance / pension / investments / admin checklist with advice + GOV.UK / MoneyHelper links
- **Network** — hiring contacts & outreach drafts
- **Playbook** — how to use Berry safely

## Auth & personal data

This agent run had **no GitHub repository linked**, so auth is local:

1. `npm run seed` creates two accounts and writes passwords to `data/CREDENTIALS.txt`
2. Each login gets its own CV, applications, contacts, and finance list in `data/store.json`
3. Karl’s account is **admin**; the Berry Agent account is a separate user

For GitHub later: keep `data/` gitignored (already configured), deploy your own instance, and optionally move the JSON store to a database.

## Job sources

Uses public APIs (**Remotive**, **Arbeitnow**). LinkedIn/Indeed are **not scraped** (against their terms). Apply Assist drafts a cover letter and tracks status; you submit on the employer’s official page.

## Run locally

```bash
npm install
npm run seed
npm run dev
```

Open http://localhost:3000 and sign in with credentials from `data/CREDENTIALS.txt`.

Optional: set `BERRY_SESSION_SECRET` in production.

## Deploy (phone-friendly)

This is a Next.js server app — **GitHub Pages cannot host it**. Use:

### Render (recommended free host)

1. Open https://dashboard.render.com/select-repo?type=web on your phone  
2. Connect GitHub and pick `knalpas/berry-dashboard`  
3. Runtime: **Docker** (uses the included `Dockerfile` / `render.yaml`)  
4. After deploy, open the `*.onrender.com` URL  

Optional env vars: `BERRY_ADMIN_PASSWORD`, `BERRY_AGENT_PASSWORD`, `BERRY_SESSION_SECRET`.

### Vercel

Import the GitHub repo at https://vercel.com/new — note file storage is ephemeral on the free tier (data can reset).
