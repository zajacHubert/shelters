# Auth Scaffold — Plan Brief

> Full plan: `context/changes/auth-scaffold/plan.md`

## What & Why

Custom email+password auth: scrypt hashing, JWT session cookies via `jose`, Next.js middleware for `/dashboard/*`, Server Actions for register/login/logout. Fundament pod S-01 (rejestracja/logowanie) i S-02 (panel potrzeb). Bez F-02 żadna chroniona trasa nie istnieje.

## Starting Point

`src/db/queries/shelters.ts` ma `createShelter` (przyjmuje `password_hash`) i `getShelterByEmail` (zwraca pełny wiersz). `nodejs_compat` włączony — `node:crypto` dostępne w Workers. Zero infrastruktury auth: brak middleware, brak stron /login /register, brak Dashboard. `jose` nie jest zainstalowane.

## Desired End State

`/register` → auto-login → `/dashboard`. `/login` → `/dashboard`. `/dashboard` bez sesji → `/login?from=/dashboard`. Wylogowanie → `/`. Server Actions zwracają `{ error }` inline. Cookie `shelter_session`: httpOnly, Secure, SameSite=Lax, 7 dni. JWT payload: `{ shelterId }`. `tsc` + `lint` przechodzą.

## Key Decisions Made

| Decision         | Choice                                   | Why (1 sentence)                                                               |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| Auth approach    | Custom (scrypt + JWT cookie)             | Zero zmian schematu DB; `password_hash` zostaje w `shelters`; pełna kontrola   |
| Password hashing | `scrypt` via `node:crypto`               | Zero pakietów; natywny w Node.js; `nodejs_compat` zapewnia dostęp w Workers    |
| JWT library      | `jose`                                   | Edge-runtime compatible; działa w middleware (Edge) i Server Actions (Workers) |
| Session payload  | `{ shelterId }` only                     | Minimalna powierzchnia; dane schroniska pobierane z DB gdy potrzebne           |
| Session duration | 7 dni                                    | Wygodne dla non-tech koordynatora; MVP                                         |
| Protected routes | `/dashboard/*` middleware matcher        | Prosta reguła, jasna separacja public/private                                  |
| Redirect param   | `/login?from=<path>`                     | Po zalogowaniu wraca tam skąd przyszedł                                        |
| Post-register    | Auto-login → `/dashboard`                | Guardrail PRD: rejestracja <5 minut; jeden krok mniej                          |
| Error handling   | Server Actions + `useActionState` inline | Zero redirect-flash; React 19 natywny pattern w App Router                     |
| JWT_SECRET scope | Server-only (NOT `NEXT_PUBLIC_`)         | Secret nie może trafić do client bundle                                        |

## Scope

**In scope:**

- `npm install jose`
- `.env.local` — `JWT_SECRET` (gitignored)
- `.dev.vars` — `JWT_SECRET` (gitignored, dla wrangler preview)
- `src/lib/auth/password.ts` — `hashPassword`, `verifyPassword`
- `src/lib/auth/session.ts` — `createSession`, `getSession`, `deleteSession`
- `src/app/actions/auth.ts` — `registerAction`, `loginAction`, `logoutAction`
- `src/app/(auth)/layout.tsx` — centered auth layout
- `src/app/(auth)/register/page.tsx` — registration form
- `src/app/(auth)/login/page.tsx` — login form (reads `?from` param)
- `src/middleware.ts` — JWT guard for `/dashboard/*`
- `src/app/dashboard/page.tsx` — placeholder (shows shelterId, logout button)
- `deploy.yml` — komentarz o `JWT_SECRET` jako GitHub Secret

**Out of scope:**

- Prawdziwy UI dashboardu (S-01, S-02)
- Email verification (post-MVP)
- Password reset (post-MVP)
- Rate limiting (post-MVP)
- RLS w Supabase (post-MVP)

## Phase Summary

| Phase | Description                        | Key files                                             |
| ----- | ---------------------------------- | ----------------------------------------------------- |
| 1     | Auth utilities                     | `src/lib/auth/password.ts`, `src/lib/auth/session.ts` |
| 2     | Server Actions                     | `src/app/actions/auth.ts`                             |
| 3     | Auth pages                         | `src/app/(auth)/register/page.tsx`, `login/page.tsx`  |
| 4     | Middleware + dashboard placeholder | `src/middleware.ts`, `src/app/dashboard/page.tsx`     |

## Critical Warning

`JWT_SECRET` jest secretem serwerowym. Musi trafić do:

- `.env.local` (local dev, gitignored)
- `.dev.vars` (wrangler preview, gitignored)
- Cloudflare dashboard lub `wrangler secret put JWT_SECRET` (produkcja)
- GitHub Actions secret `JWT_SECRET` (nie variable!) w deploy.yml
