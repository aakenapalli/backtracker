# Backtrack

Travel-first web app for Istanbul that generates geographically efficient, historically informed itineraries based on user constraints such as trip length, daily hours, walking tolerance, budget sensitivity, familiarity, and selected themes.

## Project Structure

- `backend/`: planner, API, database layer, seed data, and core domain types
- `frontend/`: map-first UI, itinerary rendering, and planner input flow
- `PROJECT_INTERVIEW_NOTES.md`: living record of architecture decisions and interview talking points

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

## Current Focus

The current implementation focus is:

- defining stable domain and API contracts
- seeding Istanbul historical place data
- building an explainable itinerary planning engine
- persisting site data in Postgres instead of in-memory arrays
