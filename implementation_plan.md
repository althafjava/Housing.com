# Housing.com — Implementation Plan

Derived from [`input/prototype/`](input/prototype/), [`housing.md`](housing.md), and [`housing_architecture.md`](housing_architecture.md). This plan sequences the work to turn the static prototype into a working product on the agreed stack: **React (Next.js) → Node.js → Prisma → PostgreSQL**.

## Scope

**Explicitly out of scope for this plan** (per instruction — revisit as separate follow-up plans once the core product is live):
- Messaging/alerts — no `Set Property Alerts` backend, no notify-modal subscription/matching logic, no email/SMS/push delivery.
- S3 / object storage — no image-upload pipeline; property images are served as external URLs / static placeholders (same gradient placeholders as the prototype) for now.
- Cache / queue — no Redis, no BullMQ/Kafka, no background job workers. Every write in this plan is a direct, synchronous Prisma call. Favorites counts, search results, etc. are computed live, not cached.

Everything else the prototype and architecture doc describe — search & filter, listings, favorites, `Contact Now` leads, price tracker, EMI calculator, auth, owner listing creation — is in scope, implemented in its simplest direct-to-Postgres form (no caching/async layer in front of it).

## Assumptions

- TypeScript across the stack (React + Node), matching Prisma's generated types.
- Single Next.js app for the frontend; single Node.js API (Express or Fastify) as a modular monolith — no service split yet (nothing here is large enough to need one).
- Elasticsearch is **not** stood up in this plan; search/filter/sort runs as Prisma queries against PostgreSQL (indexed columns + `pg_trgm` for free-text). This matches the "MVP alternative" already noted as a trade-off in `housing_architecture.md` §5, and keeps the excluded-infra list (no cache/queue) consistent — standing up Elasticsearch without Redis in front of it would just move the missing-cache problem elsewhere.
- Auth: email/password only for MVP; Google/Facebook OAuth buttons in the modal are built as UI now, wired up in a later phase (they don't depend on anything excluded here, just sequenced after core flows).

---

## Phase 0 — Project Setup

- [ ] Initialize monorepo layout: `apps/web` (Next.js), `apps/api` (Node.js), `packages/prisma` (schema + generated client), or a single Next.js app with `app/api` routes if a separate Node service isn't needed yet — decide based on team preference, not covered by the architecture doc's trade-offs.
- [ ] `prisma init`, connect to a local PostgreSQL instance (Docker Compose: `postgres:16`).
- [ ] Base tooling: ESLint, Prettier, TypeScript strict mode, Husky pre-commit (lint + typecheck).
- [ ] CI skeleton: install, typecheck, lint, build on every PR.

**Exit criteria:** `npm run dev` boots an empty Next.js page and an empty Node API against a local Postgres, both typechecking cleanly.

---

## Phase 1 — Data Model (Prisma)

Port the trimmed schema (no `Alert`, no outbox/queue tables) from `housing_architecture.md`, minus anything alert/messaging-related:

```prisma
model User {
  id           String     @id @default(cuid())
  name         String?
  email        String     @unique
  passwordHash String?
  mobile       String?
  oauthProvider String?
  oauthId      String?
  favorites    Favorite[]
  leads        Lead[]
  createdAt    DateTime   @default(now())
}

model City {
  id         String     @id @default(cuid())
  name       String
  state      String
  localities Locality[]
  listings   Listing[]
}

model Locality {
  id            String     @id @default(cuid())
  city          City       @relation(fields: [cityId], references: [id])
  cityId        String
  name          String
  isTopLocality Boolean    @default(false)
  listings      Listing[]

  @@index([cityId])
}

model Owner {
  id       String    @id @default(cuid())
  name     String
  type     OwnerType
  verified Boolean   @default(false)
  listings Listing[]
  projects Project[]
}

model Project {
  id        String    @id @default(cuid())
  name      String
  builder   Owner     @relation(fields: [builderId], references: [id])
  builderId String
  listings  Listing[]
}

enum OwnerType { INDIVIDUAL BUILDER AGENT }
enum ListingType { SALE RENT }
enum PropertyType { APARTMENT VILLA BUILDER_FLOOR ROW_HOUSE FARM_HOUSE }
enum ListingStatus { READY_TO_MOVE UNDER_CONSTRUCTION }

model Listing {
  id              String        @id @default(cuid())
  owner           Owner         @relation(fields: [ownerId], references: [id])
  ownerId         String
  project         Project?      @relation(fields: [projectId], references: [id])
  projectId       String?
  title           String
  description     String?
  listingType     ListingType
  propertyType    PropertyType
  bhk             Float?
  carpetAreaSqft  Float?
  builtupAreaSqft Float?
  price           Decimal
  status          ListingStatus
  city            City          @relation(fields: [cityId], references: [id])
  cityId          String
  locality        Locality      @relation(fields: [localityId], references: [id])
  localityId      String
  imageUrl        String?       // external URL / placeholder — no S3 pipeline in this plan
  amenities       Amenity[]
  favoritedBy     Favorite[]
  leads           Lead[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([cityId, localityId, propertyType, status])
}

model Amenity {
  id        String  @id @default(cuid())
  listing   Listing @relation(fields: [listingId], references: [id])
  listingId String
  key       String
  icon      String?
}

model Favorite {
  user      User    @relation(fields: [userId], references: [id])
  userId    String
  listing   Listing @relation(fields: [listingId], references: [id])
  listingId String
  createdAt DateTime @default(now())

  @@id([userId, listingId])
}

model Lead {
  id          String   @id @default(cuid())
  listing     Listing  @relation(fields: [listingId], references: [id])
  listingId   String
  user        User?    @relation(fields: [userId], references: [id])
  userId      String?
  channel     String   // "contact_now"
  contactInfo String?
  createdAt   DateTime @default(now())

  @@index([listingId, createdAt])
}

model PriceTrackerSnapshot {
  id           String       @id @default(cuid())
  localityId   String
  propertyType PropertyType
  lowPerSqft   Decimal
  avgPerSqft   Decimal
  highPerSqft  Decimal
  asOfDate     DateTime

  @@index([localityId, propertyType, asOfDate])
}
```

Tasks:
- [ ] Write the schema above, run `prisma migrate dev`.
- [ ] Seed script (`prisma/seed.ts`) loading Chennai + a handful of localities, the three prototype listings (`₹7.5 Cr` villa, `₹95 L` apartment, `₹3.6 Cr` high-rise) and matching `PriceTrackerSnapshot` rows, so the frontend has real data to render against from day one.

**Exit criteria:** `prisma studio` shows seeded data matching the prototype's card content.

---

## Phase 2 — Listing & Search API

Maps to `.searchbar`, `.sidebar .filter-group`, `.grid` in the prototype.

- [ ] `GET /api/listings/:id` — single listing detail.
- [ ] `GET /api/search?city=&locality=&bhk=&propertyType=&priceMin=&priceMax=&sort=&page=` — Prisma `findMany` with `where` built from query params, `orderBy` for the sort-by dropdown (`relevant` = `createdAt desc` as a placeholder relevance, `price_asc`, `price_desc`, `newest`), `skip`/`take` for pagination.
- [ ] Facet-count endpoint (or embed in the search response) — `groupBy` queries for BHK/property-type/locality/budget-bucket counts to populate the sidebar checkboxes with live counts, matching what the prototype's `Quick Refine` implies.
- [ ] Free-text search over `title`/`description`: Postgres `pg_trgm` + `GIN` index; add via a raw `migration.sql` addition since Prisma doesn't manage trigram indexes natively.
- [ ] `GET /api/listings/:id/price-tracker` — reads `PriceTrackerSnapshot` for the listing's locality+propertyType (latest `asOfDate`), direct query, no cache.
- [ ] `POST /api/emi/calculate` — pure function endpoint (principal, rate, tenure → EMI), no external dependency.

**Exit criteria:** every filter/sort control visible in `input/prototype/index.html`'s sidebar and toolbar has a working query param on `/api/search`.

---

## Phase 3 — Frontend: Prototype → React Components

Port `input/prototype/index.html` + `style.css` into Next.js/React, preserving class names as component/CSS-module names where practical so the visual output stays pixel-matched to the prototype.

- [ ] `<Header>` — logo, nav, Home Loan / Sell-Rent CTAs (static for now), Sign In.
- [ ] `<SearchBar>` — city/buy/price/type controls + free-text input, wired to `/api/search` query params (client-side navigation updates the URL, enabling shareable/bookmarkable search URLs).
- [ ] `<Breadcrumb>` — derived from the active city/locality in the URL.
- [ ] `<Sidebar>` with `<FilterGroup>` (collapsible, matches `[data-toggle]` behavior in `script.js`) for BHK / Property Type / Top-Nearby Localities / Budget Range, counts from Phase 2's facet endpoint.
- [ ] `<Tabs>` (All properties / Affordable Homes / New Projects) — each tab is a preset filter combination applied to the same `/api/search` call.
- [ ] `<RelatedPropertiesStrip>` — static tag list per city for now (internal-linking/SEO value), data-driven later.
- [ ] `<PropertyCard>` — price, area, title, status, favorite star, `Contact Now`, project/owner line, EMI line, `<PriceTracker>` sub-component (low/avg/high bar), amenities row. This is the highest-value component: it's reused on `/search` and `/property/[id]`.
- [ ] `<PriceTracker>` — renders the low/avg/high bar from Phase 2's price-tracker endpoint.
- [ ] Pages: `app/search/page.tsx` (SSR, reads query params server-side, renders `<SearchBar>` + `<Sidebar>` + grid of `<PropertyCard>`), `app/property/[id]/page.tsx` (SSR, listing detail).
- [ ] Skip building the notify modal's *subscription* behavior (excluded — messaging/alerts); the modal component itself is fine to build as a static/UI-only piece if wanted for visual completeness, but wire its submit button to `console.log`/no-op rather than a real endpoint.

**Exit criteria:** `/search?city=chennai` in the running app visually matches the prototype screenshots, backed by real seeded data instead of static markup.

---

## Phase 4 — Auth & Favorites

Maps to `.signin`, `.fav`, `.dot--muted` badge.

- [ ] `POST /api/auth/signup` — email/password, `bcrypt` hash, Prisma `create`.
- [ ] `POST /api/auth/login` — credential check, issue JWT (httpOnly cookie).
- [ ] `POST /api/favorites/:listingId` — toggle (Prisma `upsert`/`delete` on the composite key), auth-required.
- [ ] `GET /api/favorites` — list + count for the logged-in user, feeds the header badge directly from a live `count()` query (no cached counter, per scope).
- [ ] `<FavoriteButton>` — optimistic toggle in the UI (matches the prototype's instant-feedback `script.js` behavior), rollback on API error.
- [ ] Google/Facebook OAuth: build the buttons in the notify-modal-turned-signup UI; defer actual Passport.js/Auth.js provider wiring to a follow-up ticket (not blocking — email/password covers the core flow).

**Exit criteria:** a user can sign up, log in, star a property, and see the header badge reflect the correct count on reload.

---

## Phase 5 — Lead Capture (`Contact Now`)

Maps to `.btn--contact`.

- [ ] `POST /api/leads` `{ listingId, channel: "contact_now", contactInfo? }` — direct synchronous `prisma.lead.create()`. No outbox, no queue, no CRM webhook fan-out (excluded) — a lead landing in the `Lead` table *is* the deliverable for this plan; wiring it to an actual CRM/notification path is a follow-up once messaging infra is back in scope.
- [ ] Frontend: clicking `Contact Now` posts the lead and shows a confirmation state on the card (button → "Contact requested" or similar), matching the prototype's card layout.
- [ ] Basic abuse guard: rate-limit by IP/user at the route level (in-process, e.g. a simple sliding-window check) — not a Redis-backed limiter, since caching infra is out of scope.

**Exit criteria:** every `Lead` row created via the UI is queryable in Postgres with correct `listingId`/`userId`/`channel`.

---

## Phase 6 — Owner Listing Creation (`Sell/Rent Property for Free`)

Not present in the prototype's markup as a full flow, but implied by the CTA — minimum viable version:

- [ ] `POST /api/listings` — authenticated owner/agent creates a listing (title, type, BHK, area, price, city/locality, `imageUrl` as a plain text field for now — no upload pipeline).
- [ ] `<CreateListingForm>` — simple form page, reuses the enums already in the Prisma schema for dropdowns.

**Exit criteria:** a listing created through this form immediately appears in `/search` results.

---

## Phase 7 — Testing & QA

- [ ] Unit tests: EMI calculator (pure function — easy, high-value coverage), search query-builder (param → Prisma `where` clause mapping).
- [ ] Integration tests: `/api/search`, `/api/leads`, `/api/favorites`, `/api/auth/*` against a test Postgres instance (Docker).
- [ ] Component tests: `<PropertyCard>`, `<Sidebar>` filter toggling, `<FavoriteButton>` optimistic-update/rollback.
- [ ] Manual pass against each of the three original screenshots (`input/screenshots/`) at desktop and mobile widths — this is the acceptance bar the prototype was built to hit; the real app should match it just as closely.

---

## Phase 8 — Deployment (minimal)

Consistent with the exclusions: no CDN/S3 asset pipeline, no queue infra to deploy.

- [ ] Managed PostgreSQL instance (e.g., a single hosted instance sized for MVP load).
- [ ] Deploy Next.js app (Vercel or equivalent Node hosting) with `DATABASE_URL` pointed at Postgres via Prisma.
- [ ] Deploy Node API alongside it (same platform or a small container/VM) — reachable by the Next.js server-side fetches.
- [ ] Environment-based Prisma migration step in the deploy pipeline (`prisma migrate deploy`).

**Exit criteria:** the same `/search` and `/property/[id]` flows verified in Phase 7 work against the deployed environment.

---

## Explicit Follow-Up Backlog (deferred, not part of this plan)

These are called out so they aren't silently forgotten — each is a real requirement from `housing_architecture.md`, just sequenced after this plan:

- **Messaging/alerts:** `Set Property Alerts`, notify-modal subscription matching, email/SMS/push delivery, the `Alert` Prisma model, a Notification worker.
- **S3/object storage:** real image upload for owner-created listings, multi-size image variants, CDN delivery.
- **Cache/queue:** Redis for search-result and facet-count caching, favorite/lead-count caching, BullMQ (or Kafka) for async lead relay to a CRM, background price-tracker recomputation jobs, rate limiting at scale.
- **Elasticsearch:** once Postgres-based search/filter latency or facet-query load stops meeting the NFRs in `housing_architecture.md` §1.2, migrate the search path per that doc's §5 trade-off.
