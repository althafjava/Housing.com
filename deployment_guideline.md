# Housing.com — Deployment Guideline

Covers taking [`housing-app/`](housing-app/) from "runs locally via Docker Compose" to a live, publicly reachable deployment. Written for the stack as built: **Next.js 16 (React) + Node.js route handlers + Prisma 7 + PostgreSQL**.

This is a guide, not an automated pipeline — the steps that need your accounts/credentials (GitHub, hosting, database provider) have to be run by you; anywhere code or config needs to change on this side, that's called out explicitly.

---

## 1. What's being deployed, and where

| Piece | Local (today) | Production target |
|---|---|---|
| Next.js app (frontend + API routes) | `npm run dev` on `localhost:3000` | **Vercel** (native Next.js hosting — zero-config for this stack) |
| PostgreSQL | Docker Compose, `localhost:5545` | A **managed Postgres** provider (Neon, Supabase, or Railway — see §3) |
| Prisma migrations | `prisma migrate dev` | `prisma migrate deploy`, run once against the production database |
| Source control | Local git repo (`Housing.com/`) | GitHub (see the previous turn in this session — publish via GitHub Desktop) |

There's no separate "backend service" to deploy — the Node.js API lives inside the Next.js app as route handlers (`src/app/api/**/route.ts`) and deploys as part of the same Vercel project.

---

## 2. Prerequisites

- [ ] The `Housing.com` repo is published to GitHub (previous turn's instructions — GitHub Desktop → Publish repository).
- [ ] A Vercel account, connected to that GitHub account.
- [ ] A managed Postgres database provisioned (§3) with its connection string in hand.
- [ ] A value for `JWT_SECRET` that is **not** the local dev placeholder (`change-me-in-production` in `.env.example`) — generate one:
  ```bash
  openssl rand -base64 32
  ```

---

## 3. Provision a production database

The local `docker-compose.yml` only runs on your machine — it is not a deployment target. Pick one managed Postgres provider (any work fine with Prisma; free tiers exist on all three):

| Provider | Why you might pick it |
|---|---|
| **Neon** | Serverless Postgres, branching, generous free tier, connection pooling built in (`-pooler` connection string) |
| **Supabase** | Postgres + built-in connection pooler (PgBouncer, port `6543`), plus extras (auth/storage) not used by this app |
| **Railway** | Simplest one-click Postgres if you'd rather not think about pooling separately |

**Important — this app's Prisma setup needs the *pooled* connection string, not the direct one**, because Vercel deploys the API as serverless functions: many short-lived function instances can each open a Postgres connection simultaneously, and a small managed Postgres plan's connection limit (often ~20-60) is exhausted quickly without pooling. Neon and Supabase both give you two connection strings — grab the one labeled "pooled" / "pgbouncer" / `-pooler`, not the direct one.

Once provisioned, run the schema migration against it from your machine (one-time, or whenever the schema changes):

```bash
cd housing-app
DATABASE_URL="<production connection string>" npx prisma migrate deploy
```

`migrate deploy` (not `migrate dev`) — it applies existing migrations without prompting or generating new ones, which is what you want against a real database. `prisma7.config.ts` already points `migrations.seed` at `prisma/seed.ts`; only run the seed against production if you actually want the demo listings (`sivapratap@example.com` / `password123`, etc.) live — otherwise skip it and create real data through the app's `/sell` flow instead.

---

## 4. Recommended code change before deploying: cap the connection pool

`src/lib/prisma.ts` currently does:

```ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
```

On Vercel, each serverless function instance gets its own process, and the default `pg.Pool` size (10) per instance multiplies fast under load. Even with a pooled connection string, capping the per-instance pool keeps things well-behaved:

```ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 });
```

This is a one-line change — say the word and I'll apply it directly rather than you hand-editing it.

---

## 5. Deploy to Vercel

1. **New Project** in the Vercel dashboard → **Import Git Repository** → select the `Housing.com` GitHub repo.
2. **Root Directory:** set to `housing-app` (the repo root has the docs alongside it — Vercel needs to build from the app subfolder). This is the one non-default setting; Vercel auto-detects everything else (Next.js framework preset, build command `next build`, output).
3. **Environment Variables** (Project Settings → Environment Variables), add for the **Production** environment:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the pooled production connection string from §3 |
   | `JWT_SECRET` | the value generated in §2 |
4. **Deploy.** Vercel builds `npm run build` (which runs `next build` — the same command already verified locally in this session) and serves it.
5. Once live, Vercel gives you a `https://<project>.vercel.app` URL — that's the shareable link.

### Build-time gotcha to watch for

`next.config.ts` sets `turbopack.root` to the local absolute path — this is fine (it's resolved via `path.join(__dirname)` at build time, not hardcoded), but if the Vercel build log shows a Turbopack root-detection warning, it's cosmetic and doesn't block the build; no action needed.

Prisma Client generation (`prisma generate`, writing to `src/generated/prisma`) needs to happen as part of the Vercel build. Next.js's default build doesn't run it automatically — add it as an explicit build step in **Project Settings → Build & Development Settings → Build Command**:
```
npx prisma generate && next build
```

---

## 6. Post-deploy verification checklist

Walk through the same flows verified locally in this session, against the live URL instead of `localhost:3000`:

- [ ] `/search` loads with seeded (or real) listings, filters and sort work
- [ ] `/property/[id]` renders, EMI calculator returns a value
- [ ] Sign up / log in — confirm the session cookie is set (`secure: true` kicks in automatically since `NODE_ENV === "production"` on Vercel, so this **requires HTTPS**, which Vercel provides by default — this would silently fail to persist the cookie on a non-HTTPS host)
- [ ] Favorite toggle persists across a page reload
- [ ] `Contact Now` creates a lead (check via `npx prisma studio` against the production `DATABASE_URL`, or a quick query)
- [ ] `/sell` creates a listing while logged in, and it appears back in `/search`

---

## 7. Ongoing deploys

Once connected, Vercel auto-deploys on every push to the GitHub repo's default branch (Production) and creates a preview deployment for every other branch/PR — no extra setup. Schema changes need an explicit manual step though: `prisma migrate deploy` (§3) isn't run automatically by Vercel, so after merging a schema change, run it against production before or right after that deploy goes live.

---

## 8. What's still not covered (matches implementation_plan.md's excluded scope)

Consistent with `implementation_plan.md`'s explicit exclusions, this guideline doesn't cover:
- **Object storage / CDN for images** — the app currently takes a plain `imageUrl` string; there's no upload pipeline to deploy.
- **Redis / queue infra** — nothing to provision; the app has no background workers.
- **Alerts/notification delivery** — no email/SMS provider to configure; the relevant UI is already disabled ("Coming soon") in the app itself.

If any of those get built later, they'd each need their own provisioning step added here (e.g., an S3-compatible bucket + `next/image` remote pattern for images, an Upstash Redis instance for a future queue).
