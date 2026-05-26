<!-- PLAN-REVIEW-REPORT -->

# Plan Review: Auth Scaffold

**Date**: 2026-05-26  
**Mode**: Deep  
**Plan**: `context/changes/auth-scaffold/plan.md`  
**Verdict**: ~~REVISE~~ → **SOUND** (all findings resolved)

---

## Dimension Verdicts

| Dimension             | Verdict                   |
| --------------------- | ------------------------- |
| End-State Alignment   | ✅ PASS                   |
| Lean Execution        | ✅ PASS                   |
| Architectural Fitness | ✅ PASS                   |
| Blind Spots           | ✅ PASS (F2 resolved)     |
| Plan Completeness     | ✅ PASS (F1, F3 resolved) |

**Grounding**: useActionState ✓ (React 19.2.4), scrypt ✓ (node:crypto), .dev.vars gitignored ✓, src/middleware.ts path ✓, brief↔plan ✓

---

## Findings

### F1 — registerAction signature incompatible with useActionState ❌ RESOLVED

- **Severity**: CRITICAL → RESOLVED
- **Impact**: LOW
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — registerAction code snippet
- **Issue**: `registerAction(formData: FormData)` missing `_prev` param; `useActionState` passes `(prevState, formData)`. TypeScript would fail. `loginAction` was correctly defined but `registerAction` was not.
- **Fix applied**: Changed to `registerAction(_prev: { error?: string }, formData: FormData)` in plan.md Phase 2 code snippet.

### F2 — secure: true breaks cookie in npm run preview ⚠️ RESOLVED

- **Severity**: WARNING → RESOLVED (documented)
- **Impact**: LOW
- **Dimension**: Blind Spots
- **Location**: Phase 1 — session.ts, createSession
- **Issue**: opennextjs-cloudflare builds in production mode (NODE_ENV=production) so `secure: true` is set on cookie. Wrangler local preview serves HTTP → browser rejects Secure cookie.
- **Fix applied**: Added Known Limitation note in plan.md after the `createSession` code block: use `npm run dev` for local auth testing, not `npm run preview`.

### F3 — JWT_SECRET commented out in deploy.yml ℹ️ RESOLVED

- **Severity**: OBSERVATION → RESOLVED
- **Impact**: LOW
- **Dimension**: Plan Completeness
- **Location**: Phase 4 — deploy.yml
- **Issue**: Plan originally showed JWT_SECRET as a commented-out example, risking it being skipped during implementation.
- **Fix applied**: Changed to active `JWT_SECRET: ${{ secrets.JWT_SECRET }}` entry with instruction to create GitHub Actions secret.

---

## Notes

- jose not yet installed — Phase 1 correctly calls `npm install jose` first.
- `.dev.vars` for JWT_SECRET is already in `.gitignore` — verified.
- `cookies()` from `next/headers` is awaited correctly (Next.js 15 async API).
- `src/middleware.ts` location is correct for projects using `src/` directory.
- `logoutAction` used as `<form action={logoutAction}>` in a Server Component — correct Next.js App Router pattern.
