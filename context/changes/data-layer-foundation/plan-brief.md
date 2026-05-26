# Data Layer Foundation — Plan Brief

> Full plan: `context/changes/data-layer-foundation/plan.md`

## What & Why

Install `@supabase/supabase-js`, configure Supabase credentials, define the `shelters` and `needs` tables in PostgreSQL, and expose typed query helpers with per-shelter isolation baked into every function signature. This is the foundational layer all other slices depend on: F-02 (auth) needs the `shelters` table and `getShelterByEmail`, S-01 and S-02 need the query helpers for CRUD, and S-03 (the north-star donor view) needs `getSheltersByCity` and `getNeedsByShelter`.

## Starting Point

Next.js 15.5 scaffolded on Cloudflare Workers via `@opennextjs/cloudflare`. Supabase project exists and credentials are in `.env.local`. Code files (`src/db/types.ts`, `src/db/client.ts`, `src/db/queries/`) are written. **Remaining work: run the SQL schema script in the Supabase dashboard (Phase 2).**

## Desired End State

`npm run dev` starts cleanly. Supabase has `shelters` and `needs` tables with correct columns and FK constraints. TypeScript types `Shelter`, `Need`, `NewShelter`, `NewNeed` are importable from `src/db/queries/shelters` and `src/db/queries/needs`. All needs query helpers enforce per-shelter isolation via required `shelterId: string` parameters. `npx tsc --noEmit` and `npm run lint` both pass.

## Key Decisions Made

| Decision              | Choice                                                            | Why (1 sentence)                                                                             | Source |
| --------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------ |
| Database              | Supabase (PostgreSQL)                                             | Existing project credentials; HTTP-based PostgREST works natively in Cloudflare Workers      | User   |
| Client library        | `@supabase/supabase-js`                                           | Official typed client; no TCP — compatible with Workers runtime                              | Plan   |
| shelters.id type      | UUID (`gen_random_uuid()`)                                        | Opaque IDs prevent enumeration attacks on public shelter endpoints                           | Plan   |
| Schema scope          | PRD minimum fields only                                           | 3-week solo MVP — add timestamps/extras later if needed                                      | Plan   |
| Migration strategy    | SQL Editor in Supabase dashboard                                  | Simplest for MVP; Supabase CLI migrations can be added when CI/CD requires it                | Plan   |
| Urgency sort          | Client-side sort via `URGENCY_ORDER` map                          | PostgREST sorts enum columns alphabetically, not by definition order; JS sort is predictable | Plan   |
| City normalization    | `city.toLowerCase()` on write + `.eq(city.toLowerCase())` on read | JS `toLowerCase()` handles Polish Unicode (Łódź, Wrocław); SQL LOWER() is ASCII-only         | Plan   |
| Isolation enforcement | Application-layer function signatures                             | `shelterId` as required param on all `needs` helpers; TypeScript enforces it                 | Plan   |
| Type source of truth  | Manual `Database` type in `src/db/types.ts`                       | Supabase gen-types requires CLI; manual type is sufficient and always in sync with schema    | Plan   |

## Scope

**In scope (code complete):**

- `@supabase/supabase-js` installed
- `.env.local` with Supabase credentials (gitignored)
- `src/db/types.ts` — `Database` type + `Urgency` union
- `src/db/client.ts` — `createServerClient(): Db`, `type Db`
- `src/db/queries/shelters.ts` — `getSheltersByCity`, `getShelterByEmail`, `createShelter`
- `src/db/queries/needs.ts` — `getNeedsByShelter` (urgency-sorted), `createNeed`, `updateNeed`, `deleteNeed`

**In scope (pending manual — Phase 2):**

- SQL schema creation in Supabase dashboard (shelters + needs + indexes)

**Out of scope:**

- Password hashing (F-02)
- Auth sessions or middleware (F-02)
- API routes / Server Actions (F-02, S-01, S-02, S-03)
- Row Level Security (post-MVP)
- Seed data
- Automated integration tests (post-MVP)
- CI migration step in `deploy.yml` (add when F-01 ships)

## Architecture / Approach

```
.env.local  ──NEXT_PUBLIC_*──▶  process.env (inlined at next build)
                                          │
src/db/client.ts  createServerClient() ──▶  SupabaseClient<Database>  (type: Db)
                                          │
src/db/queries/shelters.ts              HTTP (PostgREST)
src/db/queries/needs.ts                       │
                                     Supabase PostgreSQL
```

## Phase Summary

| Phase | Description                             | Status    |
| ----- | --------------------------------------- | --------- |
| 1     | Install client + env + src/db structure | ✅ Done   |
| 2     | SQL schema in Supabase dashboard        | ⏳ Manual |
| 3     | Typed query helpers                     | ✅ Done   |

## Next Manual Step

Go to: https://supabase.com/dashboard/project/zqarmvyallfmiroeggyv/sql/new

Run the SQL from `plan.md § Phase 2 → Changes Required`. Then confirm so Phase 3 manual verification (round-trip test) can proceed.

> Full plan: `context/changes/data-layer-foundation/plan.md`

## What & Why

Install Cloudflare D1 + Drizzle ORM, define the `shelters` and `needs` tables, and expose typed query helpers with per-shelter isolation baked into every function signature. This is the foundational layer all other slices depend on: F-02 (auth) needs the `shelters` table and `getShelterByEmail`, S-01 and S-02 need the query helpers for CRUD, and S-03 (the north-star donor view) needs `getSheltersByCity` and `getNeedsByShelter`.

## Starting Point

Next.js 15.5 is scaffolded on Cloudflare Workers via `@opennextjs/cloudflare`. Zero database infrastructure exists — no ORM packages, no schema files, no D1 binding, no `cloudflare-env.d.ts`. The `cf-typegen` script is present in `package.json` but has never been run.

## Desired End State

`wrangler dev --local` starts cleanly. Local D1 has `shelters` and `needs` tables with correct columns and FK constraints. TypeScript types `Shelter`, `Need`, `NewShelter`, `NewNeed` are importable from `src/db/schema`. All needs query helpers enforce per-shelter isolation via required `shelterId: string` parameters. `npx tsc --noEmit` and `npm run lint` both pass.

## Key Decisions Made

| Decision              | Choice                                                | Why (1 sentence)                                                                  | Source |
| --------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| Database              | Cloudflare D1                                         | Native to Workers, no external service, free tier, first-class `wrangler` tooling | Plan   |
| ORM / query builder   | Drizzle ORM + Drizzle Kit                             | TypeScript-first, first-class D1 support, schema-as-code drives migrations        | Plan   |
| shelters.id type      | UUID (`crypto.randomUUID()`)                          | Opaque IDs prevent enumeration attacks on the public shelter endpoints            | Plan   |
| Schema scope          | PRD minimum fields only                               | 3-week solo MVP; no timestamps, no extra fields — add later if needed             | Plan   |
| Migration strategy    | Drizzle Kit generate → `wrangler d1 migrations apply` | Single source of truth in `schema.ts`; committed SQL files enable CI/CD replay    | Plan   |
| Local dev DB          | `wrangler dev --local` miniflare D1                   | Same Workers runtime as production, works offline, no remote pollution            | Plan   |
| Isolation enforcement | Application-layer function signatures                 | `shelterId` as required parameter on all `needs` helpers; TypeScript enforces it  | Plan   |
| Type exports          | `$inferSelect` / `$inferInsert` from schema           | Single source of truth; schema changes propagate to all consumers via typecheck   | Plan   |

## Scope

**In scope:**

- Install `drizzle-orm` + `drizzle-kit`
- D1 binding in `wrangler.jsonc` + `cloudflare-env.d.ts` generation
- `drizzle.config.ts` + db npm scripts
- `src/db/schema.ts` with `shelters`, `needs`, urgency enum, exported types
- Initial migration generated + applied to local D1
- `src/db/client.ts` — `getDb(d1: D1Database): Db`
- `src/db/queries/shelters.ts` — `getSheltersByCity`, `getShelterById`, `getShelterByEmail`, `createShelter`
- `src/db/queries/needs.ts` — `getNeedsByShelter` (urgency-sorted), `createNeed`, `updateNeed`, `deleteNeed`

**Out of scope:**

- Password hashing (F-02)
- Auth sessions or middleware (F-02)
- API routes / Server Actions (F-02, S-01, S-02, S-03)
- Seed data
- Automated integration tests (post-MVP)
- CI migration step in `deploy.yml` (note in Migration Notes — add when F-01 ships)

## Architecture / Approach

```
wrangler.jsonc  ──D1 binding──▶  CloudflareEnv.DB (D1Database)
                                          │
                                   getCloudflareContext()
                                          │
src/db/client.ts   getDb(d1) ──────▶  Drizzle<schema>  (type: Db)
                                          │
src/db/queries/
  shelters.ts   getSheltersByCity(db, city)          ──▶  Shelter[]
  shelters.ts   getShelterByEmail(db, email)          ──▶  Shelter | undefined
  needs.ts      getNeedsByShelter(db, shelterId)      ──▶  Need[]  (sorted by urgency)
  needs.ts      createNeed(db, shelterId, data)       ──▶  Need
  needs.ts      updateNeed(db, shelterId, id, data)   ──▶  Need | undefined
  needs.ts      deleteNeed(db, shelterId, id)         ──▶  void
```

Isolation rule: `shelterId: string` is a required positional parameter on every `needs` helper. It is always included in the WHERE clause. No raw D1 queries bypass the helpers.

## Phases at a Glance

| Phase                        | What it delivers                                                                          | Key risk                                                                                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Dependencies + D1 binding | `drizzle-orm` installed, D1 binding typed, `cf-typegen` run, `drizzle.config.ts` in place | `wrangler d1 create` is a one-time remote step that requires a Cloudflare account — `database_id` must be pasted into `wrangler.jsonc` before `cf-typegen` works correctly |
| 2. Schema + migrations       | Schema defined, migration SQL generated and applied to local D1, tables verified          | `migrations_dir` in `wrangler.jsonc` and `out` in `drizzle.config.ts` must match exactly or `wrangler apply` silently does nothing                                         |
| 3. DB client + query helpers | Typed `getDb()`, all shelters + needs helpers, isolation enforced, typecheck passes       | The urgency sort in `getNeedsByShelter` requires a SQL CASE expression (not alphabetical) — use Drizzle's `sql` template tag                                               |

**Prerequisites:** Cloudflare account with Workers access and permission to create D1 databases (`wrangler login` done).
**Estimated effort:** ~1-2 focused sessions across 3 phases.

## Open Risks & Assumptions

- `wrangler d1 create` requires interactive login — if running in CI-only environment, account setup must be done manually first
- Production D1 migration (`npm run db:migrate:remote`) must be run before first deployment; the `deploy.yml` workflow doesn't yet include this step — it should be added when F-01 is shipped
- `drizzle-orm/d1` import path may change across Drizzle major versions — pin `drizzle-orm` in `package.json` after install if the project uses `^`

## Success Criteria (Summary)

- `wrangler dev --local` starts without errors; local D1 has `shelters` and `needs` tables with correct schema
- TypeScript types `Shelter`, `Need` importable from `src/db/schema`; `npx tsc --noEmit` and `npm run lint` both pass
- Cross-shelter isolation verified manually: a need created under shelter A is not returned when querying for shelter B
