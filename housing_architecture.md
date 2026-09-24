# Housing.com — Property Listing Platform: System Architecture

**Stack:** React (Next.js) frontend · Node.js backend · PostgreSQL · Prisma ORM

**Source of truth for UI scope:** [`input/prototype/index.html`](input/prototype/index.html), [`input/prototype/css/style.css`](input/prototype/css/style.css), [`input/prototype/js/script.js`](input/prototype/js/script.js) — a static prototype of an IndiaProperty-style residential listing search page, built from `input/screenshots/*.png`.

This document takes that front-end prototype and works backward to the services, data model, and integrations needed to make every element on the page real. Each functional requirement below is traced to a concrete node/component in the prototype markup.

---

## 1. Requirements Gathering

### 1.1 Functional requirements (derived from the prototype UI)

| Prototype element | `index.html` reference | Required capability |
|---|---|---|
| City / Buy / Price / Property-type search bar, free-text search | `.searchbar`, `.sb-search` | Faceted + keyword property search |
| `Quick Refine` sidebar: BHK, Property Type, Top/Nearby Localities, Budget Range | `.sidebar .filter-group` | Filter/facet aggregation service |
| Breadcrumb (`Home > Chennai > Real Estate > Residential Property > ...`) | `.breadcrumb` | Locality/city hierarchy, SEO-friendly URLs |
| Tabs: All properties / Affordable Homes / New Projects | `.tabs` | Curated listing segments (query presets) |
| `RELATED PROPERTIES` tag strip | `.related__tags` | Internal-linking / SEO recommendation service |
| Sort by (Relevant, Price, Newest) | `.sortby select` | Ranking service |
| Property card: price, area, title, status, `Contact Now` | `.card`, `.btn--contact` | Listing detail + lead-capture (click-to-call/enquiry) |
| Favorite star toggle, badge counts (`0`, `20`) | `.fav`, `.dot--red` | User favorites / saved-search counters |
| `pricetracker` widget (Low/Avg/High per Sq.ft) | `.pricetracker` | Market price-analytics service |
| `View Transaction Trends & Save Money` | `.card__links .trends` | Historical transaction data service |
| `EMI ... Apply Home Loan` | `.emi` | EMI calculator + loan-partner integration |
| `Set Property Alerts` button | `.btn--alert` | Saved search + alert subscription |
| Notify modal — Sign Up with Google/Facebook, Name/Email/Password/Mobile, city+locality+price+BHK preference | `#notifyModal` | Auth (OAuth + credentials), lead/preference capture, notification opt-in |
| `Sell/Rent Property for Free` | `.btn--outline` | Owner/builder listing-creation flow (not yet in prototype, but implied) |
| Download-app icon, Sign In | `.icon-btn--app`, `.signin` | Mobile app deep link, session/auth |

### 1.2 Non-functional requirements

- **Scale (target, year-1):** ~2M listings live at any time, ~150 cities, ~5M monthly active users, ~50M search requests/month, peak ~800 req/s during evening hours.
- **Latency:** search/filter results < 300 ms p95; property card image paint < 1.5 s on 4G; EMI/price-tracker widgets can lazy-load (non-blocking).
- **Availability:** 99.9% for search/browse (read path); 99.95% for auth; lead-capture (`Contact Now`, notify modal) must never silently drop a submission — durability > latency there.
- **SEO:** breadcrumb + related-property tags imply the listing pages must be crawlable — server-side rendering or static generation is a hard requirement, not an enhancement.
- **Data freshness:** listing status ("Ready to move in", price) can be near-real-time; price-tracker analytics can be daily-batch.
- **Consistency:** favorites/alerts count badges must be read-your-writes consistent for the logged-in user; search index can be eventually consistent (seconds, not real-time).

### 1.3 Constraints

- Requested stack: **React (via Next.js)** frontend, **Node.js** backend, **PostgreSQL** as the system of record, **Prisma** as the ORM/migration tool. This design uses that stack end-to-end rather than mixing in a second backend language.
- Prototype is currently static HTML/CSS/JS with placeholder gradients for images — no backend exists yet. This doc assumes a **greenfield backend** behind the existing prototype markup, migrating the prototype's HTML/CSS into React components incrementally (the class names in `style.css` map 1:1 onto candidate component names — `.card`, `.pricetracker`, `.sidebar`, `#notifyModal`).
- Small-to-mid engineering team implied (no evidence of a large platform org) → favor a **modular monolith (single Node.js codebase, domain-scoped modules)** first, splitting a service out only where load or ownership genuinely demands it (see §5 trade-offs).

---

## 2. High-Level Design

### 2.1 Component diagram

```
                                   ┌─────────────────────┐
                                   │      CDN / Edge      │  static assets, card images,
                                   │  (CloudFront/Vercel   │  cached SSR/ISR HTML
                                   │   Edge Network)        │
                                   └──────────┬───────────┘
                                              │
                                   ┌──────────▼───────────┐
                                   │   Next.js (React)      │  SSR/ISR for /search,
                                   │   App — SSR + SPA       │  /property/[id]; CSR for
                                   │   hydration             │  authenticated dashboards
                                   └──────────┬───────────┘
                                              │ HTTPS/JSON (REST, or tRPC if same repo)
                                   ┌──────────▼───────────┐
                                   │      API Gateway /     │  authn (JWT), rate-limit,
                                   │   Node.js BFF layer     │  request aggregation for the
                                   │   (Express/Fastify/     │  property card (listing+price+fav)
                                   │       NestJS)            │
                                   └───┬───┬───┬───┬───┬───┘
             ┌────────────────────────┘   │   │   │   └─────────────────────────┐
             │                 ┌───────────┘   │   └───────────┐                 │
   ┌─────────▼────────┐ ┌──────▼───────┐ ┌─────▼──────┐ ┌───────▼───────┐ ┌───────▼────────┐
   │  Identity/Auth    │ │  Search &     │ │  Listing   │ │  Lead & Alert │ │  Price Analytics │
   │  module           │ │  Filter       │ │  module    │ │  module       │ │  worker          │
   │  (Passport.js /    │ │  module       │ │  (CRUD,    │ │  (Contact Now,│ │  (Node cron/     │
   │  Auth.js, JWT)      │ │  (Elastic-    │ │  status)   │ │  notify modal,│ │  BullMQ job,     │
   │                    │ │  search)      │ │            │ │  Set Alerts)  │ │  pricetracker)   │
   └─────────┬─────────┘ └──────┬───────┘ └─────┬──────┘ └───────┬───────┘ └───────┬────────┘
             │                  │                │                │                 │
             └──────────────────┴────────────────┴────────┬───────┴─────────────────┘
                                                            │  Prisma Client
                                                  ┌─────────▼─────────┐
                                                  │    PostgreSQL       │  users, listings, leads,
                                                  │  (via Prisma ORM)   │  alerts, favorites, projects
                                                  └─────────┬─────────┘
                                                            │  CDC / outbox → indexer job
                                                  ┌─────────▼─────────┐        ┌────────────┐
                                                  │   Elasticsearch     │        │  Redis      │
                                                  │  (facets, geo, text)│        │ (cache,     │
                                                  └────────────────────┘        │ sessions,   │
                                                                                 │ BullMQ)     │
                                                  ┌────────────────────┐        └────────────┘
                                                  │  S3 + CDN (images)  │
                                                  └────────────────────┘
                                                  ┌────────────────────┐
                                                  │ Analytics DW         │  price-tracker,
                                                  │ (ClickHouse/BigQuery)│  transaction trends
                                                  └────────────────────┘

                  ┌─────────────────── Queue / event bus (BullMQ on Redis, or Kafka at scale) ───────────────────┐
                  │  listing.upserted   lead.created   favorite.toggled   alert.subscribed   price.recomputed     │
                  └──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data flow — two representative journeys

**A. Search & filter (`.searchbar` + `.sidebar` → `.grid`)**
1. Next.js server component / API route sends `GET /api/search?city=chennai&bhk=2,3&budget=2000000-3000000&sort=relevant`.
2. Node.js BFF authenticates (optional — search is anonymous-friendly), forwards to the **Search & Filter module**.
3. Search module queries **Elasticsearch** (facet aggregations power the sidebar counts; query powers `.grid` cards).
4. BFF aggregates each hit with a lightweight join to the **Listing module** (Prisma read against Postgres, or denormalized fields already in the ES document) plus **Price Analytics** (`pricetracker` low/avg/high, from Redis cache) and **Favorites** (star state, if authenticated).
5. Response shaped to match the card's fields (`price`, `area`, `title`, `status`, `project/owner`, `updated`, `emi`, `pricetracker`) — one round trip for the whole `.grid`. Rendered server-side on first load (Next.js) for SEO, hydrated for client-side filtering afterward.

**B. Lead capture (`Contact Now` and the notify modal `#notifyModal`)**
1. Click on `.btn--contact` → `POST /api/leads` `{listingId, userId?, channel:"contact_now"}`.
2. **Lead & Alert module** writes the lead **synchronously** via `prisma.lead.create()` (durability first), then enqueues `lead.created` on BullMQ/Kafka.
3. Downstream consumers (separate Node.js worker processes): CRM/agent-notification webhook, analytics sink — decoupled, async, retryable.
4. Notify-modal submit (`GET NOTIFIED`) → `POST /api/alerts` `{city, locality, propertyType, priceRange, bhk, contact}` (+ optional OAuth signup via Identity module) → stored as a saved search (`prisma.alert.create()`); a **Notification worker** polls/streams new matching listings and emails/SMS/pushes the user.

### 2.3 API contracts (representative, REST/JSON over HTTPS)

```
GET  /api/search?city=&locality=&bhk=&budget=&propertyType=&sort=&page=
GET  /api/listings/:id
GET  /api/listings/:id/price-tracker
GET  /api/listings/:id/transaction-trends
POST /api/leads                       { listingId, channel, contactInfo? }
POST /api/favorites/:listingId        (toggle)
GET  /api/favorites                   (badge count + list)
POST /api/alerts                      { city, locality, propertyType, priceRange, bhk, email/mobile }
GET  /api/alerts                      (saved-search-alert count for the bell icon)
POST /api/auth/oauth/google
POST /api/auth/oauth/facebook
POST /api/auth/signup                 { name, email, password, mobile }
POST /api/emi/calculate               { principal, rate, tenureYears }
POST /api/listings                    (owner/builder: Sell/Rent for Free flow)
```

Implemented as Express/Fastify routers (or NestJS controllers) grouped by domain module; if the Next.js app and API live in one repo, the same contracts can be exposed as **tRPC** procedures instead of hand-written REST for end-to-end TypeScript type safety (see §5 trade-offs).

### 2.4 Storage choices

| Data | Store | Why |
|---|---|---|
| Listings (canonical), users, leads, alerts, favorites, projects | **PostgreSQL, accessed via Prisma Client** | Relational integrity (listing↔owner↔project), transactional lead writes, Prisma migrations keep schema in version control |
| Search/facet index (city, BHK, budget, locality, free text) | **Elasticsearch** | Sub-300ms faceted + geo + fuzzy text search; Postgres full-text doesn't scale to the sidebar's live facet counts at target volume |
| Session/rate-limit/hot cache (city list, popular searches, EMI-rate config), job queue | **Redis** (also backs **BullMQ**) | Sub-ms reads, TTL-based invalidation, doubles as the queue broker for a Node-only stack |
| Property images | **S3-compatible object storage + CDN** | Cards need many image variants (thumb/card/full); origin storage decoupled from delivery |
| Price-tracker + transaction-trend analytics | **ClickHouse/BigQuery**, populated by a **Node.js batch worker** (cron via BullMQ repeatable jobs) | Aggregation-heavy, append-only, not on the transactional hot path |
| Event backbone | **BullMQ on Redis** at launch scale; **Kafka** once cross-service/cross-team consumption grows | Keeps the stack to one extra moving part (Redis) until scale genuinely justifies Kafka's operational cost |

---

## 3. Deep Dive

### 3.1 Data model (Prisma schema — core entities)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  passwordHash  String?
  mobile        String?
  oauthProvider String?   // "google" | "facebook"
  oauthId       String?
  favorites     Favorite[]
  alerts        Alert[]
  leads         Lead[]
  createdAt     DateTime  @default(now())

  @@index([oauthProvider, oauthId])
}

model City {
  id         String     @id @default(cuid())
  name       String
  state      String
  localities Locality[]
  listings   Listing[]
}

model Locality {
  id             String     @id @default(cuid())
  city           City       @relation(fields: [cityId], references: [id])
  cityId         String
  name           String
  isTopLocality  Boolean    @default(false)
  nearby         Locality[] @relation("NearbyLocalities")
  listings       Listing[]

  @@index([cityId])
}

model Project {
  id       String    @id @default(cuid())
  name     String
  builder  Owner     @relation(fields: [builderId], references: [id])
  builderId String
  listings Listing[]
}

model Owner {
  id       String    @id @default(cuid())
  name     String
  type     OwnerType
  verified Boolean   @default(false)
  listings Listing[]
  projects Project[]
}

enum OwnerType { INDIVIDUAL BUILDER AGENT }
enum ListingType { SALE RENT }
enum PropertyType { APARTMENT VILLA BUILDER_FLOOR ROW_HOUSE FARM_HOUSE }
enum ListingStatus { READY_TO_MOVE UNDER_CONSTRUCTION }

model Listing {
  id            String        @id @default(cuid())
  owner         Owner         @relation(fields: [ownerId], references: [id])
  ownerId       String
  project       Project?      @relation(fields: [projectId], references: [id])
  projectId     String?
  title         String
  description   String?
  listingType   ListingType
  propertyType  PropertyType
  bhk           Float?
  carpetAreaSqft Float?
  builtupAreaSqft Float?
  price         Decimal
  status        ListingStatus
  city          City          @relation(fields: [cityId], references: [id])
  cityId        String
  locality      Locality      @relation(fields: [localityId], references: [id])
  localityId    String
  lat           Float?
  lng           Float?
  amenities     Amenity[]
  favoritedBy   Favorite[]
  leads         Lead[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

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
  channel     String   // "contact_now" | "notify_modal"
  contactInfo String?
  createdAt   DateTime @default(now())

  @@index([listingId, createdAt])
}

model Alert {
  id           String   @id @default(cuid())
  user         User?    @relation(fields: [userId], references: [id])
  userId       String?
  cityId       String
  localityId   String?
  propertyType PropertyType?
  bhk          Float?
  priceMin     Decimal?
  priceMax     Decimal?
  contactInfo  String
  createdAt    DateTime @default(now())
}

// Populated nightly by the price-analytics worker; read-heavy, not joined
// against the transactional tables at request time (see §3.2 caching).
model PriceTrackerSnapshot {
  id             String   @id @default(cuid())
  localityId     String
  propertyType   PropertyType
  lowPerSqft     Decimal
  avgPerSqft     Decimal
  highPerSqft    Decimal
  asOfDate       DateTime

  @@index([localityId, propertyType, asOfDate])
}
```

- `Favorite` and `Alert` are the two entities backing the header badges (`.dot--red` counts `20` saved searches, `.dot--muted` counts `0` favorites) — both need a fast count per user, so they're cached in Redis (`favorites:count:{userId}`) and invalidated on write rather than re-counted via Prisma on every page load.
- `PriceTrackerSnapshot` is precomputed nightly by a Node.js worker from `Transaction`-equivalent source data (kept in the analytics warehouse, not Postgres) plus current `Listing` prices — never computed inline on a request.
- Prisma Migrate keeps this schema as the single source of truth for the Postgres DDL; `prisma db seed` can load the three prototype cards (`₹7.5 Cr` villa, `₹95 L` apartment, `₹3.6 Cr` high-rise) as fixture data for local dev.

### 3.2 Caching strategy

| What | Cache | TTL / invalidation |
|---|---|---|
| Search results for popular filter combos (e.g., "2 BHK Chennai") | Redis (or ES request cache) | 60s TTL — listings don't change fast enough to need sub-minute freshness |
| City/locality lists (sidebar `Top/Nearby Localities`, breadcrumb hierarchy) | Redis, warmed at deploy | Invalidate on admin edit (rare) |
| Favorites/Alerts counters (badge numbers) | Redis counter | Write-through on toggle/subscribe (same request that calls `prisma.favorite.upsert`) |
| `pricetracker` per locality+type | Redis, 24h TTL | Refreshed by the nightly analytics worker publishing `price.recomputed` |
| Rendered pages for top N listing/search routes (SEO) | Next.js **ISR** (Incremental Static Regeneration) + CDN edge cache | Revalidate on-demand (`res.revalidate()`) when listing status changes (sold/rented), background revalidation otherwise |

### 3.3 Queue / event design

- `listing.upserted` — Listing module publishes on create/update/status-change → **Search Indexer** worker updates Elasticsearch (keeps search eventually consistent without coupling writes to ES availability).
- `lead.created` — Lead module publishes after the durable Prisma write → CRM webhook worker, analytics worker, "agent SMS" worker (each independently retryable via BullMQ's built-in retry/backoff; a stalled CRM integration never blocks the user-facing `Contact Now` response).
- `alert.subscribed` — Alert module publishes → Notification worker schedules digest/immediate matching.
- `favorite.toggled` — used only for analytics/recommendation training, not user-facing (favorites read path hits Postgres+Redis directly for correctness).
- `price.recomputed` — nightly analytics worker publishes → invalidates the `pricetracker` Redis cache.

Start with **BullMQ on the existing Redis instance** (one less system to operate, native Node.js/TypeScript job definitions colocated with the API code); move specific high-fan-out topics to **Kafka** only once multiple independent teams/services need to consume the same event stream (see §5).

### 3.4 Error handling & retry

- **Search module → Elasticsearch:** circuit breaker (e.g., `opossum`); on ES outage, fall back to a Prisma query against indexed Postgres columns (degraded relevance/facets, but the `.grid` still renders) rather than a blank page.
- **Lead submission (`Contact Now`, notify modal):** the Prisma write to `Lead`/`Alert` is the source of truth and happens synchronously in the request handler; the BullMQ enqueue is wrapped in a transactional-outbox-style pattern (write an `OutboxEvent` row in the same Prisma transaction as the lead, a separate relay worker publishes it) so a Redis/queue hiccup never loses a lead.
- **OAuth (Google/Facebook sign-up in the modal):** handled by Passport.js/Auth.js strategies, idempotent by `(oauthProvider, oauthId)` via a Prisma `upsert`; on provider timeout, surface a retry affordance in the modal rather than failing the whole form (email/password fields stay usable).
- **Home-loan partner API (`Apply Home Loan`):** external dependency — `AbortController`-based timeout + circuit breaker; EMI *calculation* itself is a pure function run in the Node.js API (no external call), so the widget always renders even if the partner integration is down.
- **Prisma-specific:** wrap multi-table writes (e.g., lead + outbox event) in `prisma.$transaction([...])`; use Prisma's connection pool limits carefully in serverless deployments (see §5 — Prisma Accelerate/Data Proxy or PgBouncer if the API routes run on a FaaS platform rather than long-lived Node processes).
- **Client-side (React):** optimistic UI for favorite-toggle (`.fav`) with rollback on API failure (React Query/SWR `onMutate`/`onError`), matching the instant visual feedback the prototype's `script.js` already does client-only.

---

## 4. Scale and Reliability

### 4.1 Load estimation

- 5M MAU, ~3 searches/session avg, ~40% of MAU active on a peak day → ~2M searches/day → ~800 req/s at evening peak (assume 3x average-to-peak ratio).
- Property card fan-out: each search response aggregates ~20 listings × (price-tracker + favorite-state) — batch these into single multi-get calls (Elasticsearch `mget`, Redis `mget`, Prisma `findMany({ where: { id: { in: [...] } } })`) rather than N+1 per card.
- Lead volume: assume 1% of card views convert to `Contact Now` → tens of thousands of leads/day — trivial for Postgres, but the CRM webhook worker must handle bursts around evening peak.

### 4.2 Horizontal vs. vertical scaling

- **Node.js is single-threaded per process** — the API layer scales horizontally (multiple Node instances behind a load balancer / container orchestrator), not vertically; CPU-bound work (EMI batch recompute, price aggregation) is pushed to **BullMQ worker processes** so it never blocks the event loop serving `/api/search`.
- **Postgres**: vertical scale primary + read replicas for search-adjacent reads (listing detail); Prisma read-replica routing (or a lightweight proxy) directs `GET`-path queries to replicas. Writes (leads, listing CRUD) stay low-volume enough not to need sharding at year-1 scale.
- **Elasticsearch**: horizontal by design — shard by city (natural partition key matching the breadcrumb's city-first hierarchy) so hot cities don't skew shard load evenly.
- **Next.js**: static/ISR pages served from the CDN edge scale near-infinitely without hitting Node.js at all; only cache-miss and authenticated routes hit the origin.

### 4.3 Failover and redundancy

- Multi-AZ Postgres (primary + standby, synchronous replication for the leads/alerts tables given the durability requirement in §1.2, async acceptable for the listings tables).
- Elasticsearch cluster with ≥3 nodes, 1 replica per shard — search survives a single node loss with no user-visible impact.
- Redis in a managed HA configuration (e.g., sentinel/cluster mode) since it now backs both cache *and* the BullMQ job queue — losing it degrades both caching and lead-relay workers.
- CDN in front of SSR/ISR pages means a full origin outage still serves cached search/listing pages (stale but available) — appropriate given SEO/browse is the highest-availability requirement.

### 4.4 Monitoring and alerting

- **Golden signals per module:** latency (p50/p95/p99), error rate, saturation (Postgres connections — watch Prisma's pool exhaustion specifically, Node.js event-loop lag, ES thread pools), traffic — Prometheus + Grafana (or a hosted equivalent).
- **Business alerts, not just infra:** lead-write failure rate > 0.1% pages on-call immediately (durability promise in §1.2); search p95 > 300ms for 5 min triggers a warning; ES cluster yellow/red status; BullMQ queue depth/stalled-job count for the lead/notification workers.
- **Funnel tracking:** search → card view → Contact Now / favorite / alert-subscribe conversion rates, to catch silent UI/API regressions the infra dashboards wouldn't show (e.g., a broken `Contact Now` button that still returns 200 from an unrelated endpoint).

---

## 5. Trade-off Analysis

| Decision | Choice | Trade-off |
|---|---|---|
| Monolith vs. microservices | **Modular monolith (single Node.js codebase, domain-scoped modules — e.g., NestJS modules) at launch; split Search-indexing and Price-Analytics into separate worker processes first** | Full microservices upfront adds deploy/ops overhead a small team can't absorb; but Search-indexing and Analytics are split immediately because they run on different schedules/triggers (event-driven vs. cron) even if they stay in the same repo/monorepo |
| SPA vs. SSR | **Next.js (SSR + ISR) for `/search` and `/property/[id]`, client-rendered React for everything behind auth (favorites, alerts dashboard)** | SSR/ISR adds build/hosting complexity vs. a plain CRA SPA, but the breadcrumb + related-property tags in the prototype are meaningless without crawlable HTML — SEO is a hard requirement, not optional |
| API style | **REST (Express/Fastify/NestJS controllers)**, with **tRPC** as an explicit option if the Next.js frontend and Node backend live in one TypeScript monorepo | tRPC removes the hand-written-contract/OpenAPI overhead and gives end-to-end type safety with Prisma's generated types, but locks the API to TypeScript-only consumers — fine for a first-party web app, a constraint if a public/partner API is planned later |
| Search store | **Elasticsearch over Postgres full-text/`pg_trgm` indexes** | Higher operational cost (a second stateful system to run), but the sidebar's live facet counts (BHK/budget/locality) and geo-radius search are a poor fit for Postgres at this query volume. **MVP alternative:** ship v1 on Postgres full-text + `pg_trgm` + GIN indexes to avoid standing up ES at all, and migrate to Elasticsearch once facet/geo query volume justifies it |
| Event/queue backbone | **BullMQ on Redis** at launch, **Kafka** once cross-team/cross-service consumption grows | BullMQ keeps the whole stack to Node.js + Postgres + Redis (matches the requested stack tightly); Kafka adds real operational weight but is the right call once more than a handful of independent consumers need the same event stream |
| Lead durability | **Synchronous Prisma write + transactional outbox, not "enqueue on BullMQ and hope"** | Slightly higher write latency on `Contact Now`, but a lost lead is a lost sale — correctness wins over the extra ~10-20ms |
| Price-tracker freshness | **Nightly batch worker, not real-time** | Users get "as of yesterday" data on the widget, but real-time per-sqft repricing isn't meaningful for real estate (prices don't move minute-to-minute) — saves a lot of streaming-pipeline complexity for no real user benefit |
| Auth | **Own Identity module (Passport.js/Auth.js strategies for Google/Facebook + credentials, JWT sessions), not a third-party IDaaS** | More code to maintain, but the modal's signup flow is a core conversion surface (alerts, favorites) — owning it avoids vendor lock-in on the platform's primary growth lever |
| ORM/data-access | **Prisma over raw SQL or a lighter query builder** | Prisma's generated types + migrations are a strong fit for a TypeScript React/Node stack and keep the schema in `schema.prisma` as one source of truth, at the cost of Prisma's connection-pool behavior needing explicit handling (PgBouncer or Prisma Accelerate) if any part of the API is deployed to a serverless/FaaS runtime rather than long-lived Node processes |

### What to revisit as the system grows

- **Search sharding strategy** if a single city (e.g., a metro launch) dwarfs the others — city-based sharding assumes relatively even distribution.
- **BullMQ → Kafka migration** once the number of independent consumers per event (CRM, analytics, notifications, future recommendation engine) makes a single Redis-backed queue the wrong ownership boundary.
- **Split the modular monolith further** (Listing, Lead/Alert, Identity as standalone Node services) once team headcount and independent deploy cadence justify the operational cost — not before.
- **Move price-tracker/transaction-trends to near-real-time** only if a product need emerges (e.g., auction-style listings); the batch design is intentionally the cheaper default.
- **Denormalized "card view" read model** if the card-aggregation join (listing + price-tracker + favorite-state) becomes a latency bottleneck — precompute it (e.g., a materialized view refreshed by the same worker that updates Elasticsearch) instead of joining at request time.
- **Prisma connection management** if/when any API route moves to a serverless deployment target (e.g., Vercel Functions) — introduce PgBouncer or Prisma Accelerate before connection-pool exhaustion becomes an incident, not after.
- **Multi-region** once traffic expands beyond India-latency-tolerant users; current design assumes a single-region deployment with a CDN edge, not active-active multi-region.
