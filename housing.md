# Housing.com — Project Overview

A residential property listing/search platform, modeled on IndiaProperty.com. This document is the single entry point for the project: what the prototype shows, how the system is designed, and the tech-stack rules every implementation decision must follow.

---

## 1. Prototype

**Location:** [`input/prototype/`](input/prototype/) — a static, responsive HTML/CSS/JS prototype built from the reference screenshots in [`input/screenshots/`](input/screenshots/).

| File | Purpose |
|---|---|
| [`input/prototype/index.html`](input/prototype/index.html) | Full page markup: header, search/filter bar, breadcrumb, sidebar filters, property grid, notify modal |
| [`input/prototype/css/style.css`](input/prototype/css/style.css) | Responsive styling (desktop → tablet → mobile breakpoints at 1024px / 860px / 600px) |
| [`input/prototype/js/script.js`](input/prototype/js/script.js) | Interactivity: collapsible filters, tab switching, favorite toggle, notify modal open/close, mobile nav |

### What it covers
- **Header** — logo, Research/Explore/Assistance nav, Home Loan CTA, Sell/Rent for Free CTA, Sign In, app download icon.
- **Search & filter bar** — city selector, Buy toggle, free-text search (localities/builders/projects), price and property-type dropdowns, favorites/alerts icon badges.
- **Breadcrumb** — `Home > Chennai > Real Estate > Residential Property > Search AllResidential in Chennai`.
- **Sidebar (`Quick Refine`)** — collapsible facets: BHK, Property Type, Top/Nearby Localities, Budget Range.
- **Content toolbar** — All properties / Affordable Homes / New Projects tabs, `Set Property Alerts`, related-properties tag strip, sort-by dropdown.
- **Property cards** — price, area, title, status, favorite star, `Contact Now`, project/owner + updated timestamp, EMI + Apply Home Loan, `pricetracker` (low/avg/high per sq.ft), key amenities, transaction-trends link.
- **Notify modal** — city/locality/price/BHK preference capture, Sign Up with Google/Facebook, Name/Email/Password/Mobile form, Get Notified.

### Running it locally
```bash
cd input/prototype && python3 -m http.server 8834
```
Then open `http://localhost:8834`. (`.claude/launch.json` is pre-configured for the Browser pane — update its `runtimeArgs` path if the prototype folder moves again.)

This prototype is the **spec**: every backend service and API described in System Design exists to make one or more elements on this page real (see the traceability table in [`housing_architecture.md`](housing_architecture.md) §1.1).

---

## 2. System Design

Full architecture — requirements, component diagram, data flow, Prisma data model, caching/queue design, scale estimates, and trade-offs — lives in **[`housing_architecture.md`](housing_architecture.md)**. Summary:

- **Client:** React (Next.js) — SSR/ISR for `/search` and `/property/[id]` (SEO-critical, matches the breadcrumb + related-properties tags in the prototype), client-rendered React for authenticated views (favorites, alerts dashboard).
- **API layer:** Node.js BFF/API (Express/Fastify/NestJS modules), domain-scoped: Identity/Auth, Search & Filter, Listing, Lead & Alert, Price Analytics worker.
- **Search:** Elasticsearch for faceted + geo + text search (sidebar facet counts, city-sharded); Postgres `pg_trgm` full-text noted as a lighter MVP fallback.
- **Cache & queue:** Redis for hot-path caching (search results, facet lists, favorite/alert counters, `pricetracker` snapshots) and as the BullMQ broker for async work (lead relay, notifications, nightly price recompute).
- **Storage:** PostgreSQL (system of record) via Prisma; S3-compatible object storage + CDN for property images; ClickHouse/BigQuery for price-tracker and transaction-trend analytics.
- **Key flows documented:** search & filter (searchbar → sidebar → grid, one aggregated round trip), lead capture (`Contact Now` / notify modal → synchronous durable write + transactional outbox → async CRM/notification fan-out).
- **Reliability:** lead writes are always synchronous-durable (never silently dropped); search degrades to Postgres if Elasticsearch is down; SSR/ISR pages stay servable from the CDN edge during an origin outage.

For the full requirements traceability, API contracts, Prisma schema, and trade-off analysis, see [`housing_architecture.md`](housing_architecture.md).

---

## 3. Tech Stack (rule)

**These are fixed project conventions — every service, module, and PR should conform to this stack unless explicitly revisited in an ADR.**

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | **React.js** (Next.js) | SSR/ISR for public, SEO-facing routes; CSR for authenticated/interactive views. TypeScript. |
| **Backend** | **Node.js** | API layer and background workers (BullMQ). TypeScript. Domain-modular monolith at launch — see architecture doc §5 before splitting into separate services. |
| **ORM** | **Prisma** | Single `schema.prisma` as the source of truth for the data model; Prisma Migrate for schema changes; Prisma Client for all DB access — no raw SQL/hand-rolled query builders unless Prisma cannot express the query. |
| **Database** | **PostgreSQL** | System of record for users, listings, leads, alerts, favorites, projects. Read replicas for search-adjacent reads as load grows. |
| **Cache / queue** | Redis (+ BullMQ) | Hot-path caching and the async job broker; do not introduce Kafka until the trade-off in the architecture doc's §5 is actually triggered. |
| **Search** | Elasticsearch | Only for faceted/geo/text search once volume justifies it; Postgres full-text is the acceptable MVP substitute. |

Any deviation from this stack (a different frontend framework, a non-Prisma data-access layer, a non-Postgres datastore for transactional data) should be called out explicitly as a trade-off, not introduced silently.
