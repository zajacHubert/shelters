# Data Layer Foundation Implementation Plan

## Overview

Install `@supabase/supabase-js`, configure environment variables, define the `shelters` and `needs` tables in Supabase (PostgreSQL), and expose typed query helpers that enforce per-shelter data isolation via function signatures. Every downstream slice (F-02 auth, S-03 donor view) builds on these helpers.

## Current State Analysis

Next.js 15.5 scaffolded on Cloudflare Workers via `@opennextjs/cloudflare`. Supabase project exists at `https://zqarmvyallfmiroeggyv.supabase.co` — credentials in `.env.local` (gitignored). The `@supabase/supabase-js` package is installed. `src/db/types.ts`, `src/db/client.ts`, and query helpers in `src/db/queries/` have been created (Phase 1 and Phase 3 code is complete). Phase 2 (SQL schema setup in the Supabase dashboard) is the only remaining step.

## Desired End State

`npm run dev` starts without DB errors. The Supabase PostgreSQL database has two tables (`shelters`, `needs`) with correct columns, types, constraints, and indexes. TypeScript types `Shelter`, `Need`, `NewShelter`, `NewNeed` are importable from `src/db/queries/shelters` and `src/db/queries/needs`. Query helpers in `src/db/queries/` accept a `Db` instance and return typed results; all `needs` helpers require a `shelterId: string` parameter included in every WHERE clause. `npx tsc --noEmit` and `npm run lint` both pass.

### Key Discoveries

- `@supabase/supabase-js` uses the HTTP-based PostgREST API — fully compatible with Cloudflare Workers (no TCP connection required)
- `NEXT_PUBLIC_` variables are inlined at `next build` time — available from both Server Components and Client Components via `process.env`
- PostgreSQL has native enum support (`CREATE TYPE urgency_level AS ENUM (...)`), but PostgREST returns enum values as plain strings — TypeScript typing is done manually via the `Database` type in `src/db/types.ts`
- City normalization: JS `toLowerCase()` handles Polish Unicode (Łódź, Wrocław) correctly; stored lowercase, searched lowercase
- Urgency ordering: Supabase client `.order()` sorts enum columns alphabetically by value string, not by PostgreSQL enum definition order — client-side sort using a `URGENCY_ORDER` map is the correct approach
- Per-shelter isolation enforced at the application layer: all `needs` helpers require `shelterId: string`, included in every `.eq('shelter_id', shelterId)` filter

## What We're NOT Doing

- No Row Level Security (RLS) at MVP — using anon/publishable key with RLS disabled
- No password hashing — `password_hash` is a plain text column here; F-02 owns the hashing logic
- No API routes or Server Actions — query helpers are plain async functions, not HTTP endpoints
- No auth session or JWT infrastructure — F-02 responsibility
- No Supabase CLI / migration files committed to git — schema managed via SQL editor for MVP
- No seed data — cold-start for local dev is fine at this stage

## Implementation Approach

Three phases (1 and 3 code already complete): (1) install client + configure environment + create `src/db/` structure; (2) define and execute the SQL schema in the Supabase dashboard; (3) typed query helpers. Phase 3 depended on Phase 1 types being defined. Phase 2 is the only remaining step requiring manual action in the Supabase dashboard.

## Critical Implementation Details

**Supabase client in Cloudflare Workers**: `@supabase/supabase-js` communicates via HTTP (PostgREST), not TCP, so it works natively in Cloudflare Workers. The factory is in `src/db/client.ts` — `createServerClient()` reads `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which are inlined by Next.js at build time. Pass `.env.local` values before running `npm run preview` or `npm run deploy`.

**Urgency sort order**: Supabase client `.order('urgency')` sorts alphabetically (`mile_widziane` < `pilne` < `potrzebne`), which is wrong. The query helpers sort client-side using `URGENCY_ORDER = { pilne: 1, potrzebne: 2, mile_widziane: 3 }`.

**City normalization**: `getSheltersByCity` passes `city.toLowerCase()` to `.eq()`. `createShelter` normalizes `input.city.toLowerCase()` before inserting. JS `toLowerCase()` handles Polish non-ASCII correctly.

**CI/CD**: The existing `deploy.yml` has a placeholder comment for `NEXT_PUBLIC_*` vars under the "Deploy to Cloudflare Workers" step. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as GitHub Actions vars (not secrets — they are public) when F-01 ships.

---

## Phase 1: Install Supabase Client and Configure Environment

### Overview

Install `@supabase/supabase-js`, wire environment variables, create the typed `Database` interface and Supabase client factory. **This phase is complete.**

### Changes Made

#### 1. Install @supabase/supabase-js

`npm install @supabase/supabase-js` — adds the Supabase client as a runtime dependency.

#### 2. Configure environment variables

**File**: `.env.local` (new, gitignored)

Supabase URL and publishable key. Used by `src/db/client.ts` via `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

#### 3. Create src/db/types.ts

**File**: `src/db/types.ts` (new)

Manually authored `Database` type following Supabase's `{ public: { Tables: { ... } } }` format, plus the `Urgency` union type. Used to parameterise `SupabaseClient<Database>` for full type safety.

#### 4. Create src/db/client.ts

**File**: `src/db/client.ts` (new)

Exports `createServerClient(): Db` and `type Db`. Throws on missing env vars at runtime rather than silently returning an untyped client.

### Success Criteria

#### Automated Verification

- `npx tsc --noEmit` passes with `src/db/types.ts` and `src/db/client.ts` present
- `@supabase/supabase-js` appears in `package.json` dependencies

**Implementation Note**: Phase 1 is complete. Proceed to Phase 2 (manual SQL in Supabase dashboard).

---

## Phase 2: Database Schema Setup in Supabase

### Overview

Define and create the `shelters` and `needs` tables in the Supabase PostgreSQL database by running SQL in the Supabase SQL Editor. This is the only phase that requires manual action.

### Changes Required

#### 1. Run schema SQL in Supabase SQL Editor

Navigate to: https://supabase.com/dashboard/project/zqarmvyallfmiroeggyv/sql/new

Run the following SQL:

```sql
-- Urgency enum
CREATE TYPE urgency_level AS ENUM ('pilne', 'potrzebne', 'mile_widziane');

-- Shelters table
CREATE TABLE shelters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for city lookup (stored lowercase)
CREATE INDEX idx_shelters_city ON shelters(city);

-- Needs table
CREATE TABLE needs (
  id SERIAL PRIMARY KEY,
  shelter_id UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  urgency urgency_level NOT NULL,
  quantity INTEGER NOT NULL,
  allegro_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for per-shelter needs queries
CREATE INDEX idx_needs_shelter_id ON needs(shelter_id);
```

### Success Criteria

#### Manual Verification

- In the Supabase dashboard Table Editor: both `shelters` and `needs` tables appear under the `public` schema
- `needs` table has columns: `id`, `shelter_id`, `name`, `urgency`, `quantity`, `allegro_link`, `created_at`
- `npm run dev` starts without errors

**Implementation Note**: After confirming the tables exist, update the progress checkboxes below, then proceed to manual verification in Phase 3.

---

## Phase 3: Typed Query Helpers

### Overview

Typed query helper functions for shelters and needs. All needs helpers require a `shelterId: string` parameter included in every WHERE clause, enforcing isolation at the TypeScript signature level. **Code is complete — pending manual verification after Phase 2.**

### Changes Made

#### 1. src/db/queries/shelters.ts

`getSheltersByCity(db, city)` — lowercase `.eq()` match on stored city. `getShelterByEmail(db, email)` — used by F-02 auth. `createShelter(db, input)` — normalizes city to lowercase on write.

#### 2. src/db/queries/needs.ts

`getNeedsByShelter(db, shelterId)` — client-side urgency sort via `URGENCY_ORDER`. `createNeed(db, shelterId, input)`, `updateNeed(db, shelterId, needId, changes)`, `deleteNeed(db, shelterId, needId)` — all filter by `shelter_id` for isolation.

### Success Criteria

#### Automated Verification

- `npx tsc --noEmit` passes with no `any` in query helpers
- `npm run lint` passes

#### Manual Verification (after Phase 2)

- `createShelter` → `getSheltersByCity` round-trip returns the inserted row
- `createNeed` followed by `getNeedsByShelter` returns needs ordered pilne → potrzebne → mile_widziane
- A need created under shelter A is not returned by `getNeedsByShelter(db, shelterBId)` — cross-shelter isolation confirmed

**Implementation Note**: After automated verification passes and Phase 2 manual gate is cleared, run the manual round-trip test using a temporary Server Action in `npm run dev`.

---

## Migration Notes

Schema changes post-MVP go through the Supabase SQL Editor or Supabase CLI (`supabase db push`). For CI/CD, add a `supabase db push` step to `deploy.yml` before the wrangler deploy step when schema migrations are needed.

For production: the same Supabase project is used for MVP. When staging is needed, create a second Supabase project and set separate env vars per environment.

## References

- Roadmap F-01: `context/foundation/roadmap.md`
- PRD: `context/foundation/prd.md` — FR-001, FR-004, NFR (isolation, password hashing)
- Supabase JS client docs: https://supabase.com/docs/reference/javascript/introduction
- Supabase + Cloudflare Workers: https://supabase.com/docs/guides/getting-started/quickstarts/cloudflare-workers
- Supabase SQL Editor: https://supabase.com/dashboard/project/zqarmvyallfmiroeggyv/sql/new

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Install Supabase Client and Configure Environment

#### Automated

- [x] 1.1 `npx tsc --noEmit` passes with `src/db/types.ts` and `src/db/client.ts` present
- [x] 1.2 `@supabase/supabase-js` in `package.json` dependencies

### Phase 2: Database Schema Setup in Supabase

#### Manual

- [x] 2.1 `shelters` i `needs` tables visible in Supabase Table Editor
- [x] 2.2 `npm run dev` starts without DB errors

### Phase 3: Typed Query Helpers

#### Automated

- [x] 3.1 `npx tsc --noEmit` passes with no `any` in query helpers
- [x] 3.2 `npm run lint` passes

#### Manual

- [x] 3.3 `createShelter` → `getSheltersByCity` round-trip works in `npm run dev`
- [x] 3.4 `getNeedsByShelter` returns rows ordered pilne → potrzebne → mile_widziane
- [x] 3.5 Cross-shelter isolation verified: need created for shelter A not returned for shelter B
