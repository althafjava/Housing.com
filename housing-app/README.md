# Housing.com — Application

Generated from [`implementation_plan.md`](../implementation_plan.md), Phases 0–7. React (Next.js) frontend, Node.js API routes, PostgreSQL via Prisma.

Out of scope, per the plan: messaging/alerts, S3/object storage, cache/queue infra (Redis, BullMQ, Elasticsearch). See [`implementation_plan.md`](../implementation_plan.md#explicit-follow-up-backlog-deferred-not-part-of-this-plan) for the deferred backlog.

## Stack notes

This project pins newer major versions than common tutorials assume:

- **Next.js 16** — `params`/`searchParams`/`cookies()` are all async; route handlers use the `RouteContext<'/path'>` helper type.
- **Prisma 7** — the datasource `url` no longer lives in `schema.prisma`; it's read from `prisma7.config.ts` (CLI/migrations) and a driver adapter (`@prisma/adapter-pg`) is passed explicitly to `new PrismaClient({ adapter })` at runtime (see [`src/lib/prisma.ts`](src/lib/prisma.ts)).

## Setup

```bash
cp .env.example .env        # adjust DATABASE_URL / JWT_SECRET if needed
docker compose up -d        # starts Postgres on localhost:5545
npm install
npx prisma migrate dev      # applies prisma/schema.prisma and seeds via prisma7.config.ts
npm run dev                 # http://localhost:3000
```

Seeded login for testing auth/favorites/lead flows: `sivapratap@example.com` / `password123` (see [`prisma/seed.ts`](prisma/seed.ts) for the other seeded owners).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / run |
| `npm test` | Unit tests (EMI calculator, search query-builder) via Node's test runner |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Re-run the seed script |
| `npm run db:studio` | Prisma Studio |

## What's implemented (implementation_plan.md phases)

- **Phase 1** — [`prisma/schema.prisma`](prisma/schema.prisma). Includes one fix over the plan's original schema: `Owner.userId` links back to `User`, so an authenticated user can be resolved to the `Owner` record Phase 6 needs (flagged in the implementation_plan.md review — Owner had no relation to User).
- **Phase 2** — `/api/search`, `/api/listings/[id]`, `/api/listings/[id]/price-tracker`, `/api/emi/calculate`. Search runs as Prisma/Postgres queries (no Elasticsearch, per scope); facet counts are city-scoped only (documented simplification in [`src/lib/search-service.ts`](src/lib/search-service.ts)).
- **Phase 3** — components in [`src/components/`](src/components) named after the prototype's CSS classes; `globals.css` is the prototype's stylesheet with a few additions (auth/create-listing forms, disabled-state styling for out-of-scope buttons).
- **Phase 4** — email/password auth (JWT httpOnly cookie) + favorites. Also adds `POST /api/auth/logout` and `GET /api/auth/me`, gaps flagged in the plan review that weren't in the original phase.
- **Phase 5** — `POST /api/leads`, in-process rate limiting (documented single-instance limitation in [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts)).
- **Phase 6** — `POST /api/listings` + `/sell` form.
- **Phase 7** — [`src/lib/__tests__/`](src/lib/__tests__) (16 tests, `npm test`). Manual verification against the prototype screenshots was done via the browser preview rather than automated visual regression.

Phase 8 (deployment) is documented in `implementation_plan.md`; this repo doesn't include CI/CD config.

## Deliberate UI states

Several prototype elements render but are disabled with a "Coming soon" tooltip, since their backing feature is out of scope for this plan: Home Loan partner CTA, Set Property Alerts, the notify-modal's subscribe flow, Notifications/Saved-searches header icons, and Google/Facebook OAuth buttons.
