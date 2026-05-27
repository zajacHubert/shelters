<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Data Layer Foundation Implementation Plan

- **Plan**: `context/changes/data-layer-foundation/plan.md`
- **Mode**: Deep
- **Date**: 2026-05-26
- **Verdict**: SOUND (after fixes)
- **Findings**: 0 critical, 3 warnings, 1 observation

## Verdicts

| Dimension             | Verdict |
| --------------------- | ------- |
| End-State Alignment   | PASS    |
| Lean Execution        | PASS    |
| Architectural Fitness | PASS    |
| Blind Spots           | WARNING |
| Plan Completeness     | WARNING |

## Grounding

5/5 paths ✓ (wrangler.jsonc, package.json, deploy.yml exist; src/db/ and drizzle.config.ts correctly absent), 3/3 symbols ✓ (nodejs_compat in wrangler.jsonc, cf-typegen in package.json, getCloudflareContext exported from @opennextjs/cloudflare), brief↔plan ✓

## Findings

### F1 — `migrations_dir` placed at wrong level in wrangler.jsonc

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 — Change 2, wrangler.jsonc contract snippet
- **Detail**: Plan added `"migrations_dir": "./migrations"` as a top-level wrangler.jsonc field. Wrangler reads it from inside the d1_databases entry (`d1Database.migrations_dir` in wrangler-dist/cli.js). Top-level is silently ignored; migrations still default to `./migrations` either way.
- **Fix**: Removed top-level `migrations_dir` from the wrangler.jsonc snippet; added a note that `./migrations` is the default and the field belongs inside d1_databases if needed.
- **Decision**: FIXED

### F2 — Manual verification steps used `wrangler dev --local` directly

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 1 Manual Verification, Phase 3 Manual Verification, Testing Strategy
- **Detail**: `wrangler.jsonc` sets `"main": ".open-next/worker.js"` which requires `opennextjs-cloudflare build` to exist first. Running `wrangler dev --local` without building fails. Correct command is `npm run preview` (build + Workers preview in one step).
- **Fix**: Replaced all `wrangler dev --local` references in manual verification and Testing Strategy with `npm run preview`.
- **Decision**: FIXED

### F3 — `getSheltersByCity` LIKE silently fails for Polish city names

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 3 — Change 2, shelters.ts contract
- **Detail**: SQLite LIKE is case-insensitive for ASCII only. Polish cities (Łódź, Wrocław, Gdańsk) contain non-ASCII Unicode letters. Searching "łódź" would not match stored "Łódź". SQLite's built-in `lower()` also does not handle non-ASCII, so LOWER(city) LIKE LOWER(?) doesn't fix it either.
- **Fix A ⭐ Applied**: Normalize city to lowercase via JS `city.toLowerCase()` at write time in `createShelter`; perform lookup with the lowercased search term. JS `toLowerCase()` handles Polish Unicode correctly.
- **Decision**: FIXED via Fix A

### F4 — No indexes on city, email, or needs.shelter_id

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 — schema.ts contract
- **Detail**: Full table scans on getSheltersByCity, getShelterByEmail, getNeedsByShelter. Fine at MVP scale (<100 shelters, <1000 needs).
- **Fix**: Add Drizzle index() on shelters.city, shelters.email, needs.shelterId in schema.ts.
- **Decision**: SKIPPED
