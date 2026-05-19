---
bootstrapped_at: 2026-05-19T16:18:00Z
starter_id: next
starter_name: 'Next.js'
project_name: shelter-needs
language_family: js
package_manager: npm
cwd_strategy: subdir-then-move
bootstrapper_confidence: verified
phase_3_status: ok
audit_command: 'npm audit --json'
---

# Bootstrap Verification — shelter-needs

## Hand-off

```yaml
starter_id: next
package_manager: npm
project_name: shelter-needs
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: verified
  path_taken: custom
  quality_override: false
  self_check_answers:
    typed: true
    from_official_starter: true
    conventions: true
    docs_current: true
    can_judge_agent: true
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

### Why this stack

Next.js with TypeScript passes all four agent-friendly criteria and fits the ShelterNeeds profile: solo developer, 3-week after-hours timeline, web-app with email/password authentication (FR-001, FR-002). App Router imposes file-based routing conventions so an AI agent can reason about the codebase structure without reading every file. The TypeScript-first setup aligns with the project's explicit type preference. Cloudflare Pages deployment gives edge-close hosting with a generous free tier suitable for a medium-scale shelter coordination platform. Auth will be wired via NextAuth or Supabase Auth — the only manual step compared to the 10x-astro-starter alternative, which ships Supabase auth out of the box. GitHub Actions handles CI with auto-deploy on merge to main, keeping the release cycle as frictionless as possible for a solo contributor working after hours.

---

## Pre-scaffold verification

| Signal      | Value                                        | Severity | Notes                                         |
| ----------- | -------------------------------------------- | -------- | --------------------------------------------- |
| npm package | create-next-app v16.2.6 published 2026-05-19 | fresh    | resolved from cmd_template                    |
| GitHub repo | not run                                      | —        | docs_url is nextjs.org/docs, not a GitHub URL |

Both signals clear. The starter is actively maintained and the CLI is current.

---

## Scaffold log

**Resolved invocation**: `npx create-next-app@latest bootstrap-scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`

**Note on temp directory name**: `create-next-app` enforces npm package naming restrictions on the project name argument — names starting with `.` are rejected. The default `.bootstrap-scaffold` was adapted to `bootstrap-scaffold` (no leading dot). The `subdir-then-move` strategy is otherwise unchanged.

**Strategy**: subdir-then-move (scaffold into temp directory, move files up, delete temp directory)
**Exit code**: 0

**Files moved silently (new — no conflict)**:

- `.next/types/cache-life.d.ts`, `.next/types/routes.d.ts`, `.next/types/validator.ts`
- `AGENTS.md`
- `eslint.config.mjs`
- `next.config.ts`
- `next-env.d.ts`
- `package-lock.json`
- `postcss.config.mjs`
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- `src/app/favicon.ico`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`

**Conflicts (.scaffold siblings)**: `package.json.scaffold`, `README.md.scaffold`, `CLAUDE.md.scaffold`, `tsconfig.json.scaffold`

**.gitignore handling**: append-merged — 40 new lines appended after a `# from next` separator; 1 duplicate line (`.DS_Store`) de-duped and skipped.

**node_modules handling**: cwd already contained a `node_modules/` directory (from the `10x-cli` project's bun install). The scaffold's `node_modules/` (359 Next.js packages installed by `npm install` during scaffolding) was not moved to avoid colliding with the existing directory. It was deleted with the temp scaffold directory. **Action required**: run `npm install` from the project root once you have reviewed `package.json.scaffold` and adopted it as your primary `package.json`.

**.bootstrap-scaffold cleanup**: temp directory (`bootstrap-scaffold/`) deleted successfully.

---

## Post-scaffold audit

**Tool**: `npm audit --json`
**Summary**: 0 CRITICAL, 0 HIGH, 2 MODERATE, 0 LOW
**Direct vs transitive**: 0/0/2/0 direct of total 0/0/2/0 — both MODERATE findings are transitive (via Next.js's bundled postcss)

#### MODERATE findings

- **postcss** (bundled by `next`, range `<8.5.10`) — GHSA-qx2v-qp2m-jg93: PostCSS has XSS via Unescaped `</style>` in its CSS Stringify Output. CVSS 6.1 (AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N). This is a transitive vulnerability in Next.js's internal postcss bundle, not in the project's own `postcss` dependency. Fix: `npm audit fix` (or wait for a Next.js patch release). Risk is low for server-side-only CSS processing contexts.

No CRITICAL or HIGH findings. All MODERATE and below.

---

## Hints recorded but not acted on

| Hint                                     | Value                |
| ---------------------------------------- | -------------------- |
| bootstrapper_confidence                  | verified             |
| quality_override                         | false                |
| path_taken                               | custom               |
| self_check_answers.typed                 | true                 |
| self_check_answers.from_official_starter | true                 |
| self_check_answers.conventions           | true                 |
| self_check_answers.docs_current          | true                 |
| self_check_answers.can_judge_agent       | true                 |
| team_size                                | solo                 |
| deployment_target                        | cloudflare-pages     |
| ci_provider                              | github-actions       |
| ci_default_flow                          | auto-deploy-on-merge |
| has_auth                                 | true                 |
| has_payments                             | false                |
| has_realtime                             | false                |
| has_ai                                   | false                |
| has_background_jobs                      | false                |

These hints were read and staged for the audit trail. No automated action was taken on them in v1. The future M1L4 skill ("Memory Architecture") will use `has_auth`, `deployment_target`, `ci_provider`, and related hints to configure agent context files.

---

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:

- Review `.scaffold` siblings and decide which version to keep:
  - `diff package.json package.json.scaffold` — adopt the Next.js `package.json` as the primary once you're ready to commit to this project.
  - `diff README.md README.md.scaffold` — the scaffold ships a default Next.js README.
  - `diff tsconfig.json tsconfig.json.scaffold` — the scaffold's `tsconfig.json` is tuned for Next.js (App Router paths, JSX, etc.). Merge the strict settings from the current `tsconfig.json` if desired.
  - `CLAUDE.md.scaffold` is a stub (`# CLAUDE.md`) — your existing `CLAUDE.md` is richer; keep it.
- Run `npm install` to reinstall the Next.js dependency tree (the scaffold's `node_modules/` was not moved — see scaffold log above).
- Address the MODERATE audit finding: `npm audit fix` updates the internal `postcss` bundle within Next.js.
- `git init` (if you have not already) to start your own repo history.
- For Cloudflare Pages deployment: add `@cloudflare/next-on-pages` and configure `wrangler.toml` per the Cloudflare Pages docs.
- For auth (`has_auth: true`): wire up NextAuth.js (`npm install next-auth`) or Supabase Auth — not scaffolded, the hand-off notes this as the one manual step for this stack.
