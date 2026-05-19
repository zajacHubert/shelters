---
project: bootstrap-scaffold (ShelterNeeds / Next.js 16.2.6)
checked_at: 2026-05-19T00:00:00Z
health_status: needs-attention
context_type: greenfield
language_family: js
stack_assessment_available: false
checks_run:
  - lockfile
  - dependency_audit
  - outdated_deps
  - test_runner
  - ci_cd
  - configuration
audit_findings:
  critical: 0
  high: 0
  moderate: 2
  low: 0
test_runner_detected: false
ci_provider: GitHub Actions
recommended_fixes: 5
---

## Dependency Health

### Lockfile

```
Status:          present (package-lock.json — npm)
Package manager: npm
```

**Note — dual lockfile situation**: The repo contains two lockfiles: `package-lock.json` (active, for the Next.js project) and `bun.lock` (retained from the original `10x-cli` source tree). The active lockfile for the current `package.json` is `package-lock.json`. The `bun.lock` belongs to the 10x-cli source toolchain, which still lives in `src/commands/`, `src/lib/`, and `tests/`. Both lockfiles can coexist, but the boundary must be understood: `npm install` manages the Next.js app; `bun install` manages the CLI source.

### Security Audit

```
Tool:    npm audit --json
Summary: 0 CRITICAL, 0 HIGH, 2 MODERATE, 0 LOW
Direct vs transitive: both findings are transitive (via next)
```

**MODERATE findings**

- **postcss** (bundled by `next@16.2.6`) — [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93): XSS via unescaped `</style>` in CSS stringify output. CVSS 6.1. Transitive, not directly importable in application code. The `npm audit fix` resolution requires downgrading `next` to `9.3.3` — a major breaking change. Monitor the `next` release feed for a 16.x patch that ships `postcss >= 8.5.10`.

### Outdated Dependencies

```
Packages with major version gaps: 3
```

- **@types/node**: 20.19.41 → 25.9.0 (5 major versions behind) — type definitions only, non-breaking to upgrade
- **typescript**: 5.9.3 → 6.0.3 (1 major version — TypeScript 6 just released; review breaking changes before upgrading)
- **eslint**: 9.39.4 → 10.4.0 (1 major version — ESLint 10 just released; verify `eslint-config-next` compatibility before upgrading)

`react` / `react-dom` are 2 patch versions behind (19.2.4 → 19.2.6) — not significant.

---

## Test Suite

```
Test runner:    not detected
Tests found:    not applicable
Test execution: not attempted
```

⚠ No test runner detected for the Next.js application. The `tests/` directory contains the original `10x-cli` source tests using `bun:test`, which are not applicable to the Next.js app. The current `package.json` has no `test` script and no testing devDependencies.

**The agent cannot verify its own changes to the Next.js app without a test runner.**

Recommended: Set up Vitest with React Testing Library:

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

Then add to `package.json` scripts: `"test": "vitest run"` and create `vitest.config.ts`.

---

## CI/CD

```
Provider:      GitHub Actions
Configuration: .github/workflows/ci.yml
```

| Stage      | Status | Notes                                                           |
| ---------- | ------ | --------------------------------------------------------------- |
| Lint       | ✓      | `bun run lint` (oxlint) — configured but uses bun               |
| Test       | ✓      | `bun test tests/*.test.ts` — configured but uses bun            |
| Build      | ✓      | `bun run build` (node target) + `bun run build:binary`          |
| Type check | ✓      | `bun run typecheck` (tsc --noEmit)                              |
| Security   | ✗      | `bun pm ls` is not a vulnerability audit; no true security scan |

**⚠ CI pipeline is misaligned with the active `package.json`.** The CI workflow installs `oven-sh/setup-bun` and runs `bun install --frozen-lockfile`. Because `bun.lock` was generated from the original `10x-cli` package.json (not the current Next.js one), CI would fail on `bun install --frozen-lockfile` if triggered against the current state. The CI reflects the 10x-cli toolchain, not the Next.js project.

---

## Configuration

### High severity

All high-priority configuration is present:

- `tsconfig.json` ✓ — `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride` all enabled. Strong baseline.
- `eslint.config.mjs` ✓ — `eslint-config-next` (core-web-vitals + TypeScript preset).
- `.gitignore` ✓ — present and includes Next.js output directories.

### Medium severity

- **No formatter configured** — no `.prettierrc`, `biome.json`, or equivalent. ESLint handles lint rules but not formatting. Without an auto-formatter, the agent's output style will be inconsistent between runs. Fix: `npm install -D prettier` and add `.prettierrc` (< 5 min).

### Low severity

- **`.editorconfig` missing** — consistent editor settings (indent size, line endings) across editors are not enforced. Fix: create `.editorconfig` with `indent_style = space`, `indent_size = 2`, `end_of_line = lf` (< 2 min).
- **`.env.example` missing** — no documented template for environment variables. Fix: create `.env.example` listing any `NEXT_PUBLIC_*` or server-side env vars the app will need (< 5 min, revisit when env vars are added).

---

## Stack Assessment Cross-Reference

```
No stack-assessment.md found. Run /10x-stack-assess for quality-gate analysis.
```

---

## Recommended Fixes

### Fix before agent work (Category A)

#### 1. Add a test runner for the Next.js app

**Impact**: The agent generates code it cannot verify. Without a test runner, every change must be manually checked — eliminating the core benefit of agent-assisted development.
**Severity**: high
**Effort**: moderate (15–30 min)
**Fix**:

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom' },
});
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

#### 2. Resolve the CI pipeline / package manager mismatch

**Impact**: The existing CI workflow (`.github/workflows/ci.yml`) runs `bun install --frozen-lockfile` against a `bun.lock` that was generated from the original `10x-cli` package.json. If a PR is opened now, CI will fail. Any green CI signal will be false — it tests the CLI source, not the Next.js app.
**Severity**: high
**Effort**: moderate (15–30 min)
**Fix**: Two options:

_Option A — Update CI for Next.js (recommended if this is purely a Next.js project):_
Replace the `check` job in `.github/workflows/ci.yml` with an npm-based workflow:

```yaml
- uses: actions/setup-node@v4
  with: { node-version: '20' }
- run: npm ci
- run: npm run lint
- run: npm test # after adding Vitest
- run: npm run build
```

_Option B — Add a separate CI job for the Next.js app_ (if the 10x-cli source stays active in the same repo):
Keep the existing bun-based jobs for CLI source and add a new job that installs npm deps and runs Next.js checks.

#### 3. Address the dual-lockfile boundary

**Impact**: Two lockfiles for two different package manifests in the same directory is fragile. A developer running `npm install` vs `bun install` gets different dependency trees and different `node_modules`. The agent may generate instructions using the wrong package manager.
**Severity**: medium
**Effort**: quick (< 5 min)
**Fix**: Document the boundary explicitly in `AGENTS.md` (already partially done). Ensure `bun.lock` is not managed by npm and `package-lock.json` is not managed by bun. Consider whether the two projects should eventually live in separate directories.

#### 4. Add a code formatter

**Impact**: Without an auto-formatter, the agent's output style will vary between sessions — inconsistent quotes, spacing, and semicolons create noisy diffs and make code review harder.
**Severity**: medium
**Effort**: quick (< 5 min)
**Fix**:

```bash
npm install -D prettier
```

Create `.prettierrc`:

```json
{ "semi": true, "singleQuote": false, "tabWidth": 2, "trailingComma": "es5" }
```

Add to `package.json` scripts: `"format": "prettier --write src/"`.

#### 5. Monitor the postcss advisory in next

**Impact**: GHSA-qx2v-qp2m-jg93 (CVSS 6.1, MODERATE) — XSS via unescaped `</style>` in CSS stringify output. Transitive via `next`; not directly triggerable from application code unless you pass untrusted CSS through PostCSS. Low immediate risk; high consequence if affected code path is present.
**Severity**: moderate
**Effort**: quick (monitor) / moderate (when patch lands)
**Fix**: Run `npm audit` periodically. When `next` releases a version bundling `postcss >= 8.5.10`, upgrade:

```bash
npm install next@latest
npm audit
```

Do not downgrade `next` to 9.3.3 — that is a major breaking change.

---

### Addressed in upcoming lessons (Category B)

#### CI/CD hardening for the Next.js app

**Lesson**: [Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)
**What you'll do there**: Set up a production-grade CI pipeline covering lint, type-check, tests, and build for the Next.js project — replacing or augmenting the existing bun-based workflow.

#### Missing `.editorconfig` and `.env.example`

These are convenience files. Create them when you have a moment — they improve agent consistency and onboarding for future contributors. No lesson specifically covers them; they take under 5 minutes each.

---

## Summary

```
Health status: needs-attention
```

The Next.js scaffold (ShelterNeeds) has a strong TypeScript configuration (`strict` + `noUncheckedIndexedAccess`) and ESLint via `eslint-config-next`, but **lacks two things the agent relies on most**: a test runner for the Next.js app, and a CI pipeline aligned with the current `npm`-based `package.json`. The existing CI workflow and `bun.lock` belong to the `10x-cli` source tree that was merged into this directory during the bootstrap exercise — this hybrid repo structure is the root cause of the CI/lockfile findings. Add Vitest + React Testing Library (30 min) and update the CI workflow before starting agent-assisted feature work. The sole security advisory (`postcss` via `next`) is a moderate-severity transitive finding with no practical exploit path in typical Next.js app code — monitor for a `next` patch that resolves it.
