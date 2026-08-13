# Backtrack — Interview Notes

This file is a living record of product decisions, architectural choices, and implementation rationale for Backtrack, the history-based travel planner project. It is meant to help explain the project clearly in interviews and will be updated as the project evolves.

## Current State (as of 2026-08-13)

- **Backend**: Node/TypeScript, raw `node:http` (no framework). An 8-stage deterministic planner pipeline (`backend/src/planner/`). Postgres persistence via the raw `pg` driver and hand-written SQL migrations — no ORM.
- **Frontend**: React/TypeScript, map-dominant UI built on `react-leaflet` with real OpenStreetMap/CARTO tiles. A 7-step preferences wizard collects real user input before generating an itinerary — no hardcoded defaults, no mock data path in the running app.
- **Data**: 27 Istanbul sites, 6 themes, 24 site relationships — hand-curated content, enriched with real sourced facts and interest/trend/social signals from Wikidata, Wikipedia, and Stack Exchange (`backend/src/ingest/`), combined in a scoring formula that keeps editorial judgment dominant over raw popularity.
- **Tests**: 64 tests via Node's built-in `node:test` — pure unit tests against in-memory fixtures plus integration tests against the real seeded database.
- **Live**: deployed publicly (Cloud Run + Firebase Hosting + Neon) — see README's "Live" section for URLs. Every push to `main` auto-deploys via GitHub Actions using keyless Workload Identity Federation (no long-lived credentials anywhere).
- **Not yet built**: accounts/saved trips; transit-aware routing; site discovery beyond the curated 27 (the ingestion pipeline enriches existing sites, deliberately does not auto-add new ones — see the 2026-08-13 entries below for why).
- Git history starts 2026-08-13 — the project was built before being put under version control, so there's no earlier commit history to speak of.

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

### 2026-08-13 (continued) — Small fixes

- Fixed the known Hagia Sophia/Topkapi duplicate reciprocal relationship (deliberately left in place during the Postgres migration to keep that migration's verification clean) — removed the redundant reverse entry, re-seeded both local and production databases.
- Added GitHub Actions CI (`.github/workflows/test.yml`) running typecheck, frontend build, and the full test suite against a Postgres service container on every push/PR to `main` — passed on the first run.
- Added a $1 GCP billing budget alert (`gcloud billing budgets create`) — purely a notification, doesn't cap spend, but converts "I think this is free" into "I'll know within a day if it isn't."

### 2026-08-13 (continued) — Data sourcing pipeline: Wikidata + Wikipedia + Stack Exchange

Two more Opus research/planning passes preceded implementation: one that called Wikidata/Wikipedia/Reddit/Stack Exchange live to verify current rate limits, auth requirements, and licensing before designing around them (general knowledge here would have been wrong — see below), and a second after the user chose to evaluate every decision through a "which reads better in an interview" lens specifically, not just engineering merit.

**What shipped:**
- 27 sites enriched with real Wikidata QIDs (hand-verified against coordinates, not fuzzy-searched — see `backend/src/ingest/qid-map.ts`'s comment for why fuzzy search is actively dangerous here), Wikipedia article links, and 24 months of English *and* Turkish pageview history (`backend/src/ingest/`).
- A scoring formula (`backend/src/ingest/signal-scorer.ts`) that combines real interest/trend/social signals with the existing hand-curated `editorialPriority`, deliberately weighted so sourced signals (max ±20 points) can never outweigh editorial judgment (a 40-point spread) — enforced as an executable test (`site-scorer.test.ts`'s "editorial dominance invariant"), not just a paragraph of intent.
- `npm run ingest:sync`: a build-time code generator, not a live sync into Postgres — writes two committed, git-reviewed TypeScript files that `db:seed` then loads normally. Production (Cloud Run) never calls any external API as a result — zero new secrets, zero new production failure modes.
- Attribution surfaced through the real request path: `ItineraryStop.sources` → a "Source: Wikipedia ↗" link per stop in the UI, satisfying Wikimedia's own attribution terms (a hyperlink is sufficient) without ever storing Wikipedia's CC BY-SA prose — only CC0 facts (coordinates, dates) plus a link are shipped, so the app never crosses into ShareAlike territory at all.

**Reddit was planned, then confirmed blocked, then replaced — a real-time finding, not a hypothetical.** The plan initially treated Reddit access as uncertain (its own docs were Cloudflare-blocked to automated research). The user then hit `reddit.com/prefs/apps` directly and got redirected to a manual "Responsible Builder Policy" approval form — self-service script-app registration is gone as of 2026, replaced by an application process third-party sources describe as slow and skewed toward commercial use. Verified this live with a follow-up web search once it happened, rather than treating it as settled from the original research. Swapped to the Stack Exchange Travel API instead (no auth, works today) — the provider interface (`social-provider.ts`-shaped) was designed to make this swap not touch `signal-scorer.ts` at all.

**Verified empirically, not assumed, and it mattered:**
- Wikipedia article titles move — Blue Mosque's English article moved from "Sultan Ahmed Mosque" to "Blue Mosque, Istanbul," and pageview counts split across both. Querying the wrong title silently undercounts by 6x with no error. Solved by always resolving the canonical title fresh rather than persisting one.
- Real pageview data actively supports keeping `editorialPriority` rather than replacing it with popularity: Chora Church — one of the most historically significant Byzantine sites in the set — has fewer monthly Wikipedia views than the Balat neighborhood article. Popularity and historical value genuinely diverge in this project's own data, which is this project's whole thesis.
- Stack Exchange's Travel community has very sparse content per individual Istanbul landmark — zero results for "Basilica Cistern" and "Dolmabahce Palace," two of the most famous sites in the set. Not treated as a failure: the scoring formula's breadth gate (fewer than 3 distinct posts caps the social score at 0.5) already handles sparse/zero data gracefully rather than needing a special case.
- The Wikidata REST API's coordinate response nests under `value.content.latitude/longitude`, not `value.latitude/longitude` as initially assumed from the research summary — caught by testing the real response shape with `curl` before trusting the parsing code, not after.

**Four decisions were evaluated specifically for resume/interview value, not just engineering merit** (three landed the same as the engineering-only recommendation, one flipped):
- Build-time codegen over live sync — "I decoupled production from third-party API uptime" is a more specific, more senior-sounding answer than "I built a data pipeline."
- Facts-only over shipping Wikipedia's prose — licensing awareness (CC0 vs. CC BY-SA) reads as maturity beyond coding ability.
- Two typed tables over a generic EAV signals table — EAV is a well-known anti-pattern; "why would you do that" is as likely a reaction as being impressed.
- **Flipped**: added Turkish Wikipedia pageviews to v1 rather than deferring to v2, specifically because the added cost was trivial (one more API call per site) and "I identified and corrected for English-language bias in interest data" is a distinctive, thematically-consistent story worth the small extra scope.

### 2026-08-13 (continued) — Preferences wizard: completing the customer journey

- Found a real, significant gap while planning what to build next for stronger resume bullets: the deployed app had no way for a visitor to actually plan their own trip. `usePlannerData` auto-generated an itinerary from a hardcoded `defaultPreferences` object on page load, and the sidebar's "Adjust preferences" button had no click handler at all. Every visitor — including anyone clicking the resume link — saw the identical fixed itinerary, with zero interactivity on the one thing the product claims to do. Reprioritized this above every other candidate next step (multiple itinerary options, API rate limiting, finishing CI/CD) once it was found, since a feature enhancement on top of a broken core loop matters less than the core loop not existing.
- Built a 7-step wizard (one question per screen — days, hours/day, walking tolerance, budget sensitivity, familiarity, themes, must-see sites) instead of a single all-at-once form. The user's explicit reasoning for wanting steps over a form: today's 6 inputs don't need pacing, but more parameters are likely later, and a wizard absorbs that without restructuring. Built as a config-driven array of step definitions (`wizardSteps.tsx`) for exactly that reason — adding a future parameter is one array entry, not new page logic.
- The must-see step finally exercises `fetchSites()` (`GET /api/sites`), which was previously written but imported nowhere — dead code since the Postgres migration. Sites are grouped by real neighborhood rather than a flat list of 27.
- "Adjust preferences" now actually works, and specifically re-opens the wizard **pre-filled** with the previous answers rather than resetting to blank — the difference between "start over" and "let me tweak one thing," which matters for a tool someone might iterate on.
- Verified with a scripted browser pass rather than just visual inspection: confirmed the wizard (not an itinerary) is what a fresh visitor actually sees, that step validation genuinely blocks progression (Next stays disabled until the current step has an answer), that the must-see step's site chips are real fetched data (27 of them) not a mock list, and that the generated itinerary's content changes to match whatever was actually submitted in the wizard — not the old fixed defaults.

### 2026-08-13 (continued) — CI/CD: auto-deploy on push

- Extended the existing GitHub Actions CI (`test.yml`) into real continuous deployment: every push to `main` runs tests, then — only if they pass — deploys the backend to Cloud Run and the frontend to Firebase Hosting for real. Deferred from the original deployment work until the manual deploy path had been proven reliable, which by this point it had been many times over.
- **Authentication: Workload Identity Federation, not a service account JSON key.** A JSON key is a bearer credential with no expiry and no origin binding — anyone who obtains the bytes is that service account, forever, from anywhere. WIF instead has GitHub mint a short-lived OIDC token per workflow run, which GCP's Security Token Service exchanges for access **only** after checking an attribute condition against the token's claims — in this case, "is this literally `aakenapalli/backtracker`, on `refs/heads/main`." A leaked WIF token is unusable outside a GitHub Actions runner and expires in about an hour. There is no secret sitting in GitHub for anyone to ever steal, on a public repo where that matters more than usual. Verified the exact `gcloud iam workload-identity-pools` setup commands live rather than trusting older tutorials — some details (like the OIDC issuer URI needing no trailing slash, contradicting some of Google's own doc examples) had actually drifted.
- **Two deploy service accounts, not one**, each with the minimum role that actually does the job: `roles/run.sourceDeveloper` for the backend (notably does *not* include the permission to change a Cloud Run service's public/private IAM policy — so CI can ship new code but structurally cannot make the service private or public), `roles/firebasehosting.admin` for the frontend, each restricted to `roles/iam.serviceAccountUser` on only the one resource it needs, not the whole project. The split means the job that ships the frontend has zero ability to touch backend infrastructure and vice versa.
- Read the actual source of the `deploy-cloudrun` GitHub Action (not just its README) before trusting it not to repeat a mistake from the manual-deploy days: confirmed that leaving its `env_vars` input empty emits no environment-related flag at all to the underlying `gcloud run deploy` call, so `DATABASE_URL`/`ALLOWED_ORIGINS`/`NODE_ENV` on the live service survive a CI deploy untouched — the same footgun (`--set-env-vars` silently wiping existing config) that bit a manual deploy earlier in this project could not resurface here by construction. Added a runtime assertion step that checks this directly anyway, rather than trusting the source-reading alone.
- **A real production bug found and fixed during rollout, not just a hypothetical:** the first live (non-dry-run) CI deploy reported success and created a real new container revision — but production kept silently serving the *old* revision. Root cause: an earlier verification pass had deliberately deployed with `--no-traffic --tag=citest` to test the pipeline without risking production, which switches a Cloud Run service from "always serve the latest revision" mode into a pinned, named-revision traffic split. A plain deploy afterward does not automatically undo that — it just adds a new revision without reclaiming traffic. The existing health-check step didn't catch this because it curls the service's stable public URL, which kept responding fine from the *old* revision the whole time — proving the service was up, not that the deploy had actually taken effect. Fixed two ways: made every deploy explicitly request `revision_traffic: LATEST=100` rather than relying on ambient service state, and added a second, more specific assertion step that inspects `status.traffic` directly for 100% on the revision tagged `latestRevision`. This is exactly the class of bug worth being able to describe precisely in an interview: a deploy that reports "success" is not the same claim as "this is what's actually being served," and the fix generalizes past this one incident.
- Verification was staged deliberately to keep production safe throughout: first a dry-run deploy (`--no-traffic`, zero production traffic) to prove auth and the pipeline mechanics worked at all; only once that was confirmed clean was the dry-run flag removed for a real deploy. The traffic bug above was caught at that final step, fixed, and re-verified — production was never actually broken by any of this, only temporarily "stuck" serving a known-good older revision while newer ones silently failed to take over.
- One verification item explicitly not empirically tested: that a failing test on a pull request correctly skips both deploy jobs rather than just failing them. This is relied upon as GitHub Actions' well-documented default `needs:` behavior (a failed dependency skips dependents automatically) rather than proven with a real PR, since doing so would have required setting up a GitHub API token/`gh` CLI purely for that one check — a reasonable thing to actually verify before fully trusting this pipeline, flagged here rather than silently assumed as tested.

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
