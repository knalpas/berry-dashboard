# Berry Dashboard

Your money and life admin in one place. Mobile-friendly, with **per-user private data** stored on the server.

## Two tabs

- **Money** — this month at a glance (money in, spent, saved, left) with a bar showing where it went; quick transaction entry; accounts and net worth with month-on-month change; monthly bills with next due dates; category budgets; savings goals.
- **Admin** — dated life-admin to-dos (tax, pension, insurance, documents…) grouped into overdue / next 30 days / later. Repeating tasks roll forward when you tick them. UK tax-year trackers for the ISA and pension allowances, and a notes pad. New accounts start with UK starter tasks linking to GOV.UK and MoneyHelper.

Data from the older five-tab version is migrated automatically: notes and completed checklist items carry over. Old job/CV/contact data is left untouched in the store.

## Accounts

`npm run seed` creates two logins and writes their passwords to `data/CREDENTIALS.txt` (set `BERRY_ADMIN_PASSWORD` / `BERRY_AGENT_PASSWORD` to choose them). Re-running seed **wipes** `data/store.json`.

## Run locally

```bash
npm install
npm run seed
npm run dev
```

Open http://localhost:3000 and sign in with the credentials from `data/CREDENTIALS.txt`.

## Deploy

This is a Next.js server app, so GitHub Pages can't host it.

### Render

1. Open https://dashboard.render.com/select-repo?type=web
2. Pick `knalpas/berry-dashboard`, runtime **Docker** (uses `Dockerfile` / `render.yaml`)
3. Set `BERRY_ADMIN_PASSWORD` and `BERRY_AGENT_PASSWORD` in the dashboard

On the free tier, data lives in `/tmp` and is **lost whenever the service restarts or redeploys**. For anything you want to keep, add a persistent disk (paid) or move the store to a database.

### Vercel

Import at https://vercel.com/new — file storage is ephemeral there too.
