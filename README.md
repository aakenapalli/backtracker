# Backtrack

Travel-first web app for Istanbul that generates geographically efficient, historically informed itineraries based on user constraints such as trip length, daily hours, walking tolerance, budget sensitivity, familiarity, and selected themes.

## Project Structure

- `backend/`: planner, API, database layer, seed data, and core domain types
- `frontend/`: map-first UI, itinerary rendering, and planner input flow
- `PROJECT_INTERVIEW_NOTES.md`: living record of architecture decisions and interview talking points

## How it works

1. A 7-step preferences wizard (`frontend/src/components/wizard/`) asks the user one question per screen — trip length, pace, budget, familiarity, themes, and must-see sites (the last pulled from the real seeded site list via `GET /api/sites`) — then sends the answers to `POST /api/itinerary/generate`.
2. `ItineraryController` → `ItineraryService` → `SiteRepository.getAllSites()` loads all Istanbul sites (and their themes/relationships) from Postgres.
3. The preferences and sites are run through the planner pipeline (`backend/src/planner/`), in order:
   `candidate-filter` → `site-scorer` → `anchor-selector` → `site-clusterer` → `day-allocator` → `route-optimizer` → `optional-stop-selector` → `itinerary-explainer`.
   Each stage is a small, independently testable module — see `backend/src/planner/*.test.ts` for what each one is responsible for, and `PROJECT_INTERVIEW_NOTES.md` for why the pipeline is shaped this way.
4. The result is a day-by-day itinerary (JSON) with ordered stops, travel times, and a reason each stop was included. The frontend renders it as a side-panel timeline plus a real map (`react-leaflet`) with day-colored routes. "Adjust preferences" reopens the wizard pre-filled with the current answers.

This whole path is deterministic — the same preferences always produce the same itinerary, no LLM in the loop.

## Prerequisites

- Node 24+ (`node --version`)
- Docker Desktop or another Docker Compose-compatible runtime (`docker compose version`)

## First-time setup

```
npm install
cp .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev:api    # in one terminal
npm run dev        # in another terminal, for the frontend
```

## API

The backend (`npm run dev:api`, `127.0.0.1:8787`) can be exercised directly, independent of the frontend:

```
curl http://127.0.0.1:8787/api/health
# {"ok":true,"database":"up"}

curl http://127.0.0.1:8787/api/sites
# {"sites":[{"slug":"hagia-sophia","name":"Hagia Sophia", ...}]}

curl -X POST http://127.0.0.1:8787/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "city": "istanbul",
      "days": 2,
      "hoursPerDay": 8,
      "walkingTolerance": "medium",
      "budgetSensitivity": "medium",
      "familiarity": "beginner",
      "themes": ["byzantine", "architecture", "religious-history"],
      "mustSeeSlugs": ["hagia-sophia", "blue-mosque"]
    }
  }'
# {"itinerary": {"days": [...], "tripSummary": "...", ...}}
```

`GET /api/health` reports both process liveness and whether it can currently reach Postgres (`database: "up" | "down"`). `npm run demo:backend` runs the same generation logic without a running server, useful for quickly inspecting planner output while iterating.

## Scripts

| Script | What it does | Needs Postgres running? |
|---|---|---|
| `npm run db:up` | Start local Postgres via Docker Compose | — |
| `npm run db:down` | Stop the local Postgres container | — |
| `npm run db:reset` | Wipe the local database volume, then up + migrate + seed from scratch | — |
| `npm run db:migrate` | Apply any pending SQL migrations | yes |
| `npm run db:seed` | Truncate and reload all tables from `backend/src/seed/*.seed.ts` | yes |
| `npm run db:psql` | Open a `psql` shell into the local database | yes |
| `npm run demo:backend` | Run the heuristic itinerary generator against a sample request | yes |
| `npm run dev:api` | Start the local planner API server on `127.0.0.1:8787` | yes |
| `npm run dev` | Start the frontend dev server | — |
| `npm run build` | Type-check and build the frontend | — |
| `npm run typecheck:backend` | Type-check the backend (not covered by `npm run build`) | — |
| `npm run ingest:sync` | Fetch real Wikidata/Wikipedia/Stack Exchange data and generate `backend/src/seed/{sources,signals}.generated.ts` (dry-run by default; add `-- --write` to actually write files) | — |
| `npm test` | Run the test suite | yes, for 2 of 12 test files (see below) |

## Testing

10 of the 12 test files are pure unit tests against in-memory fixtures — no database needed. Only `itinerary.service.test.ts` and `site.repository.test.ts` hit the real database, so `npm test` requires `npm run db:up && npm run db:migrate && npm run db:seed` first. If the database isn't reachable, those two files fail fast with an actionable error instead of a bare connection error.

## Database

Six tables: `themes`, `sites`, `site_themes` (join table with per-theme weight), `site_relationships` (directed edges between sites), `site_pageview_months` (Wikipedia pageview history, English + Turkish), `site_social_snapshots` (Stack Exchange discussion signal). `sites.slug` is a natural primary key — the whole app already addresses sites by slug.

Migrations live in `backend/src/db/migrations/` as numbered, forward-only SQL files (`0001_init.sql`, `0002_data_sourcing.sql`, ...). They're immutable once applied — `npm run db:migrate` checksums each file and throws if an already-applied migration was edited, rather than a general down-migration system. To start over, `npm run db:reset`.

## Data sources and licensing

Site facts are sourced from real external data, not just hand-typed: [Wikidata](https://www.wikidata.org/) (structured facts — coordinates, canonical identity) and [Wikipedia](https://www.wikipedia.org/) (pageview history, as a general-interest signal) via their official public APIs, plus [Stack Exchange's Travel community](https://travel.stackexchange.com/) as a human-discussion signal. Wikidata's structured data is [CC0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain, no attribution required); Wikipedia's article *text* is [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) — this app deliberately does not store or display Wikipedia's prose, only facts and a link to the source article, to stay entirely on the CC0 side of that line.

`npm run ingest:sync` fetches this data and writes it to two generated, git-tracked files (`backend/src/seed/sources.generated.ts`, `signals.generated.ts`) — reviewed via a normal `git diff` before being committed, rather than written directly to the database. This means the deployed backend never depends on Wikidata/Wikipedia/Stack Exchange being reachable; those APIs are only ever called from a developer machine. See `PROJECT_INTERVIEW_NOTES.md` for the full design rationale, including the scoring formula that combines this sourced data with editorial judgment without letting popularity override curation.

## Live

- **App**: https://backtrack-planner.web.app
- **API**: https://backtrack-api-218665896593.us-east4.run.app

Hosted on Google Cloud Run (backend), Firebase Hosting (frontend), and Neon (Postgres) — $0/month at this traffic level, no keep-warm mechanism (Cloud Run's cold start is ~1-3s, low enough to just accept).

## CI/CD

Every push to `main` runs the full test suite, then — only if tests pass — deploys both the backend and frontend for real (`.github/workflows/test.yml`). Authentication uses Workload Identity Federation: GitHub gets a short-lived, repo-and-branch-scoped token per run, and there are no long-lived credentials or GitHub secrets anywhere (see `PROJECT_INTERVIEW_NOTES.md` for the reasoning and a real bug the setup process caught along the way). Manual deploys (`gcloud run deploy`, `firebase deploy`) still work unchanged as a fallback.

## Status

Built and working end-to-end: the planner pipeline, the map-dominant frontend, a real preferences wizard, Postgres persistence (27 seeded Istanbul sites, 6 themes, 24 relationships), public deployment with CI/CD auto-deploy on push, and a real data-sourcing pipeline (Wikidata/Wikipedia/Stack Exchange) feeding a scoring formula that keeps editorial judgment dominant over raw popularity. 64 tests passing. See `PROJECT_INTERVIEW_NOTES.md` for the full "current state" summary and the reasoning behind each decision.
