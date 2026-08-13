# Backtrack — Interview Notes

This file is a living record of product decisions, architectural choices, and implementation rationale for Backtrack, the history-based travel planner project. It is meant to help explain the project clearly in interviews and will be updated as the project evolves.

## Current State (as of 2026-08-13)

- **Backend**: Node/TypeScript, raw `node:http` (no framework). An 8-stage deterministic planner pipeline (`backend/src/planner/`). Postgres persistence via the raw `pg` driver and hand-written SQL migrations — no ORM.
- **Frontend**: React/TypeScript, map-dominant UI built on `react-leaflet` with real OpenStreetMap/CARTO tiles. Talks to the real API — no mock data path in the running app.
- **Data**: 27 Istanbul sites, 6 themes, 25 site relationships, version-controlled as TypeScript seed files and loaded into Postgres by a seed script.
- **Tests**: 49 tests via Node's built-in `node:test` — 41 pure unit tests against in-memory fixtures, 8 integration tests against the real seeded database.
- **Not yet built**: public deployment; the Wikidata/Wikipedia + Reddit data-sourcing pipeline (schema already reserves `source_url`/`source_attribution` columns for it); accounts/saved trips; transit-aware routing.
- Single initial git commit as of 2026-08-13 — the project was built before being put under version control, so there's no earlier commit history to speak of.

See `README.md` for how to actually run it. The rest of this file is the "why" behind each of these — useful for going deeper in an interview than "it uses Postgres."

## Project Thesis

Build a travel-first web app for Istanbul that generates geographically efficient, historically informed itineraries based on traveler constraints such as trip length, daily hours, walking tolerance, budget sensitivity, familiarity with the city, and selected themes.

The key differentiator is that the app is not just a recommendation list. It is a planning system that balances practical travel constraints with historical relevance.

## Why This Project

This project was chosen to strengthen new grad SWE recruiting signal in areas not fully covered by existing resume experience:

- End-to-end product ownership
- Full-stack application design
- Constraint-aware backend logic
- Structured data modeling
- Interactive geospatial UI

The goal is to avoid building a thin AI wrapper and instead build a real software system with clear product value and explainable logic.

## Product Direction

### Core Product Framing

Travel-first planner with historical intelligence.

The app should help a user answer:

- What should I see in Istanbul?
- How can I fit it into my available time?
- How do I avoid wasting time crossing the city inefficiently?
- How can I learn the city through historically meaningful places?

### MVP Scope

- City: Istanbul only
- Trip lengths: 1 to 3 days
- Output: one itinerary per request
- No accounts or saved trips in v1
- No transit optimization in v1
- No AI in the core planner
- No food/market planning as a first-class feature in v1

### User Inputs

- Number of days
- Hours available per day
- Walking tolerance
- Budget sensitivity
- Familiarity with Istanbul
- Selected historical themes
- Must-see sites selected from seeded locations

### Output Expectations

- Day-by-day itinerary
- Ordered stops on a map
- Visit and travel time estimates
- Required vs optional stops
- Historical significance per stop
- Reason each stop was included
- Ticketing and timing notes
- Related nearby sites

## Locked Historical Themes

- Byzantine
- Ottoman
- Religious History
- Architecture
- Neighborhood Change
- Modern Political History

## Architecture Decisions

### Frontend

- React + TypeScript
- Map-first experience
- Main surfaces: preferences form, itinerary panel, map, stop detail drawer

Why:

- Strongest demo value
- Best fit for a spatial planning product
- Good signal for user-facing engineering and complex client state

### Backend

- Node + TypeScript
- Standard controller -> service -> repository structure
- Planner implemented as a dedicated subsystem within the service layer

Why:

- Faster execution with existing experience
- Shared types across frontend and backend
- Keeps focus on planning logic and product quality instead of learning a new backend language

### Data Layer

- Postgres, accessed through the raw `pg` driver with hand-written SQL — no ORM or query builder
- Four tables: `sites`, `themes`, `site_themes` (join table), `site_relationships` — `slug` is the natural primary key everywhere, not a surrogate `id`
- A small hand-rolled, checksummed migration runner instead of a migration library
- Seed data lives in version-controlled TypeScript files (`backend/src/seed/*.seed.ts`); a seed script truncates and reloads Postgres from them, so the TS files remain the source of truth

Why:

- Planner needs structured data, not freeform text
- Relational modeling fits sites, themes, and cross-site links well
- Supports explainable and deterministic itinerary generation
- No ORM means every query is something hand-written and explainable, not generated — consistent with the rest of the backend's no-unnecessary-dependencies pattern (raw `node:http` server, `node:test` instead of Vitest/Jest)
- Full rationale for the specific schema choices (`slug` vs. surrogate key, `CHECK` vs. Postgres `ENUM`, `float8` vs. `numeric`, the migration checksum design) is in the 2026-08-13 entry in the Implementation Log below — that level of detail lives there rather than being duplicated here

## Planner Philosophy

The planner is the technical core of the project.

### Priority Order

1. Include must-see sites whenever feasible
2. Respect trip time and walking constraints
3. Prefer geographically coherent routes
4. Maximize theme relevance and historical value
5. Add optional supporting stops where space allows

### Must-See Policy

Must-see sites are treated as hard-priority inputs.

- The planner should sacrifice some route efficiency before dropping a must-see
- If a must-see truly cannot fit, the app should return a warning instead of silently removing it

### Why No AI-Centric Planner

The project is intentionally designed to avoid being a generic AI wrapper.

AI may be added later for explanation enrichment, but the core itinerary generation should remain:

- Deterministic
- Explainable
- Structured
- Testable

This is better for both product trust and recruiting differentiation.

## Core Backend Modules

- `candidate-filter`
- `site-scorer`
- `anchor-selector`
- `site-clusterer`
- `day-allocator`
- `route-optimizer`
- `optional-stop-selector`
- `itinerary-explainer`

These modules separate the planning pipeline into explainable stages rather than hiding logic in one large service.

## Data Modeling Decisions

### Core Tables

- `sites`
- `themes`
- `site_themes`
- `site_relationships`

### Important Site Fields

- Coordinates
- Neighborhood
- Estimated visit duration
- Typical wait time
- Cost category
- Booking/ticket requirements
- Theme weights
- Editorial priority
- Familiarity hint

Why:

These fields are what allow the planner to reason about feasibility, value, and tradeoffs.

## Current Seed Strategy

- 27 Istanbul sites seeded (within the original 25–35 target range), across 6 themes and 25 site-to-site relationships
- Mix of iconic anchors and more niche supporting locations
- Include a small number of area-style entries such as Balat/Fener walking areas
- Focus on landmarks and historically meaningful areas in v1

### Anchor Examples

- Hagia Sophia
- Blue Mosque
- Topkapi Palace
- Basilica Cistern
- Suleymaniye Mosque
- Galata Tower
- Chora Church
- Dolmabahce Palace

## Relationship Strategy

Relationship types (defined in the domain model, `backend/src/types/domain.ts`):

- `nearby`
- `same-era`
- `same-theme`
- `paired-visit`
- `contrast-over-time`

The current seed data uses 4 of the 5 (no `same-era` links yet — a natural next addition when the seed set grows).

Why:

Relationships make the planner feel more intentional and also create a path to future narrative itinerary features.

## Interview Angles

### One-Sentence Version

Built a full-stack history-based travel planner for Istanbul that generates geographically efficient, constraint-aware itineraries using structured site metadata, theme-based ranking, and map-based route visualization.

### Two-Sentence Version

I wanted to build something that felt like a real consumer product, not just a technical demo, so I created a travel-first planner that helps users explore Istanbul through historical themes while respecting practical constraints like time, walking tolerance, and budget. The core engineering challenge was designing an explainable planning engine that could prioritize must-see sites, score historically relevant locations, and generate geographically coherent day-by-day itineraries.

### Key Differentiators

- Not a generic AI wrapper
- Strong user-facing product experience
- Real planning and tradeoff logic
- Structured data model instead of unstructured content blobs
- Clear room for future narrative and transit-aware extensions

## Recruiting Optimizations To Preserve

- Keep the planner explainable
- Keep the core logic deterministic
- Build a polished map-based demo — done, real `react-leaflet` map as of 2026-08-12
- Write unit tests for planner logic — done, 49 tests as of 2026-08-13
- Use a real database, not mock/in-memory data — done, Postgres as of 2026-08-13
- Preserve architectural clarity over premature complexity
- Keep a clear story for tradeoffs and why each subsystem exists

## Planned Post-MVP Extensions

Near-term, already scoped in conversation:

- Public deployment
- A data-sourcing pipeline: Wikidata/Wikipedia as the primary source for structured, attributable site facts, with Reddit as a secondary human/trend signal — combined in a scoring formula that deliberately avoids over-weighting virality. The `source_url`/`source_attribution` columns already exist on `sites` for this.

Longer-term, not yet scoped:

- Narrative story arcs by day
- Transit-aware routing
- Multiple itinerary options
- Saved trips and accounts
- Additional cities
- AI-assisted explanation refinement

## Notes To Keep Updating

As implementation begins, keep appending:

- Important tradeoffs
- Rejected alternatives
- Interesting bugs or planner edge cases
- Test strategy
- Performance decisions
- Demo decisions
- Resume bullet candidates

## Implementation Log

### 2026-07-20

- Created the initial repo structure with `backend/` and `frontend/` roots.
- Added stable domain types before writing planner logic so the backend and frontend can share a consistent mental model.
- Seeded the six locked Istanbul themes.
- Started the Istanbul dataset with high-signal anchor and support sites instead of trying to add all 30 at once.
- Added an initial relationship layer focused on the highest-value clusters:
  - Sultanahmet
  - Beyoglu/Galata
  - Balat/Fener
  - a few cross-cluster historical links
- Added the planner pipeline skeleton as separate modules instead of hiding logic in one service:
  - candidate filter
  - site scorer
  - anchor selector
  - site clusterer
  - day allocator
  - route optimizer
  - itinerary explainer
- Added repository, service, and controller scaffolding to preserve the architecture we want to discuss in interviews.
- Replaced empty planner placeholders with a first working heuristic pipeline:
  - score sites using themes, editorial priority, cost, time, familiarity, and relationships
  - choose anchors from high-priority results
  - cluster supporting sites around anchors
  - allocate stops into days under rough time constraints
  - route each day with a nearest-neighbor walking heuristic
  - mark overflow stops as optional
- Added a simple backend demo entry so the planner can be exercised with a realistic sample request.
- Verified the backend demo path runs locally and returns a real multi-day itinerary JSON payload.
- Added the first frontend shell around the current itinerary contract using mock planner output instead of inventing a disconnected design-only UI.
- Added standard frontend bootstrapping files for a React + Vite setup so the UI can be mounted and evolved in a normal production-style workflow.
- Verified the frontend build succeeds and the Vite dev server runs locally, giving the project both a working backend demo path and a live UI shell.
- Replaced the frontend mock-only data flow with a real HTTP integration path using a lightweight local API server and frontend fetch hook.

### 2026-08-12

- Replaced the first-pass "editorial travel magazine" UI (serif display font, cream/terracotta palette, hero banner, always-open sidebar form) with a map-dominant redesign: a fixed dark side panel (compact/collapsible preferences + day-by-day itinerary timeline) next to a full-height real map.
- Replaced the fake CSS/SVG map (hardcoded water shapes and a hand-rolled lat/lng-to-percent projection) with a real `react-leaflet` map using free CARTO/OpenStreetMap tiles: real polylines between stops, day-colored numbered markers, click-to-view popups, and bounds that auto-fit to the active day's stops.
- Renamed the product from "Chronicle" to "Backtrack" in the UI to match the actual project name.
- Verified end-to-end against the live backend (not the mock fixture) with a scripted headless-browser pass: desktop and mobile layouts, preferences expand/collapse, day-tab switching updates both the itinerary and the map, marker popups, zero console errors.

### Why

- The previous UI leaned on stock "travel blog" signifiers (serif display type, wax-stamp graphic, soft editorial palette) that read as generic/templated rather than as a deliberately designed product.
- A map-dominant layout was chosen because the planner's core value is spatial (geographically coherent routes), so the map should be the primary surface, not a secondary decorative element — this also forced replacing the fake map, since a map-dominant layout built around illustrated water shapes would have undercut the "real geospatial UI" claim in the resume framing for this project.

### 2026-08-12 (continued)

- Added the planner's first unit test coverage: 45 tests across all 8 planner modules plus the distance/travel-time utility and an end-to-end `ItineraryService` smoke test that runs against the real seeded Istanbul data (not fixtures), using Node's built-in test runner (`node:test`/`node:assert`) rather than adding Vitest/Jest — no new dependency, runs the same way the rest of the backend already does (`node --experimental-strip-types`).
- This was deliberately sequenced before the planned Postgres migration so the tests act as a regression net once `SiteRepository` moves off in-memory seed arrays.

### 2026-08-13 — Postgres migration

- Replaced `SiteRepository`'s in-memory seed arrays with a real local Postgres database (Docker Compose, `postgres:17-alpine`). Raw `pg` driver and hand-written SQL — no ORM, no query builder — to match the backend's existing no-unnecessary-dependencies pattern and so every query is something we wrote and can explain.
- Schema: `themes`, `sites`, `site_themes` (join table), `site_relationships` — four tables, `slug` as the natural primary key everywhere rather than a surrogate `id`, since the app already addresses sites by slug throughout (must-see lists, relationship endpoints, frontend routes). `sites` also gained two nullable columns, `source_url` and `source_attribution`, unused today but reserved for the future Wikidata/Wikipedia/Reddit data-sourcing feature, so that work is a data change rather than another migration.
- Hand-rolled a small migration runner (`backend/src/db/migrate.ts`) instead of adding a migration library: numbered, forward-only SQL files, applied in a transaction, tracked in a `schema_migrations` table with a checksum of each file's contents — editing an already-applied migration throws instead of silently diverging between environments. No down-migrations; `npm run db:reset` (drop the volume, re-migrate, re-seed) is the honest reset story for a solo project with a disposable local database.
- `SiteRepository.getAllSites` runs three queries (sites, their themes, their relationships) and joins them in memory, rather than one query per site (N+1) or one wide JOIN that would duplicate every site's row per theme × relationship pair.
- The async ripple from `SiteRepository` touched 5 functions across 4 layers (`ItineraryService`, both controllers, `server.ts`, `demo.ts`) — but the entire 8-stage planner pipeline underneath `ItineraryService.generateItinerary` stayed untouched and fully synchronous, and 41 of the 45 existing tests needed zero changes. That's the payoff of keeping the planner as pure functions with I/O only at the edges.
- Fixing this migration's own risk: `server.ts`'s single try/catch around parsing *and* generating would have reported a database outage to the client as `400 Invalid itinerary request payload` once generation became a real async DB call — split into two try blocks so client errors (400) and server errors (500) stay distinct. Also added `tsconfig.backend.json`, since the backend was previously excluded from type-checking entirely (`tsconfig.app.json` excludes it) — directly guards against a forgotten `await` silently producing an empty itinerary instead of an error.
- Found and fixed a real pre-existing data bug while adding that type-checking: three sites (`pera-museum`, `cicek-passage`, `rumeli-fortress`) had `familiarityLevelHint: "knowledgeable"`, which isn't a valid value for that field (confused with the separate, similarly-named `FamiliarityLevel` used for user preferences). Never caught before because nothing type-checked the backend, and it also would have been rejected outright by the new `CHECK (familiarity_level_hint IN (...))` constraint during seeding. Fixed to `"enthusiast"`, the correct semantic value for "aimed at visitors who already know a lot."
- Left one other known data-quality issue as-is on purpose: Hagia Sophia and Topkapi Palace have a `paired-visit` relationship listed in both directions, which double-counts a small relationship-strength bonus for both sites in `site-scorer.ts`. Preserved deliberately during this migration so the before/after itinerary diff was a clean, verifiable zero-change check; worth fixing as its own small, separately-explainable change later.
- Planning process note: used an Opus-model subagent for the design phase (it read the actual code rather than assuming, and caught things like the `pg` CJS/ESM import gotcha, `NUMERIC` columns returning JS strings instead of numbers, and the `SiteController` call site that the original ripple list missed), then implemented the approved plan directly. Worth remembering as a pattern for future non-trivial changes on this project.

### 2026-08-13 — Public deployment

- Live at https://backtrack-planner.web.app (frontend, Firebase Hosting) talking to https://backtrack-api-218665896593.us-east4.run.app (backend, Google Cloud Run), backed by Neon Postgres. All three sit inside permanent free tiers at this traffic level — realistic cost is $0/month.
- Compared three hosting paths before choosing: Vercel+Render+Neon (genuinely free, no card, but Render's free tier sleeps after 15 min and takes 30-60s to wake — bad for a link a recruiter might click cold); AWS Lambda (similarly ~$0 but requires rewriting the backend into a Lambda handler); GCP Cloud Run (chosen — runs the existing Docker container unchanged, ~1-3s cold start, and a card on file is required for GCP billing but real charges should stay at $0). The AWS/GCP options both need a credit card even though usage is free; picked GCP specifically because it needed no rewrite, not because it's cheaper.
- Explicitly decided against engineering around Cloud Run's cold start (no keep-warm cron, no `min-instances=1`) — 1-3 seconds is short enough to just accept, backed by the loading state the UI already had. This was a deliberate simplicity-over-polish tradeoff, not an oversight.
- Fixed a real blocking bug found during planning: the server hardcoded `127.0.0.1:8787`, which is unreachable from outside any container — now reads `PORT`/`HOST` from the environment, defaulting to today's behavior locally.
- Frontend reaches the backend via a build-time `VITE_API_BASE_URL`, inlined into the JS bundle at `npm run build` — chosen over a same-origin proxy/rewrite specifically so a slow or failing backend surfaces as an ordinary slow `fetch` (which the existing error handling already covers) rather than a platform-edge timeout error.
- Tightened CORS from a permanent wildcard to an `ALLOWED_ORIGINS` allowlist — explicitly framed as hygiene, not security, since the API has no auth/cookies and a wildcard didn't actually expose anything a direct `curl` couldn't already reach.
- Added a second guard to `db:seed` beyond the existing `NODE_ENV` check: it now refuses to run against any non-localhost `DATABASE_URL` unless `ALLOW_REMOTE_SEED=true` is explicitly set, closing the realistic accident of truncating production data from a laptop with a stray env var still exported.
- Verification mirrored the Postgres migration's approach: diffed `npm run demo:backend` output against the same request made through the live Cloud Run URL — empty diff (after normalizing JSON formatting, which produced a false-positive diff on the first pass) confirmed the deployed code and Neon's seeded data are both correct, independent of anything UI-related.
- Two planning passes were used for this, not one: the first Opus pass evaluated Vercel+Render+Neon in general; a second pass specifically re-targeted the runbook at Cloud Run + Firebase Hosting once GCP was chosen, since the deployment mechanics (container build/push, env var syntax, CORS origins) differ enough by platform to need their own accurate research rather than adapting the first plan by hand.

### Why This Order

- Data and types come first because planner quality depends on structured inputs.
- The initial seed set favors iconic anchors plus a few distinctive niche locations so the demo can be compelling early.
- Relationship seeds were added early because they support both route quality now and future narrative-arc features later.
- Planner module scaffolding was added early so algorithm work can evolve incrementally without turning into one large application service.
- The first planner implementation is intentionally heuristic rather than mathematically optimal so the product can become demoable quickly while leaving room for later improvement.
- Making the demo runnable early is useful for both product iteration and interviews because it gives a concrete artifact to test, inspect, and explain.
- The first UI pass is intentionally contract-driven. That keeps the frontend grounded in real planner output and reduces the risk of building a beautiful interface that the backend cannot support.
- Frontend bootstrapping was kept standard and unsurprising because the project’s differentiation should come from product quality and planning logic, not unusual tooling choices.
- The first API integration is intentionally lightweight and uses Node's built-in HTTP server rather than a larger framework so we can validate the product loop quickly before adding backend infrastructure complexity.
