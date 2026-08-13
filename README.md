# Backtrack

Travel-first web app for Istanbul that generates geographically efficient, historically informed itineraries based on user constraints such as trip length, daily hours, walking tolerance, budget sensitivity, familiarity, and selected themes.

## Project Structure

- `backend/`: planner, API, database layer, seed data, and core domain types
- `frontend/`: map-first UI, itinerary rendering, and planner input flow
- `PROJECT_INTERVIEW_NOTES.md`: living record of architecture decisions and interview talking points

## How it works

1. The frontend sends the user's trip preferences to `POST /api/itinerary/generate`.
2. `ItineraryController` → `ItineraryService` → `SiteRepository.getAllSites()` loads all Istanbul sites (and their themes/relationships) from Postgres.
3. The preferences and sites are run through the planner pipeline (`backend/src/planner/`), in order:
   `candidate-filter` → `site-scorer` → `anchor-selector` → `site-clusterer` → `day-allocator` → `route-optimizer` → `optional-stop-selector` → `itinerary-explainer`.
   Each stage is a small, independently testable module — see `backend/src/planner/*.test.ts` for what each one is responsible for, and `PROJECT_INTERVIEW_NOTES.md` for why the pipeline is shaped this way.
4. The result is a day-by-day itinerary (JSON) with ordered stops, travel times, and a reason each stop was included. The frontend renders it as a side-panel timeline plus a real map (`react-leaflet`) with day-colored routes.

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
| `npm test` | Run the test suite | yes, for 2 of 11 test files (see below) |

## Testing

The 9 planner/utility test files are pure unit tests against in-memory fixtures — no database needed. Only `itinerary.service.test.ts` and `site.repository.test.ts` hit the real database, so `npm test` requires `npm run db:up && npm run db:migrate && npm run db:seed` first. If the database isn't reachable, those two files fail fast with an actionable error instead of a bare connection error.

## Database

Four tables: `themes`, `sites`, `site_themes` (join table with per-theme weight), `site_relationships` (directed edges between sites). `sites.slug` is a natural primary key — the whole app already addresses sites by slug.

Migrations live in `backend/src/db/migrations/` as numbered, forward-only SQL files (`0001_init.sql`, ...). They're immutable once applied — `npm run db:migrate` checksums each file and throws if an already-applied migration was edited, rather than a general down-migration system. To start over, `npm run db:reset`.

## Live

- **App**: https://backtrack-planner.web.app
- **API**: https://backtrack-api-218665896593.us-east4.run.app

Hosted on Google Cloud Run (backend), Firebase Hosting (frontend), and Neon (Postgres) — $0/month at this traffic level, no keep-warm mechanism (Cloud Run's cold start is ~1-3s, low enough to just accept).

## Status

Built and working end-to-end: the planner pipeline, the map-dominant frontend, Postgres persistence (27 seeded Istanbul sites, 6 themes, 25 relationships), and public deployment. 49 tests passing. Not yet done: a future data-sourcing pipeline (Wikidata/Wikipedia + Reddit) to source and attribute site data instead of hand-curating it. See `PROJECT_INTERVIEW_NOTES.md` for the full "current state" summary and the reasoning behind each decision.
