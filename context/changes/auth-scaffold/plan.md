# Auth Scaffold Implementation Plan

## Overview

Implement custom email+password authentication using `scrypt` (node:crypto) for password hashing and `jose` for JWT session cookies. Exposes three Server Actions (register, login, logout), two auth pages (/register, /login), Next.js middleware that guards `/dashboard/*`, and a placeholder `/dashboard` page. No schema changes — `shelters.password_hash` stays as-is from F-01.

## Current State Analysis

Next.js 15.5 App Router on Cloudflare Workers. `src/db/queries/shelters.ts` already has `createShelter` (accepts `password_hash`) and `getShelterByEmail` (returns full row including `password_hash`). `nodejs_compat` flag in `wrangler.jsonc` enables `node:crypto` in the Workers runtime. Only `src/app/page.tsx` exists — no auth pages, no middleware, no dashboard. `jose` is not installed.

## Desired End State

A coordinator can register a shelter (`/register`), log in (`/login`), reach `/dashboard`, and log out. Visiting `/dashboard` without a valid session JWT redirects to `/login?from=/dashboard`. Server Actions return `{ error }` on failure so forms display inline errors. Session cookie: `shelter_session`, httpOnly, Secure, SameSite=Lax, 7-day maxAge. JWT payload: `{ shelterId }` signed with `HS256`. `npx tsc --noEmit` and `npm run lint` pass.

### Key Discoveries

- `node:crypto` `scrypt` is available in Workers via `nodejs_compat` — no external package needed
- `jose` is Edge-runtime compatible — works in Next.js middleware AND in Server Actions
- Existing `createShelter` already accepts `password_hash: string` — no schema changes needed
- `getShelterByEmail` returns the full row including `password_hash` — login can verify directly
- `JWT_SECRET` must be a server-side secret (NOT `NEXT_PUBLIC_`) — set via `.env.local` locally and `wrangler secret put JWT_SECRET` for production
- Next.js middleware (`src/middleware.ts`) runs in Edge runtime — only `jose` used there, not `node:crypto`; no conflict
- `cookies()` from `next/headers` is async in Next.js 15 — must be `await`ed

## What We're NOT Doing

- No "remember me" toggle — always 7 days
- No email verification — MVP trusts registration data (PRD §FR-001 Socrates note)
- No password reset flow — post-MVP
- No rate limiting on login endpoint — post-MVP
- No RLS in Supabase — anon key with application-layer isolation
- No refresh token rotation — single JWT, re-login after expiry
- No actual dashboard UI — placeholder only; S-01/S-02 own the real pages

## Implementation Approach

Four sequential phases: (1) install `jose` and write auth utility functions (password hash/verify, JWT session helpers); (2) write Server Actions (register, login, logout) that wire utilities to DB queries; (3) create auth pages with forms that call the Server Actions; (4) add middleware and dashboard placeholder. Each phase is independently verifiable via tsc + lint before the next starts.

## Critical Implementation Details

**`JWT_SECRET` env var**: NEVER `NEXT_PUBLIC_` — it is a server-only secret. Locally in `.env.local`, for Workers preview in `.dev.vars`, for production via `wrangler secret put JWT_SECRET`. The deploy.yml must inject it as a GitHub secret (not a variable).

**scrypt in Workers**: `node:crypto` is available in the Worker runtime via `nodejs_compat`, but NOT in Next.js middleware (Edge). `scrypt` is only called from Server Actions (Worker runtime) — middleware only calls `jwtVerify` from `jose` (Edge-safe). No conflict.

**`cookies()` is async in Next.js 15**: `const cookieStore = await cookies()` — forgetting `await` is a silent runtime error. Always await it.

**`timingSafeEqual` for password verify**: comparing hashes with `===` leaks timing info. Always use `timingSafeEqual` from `node:crypto`.

**Route group `(auth)`**: `src/app/(auth)/` groups login and register pages with a shared layout but no URL prefix — `/login` and `/register` are the public URLs.

---

## Phase 1: Auth Utilities

### Overview

Install `jose`, write `src/lib/auth/password.ts` (scrypt hash + verify) and `src/lib/auth/session.ts` (JWT sign/verify + cookie set/get/delete). Add `JWT_SECRET` to environment files.

### Changes Required

#### 1. Install jose

`npm install jose`

#### 2. Add JWT_SECRET to env files

**`.env.local`** — append:

```
JWT_SECRET=<random-32-char-hex>  # generate: openssl rand -hex 32
```

**`.dev.vars`** (new, gitignored) — for wrangler preview:

```
JWT_SECRET=<same-value>
```

#### 3. Create src/lib/auth/password.ts

**File**: `src/lib/auth/password.ts` (new)

**Contract**:

- `hashPassword(password: string): Promise<string>` — scrypt with random 16-byte salt; returns `"<hash>.<salt>"` (both hex-encoded)
- `verifyPassword(password: string, stored: string): Promise<boolean>` — splits stored, re-derives with same salt, compares with `timingSafeEqual`

```ts
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [hash, salt] = stored.split('.');
  if (!hash || !salt) return false;
  const hashBuf = Buffer.from(hash, 'hex');
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return timingSafeEqual(hashBuf, derived);
}
```

#### 4. Create src/lib/auth/session.ts

**File**: `src/lib/auth/session.ts` (new)

**Contract**:

- `type SessionPayload = { shelterId: string }`
- `COOKIE_NAME = 'shelter_session'`
- `createSession(payload: SessionPayload): Promise<void>` — signs JWT, writes httpOnly cookie (7 days)
- `getSession(): Promise<SessionPayload | null>` — reads cookie, verifies JWT, returns payload or null
- `deleteSession(): Promise<void>` — deletes the cookie

```ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type SessionPayload = { shelterId: string };

const COOKIE_NAME = 'shelter_session';
const EXPIRY_DAYS = 7;

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET env var is not set');
  return new TextEncoder().encode(s);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY_DAYS}d`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}
```

> **Known limitation**: `secure: true` jest ustawiane gdy `NODE_ENV === 'production'`.
> `npm run dev` (dev server) — `NODE_ENV=development`, `secure: false` → cookie działa na HTTP. ✅
> `npm run preview` (wrangler local) — build odbywa się w trybie `production`, ale wrangler serwuje HTTP → przeglądarka odrzuci cookie z flagą Secure. Auth nie będzie działać przez `npm run preview`. Użyj `npm run dev` do testowania logowania lokalnie.

export async function getSession(): Promise<SessionPayload | null> {
const cookieStore = await cookies();
const token = cookieStore.get(COOKIE_NAME)?.value;
if (!token) return null;
try {
const { payload } = await jwtVerify(token, getSecret());
return { shelterId: payload['shelterId'] as string };
} catch {
return null;
}
}

export async function deleteSession(): Promise<void> {
const cookieStore = await cookies();
cookieStore.delete(COOKIE_NAME);
}

````

### Success Criteria

#### Automated Verification

- `npx tsc --noEmit` passes (password.ts + session.ts compile without errors)
- `npm run lint` passes

---

## Phase 2: Server Actions

### Overview

Write `src/app/actions/auth.ts` with three Server Actions: `registerAction`, `loginAction`, `logoutAction`. They wire auth utilities to the existing DB query helpers.

### Changes Required

#### 1. Create src/app/actions/auth.ts

**File**: `src/app/actions/auth.ts` (new)

**Contract**:

- `registerAction(formData: FormData): Promise<{ error?: string }>` — validates required fields, checks email uniqueness, hashes password, calls `createShelter`, auto-logs in via `createSession`, redirects to `/dashboard`
- `loginAction(formData: FormData): Promise<{ error?: string }>` — finds shelter by email, verifies password, creates session, redirects to `from` param or `/dashboard`
- `logoutAction(): Promise<void>` — deletes session cookie, redirects to `/`

```ts
'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/db/client';
import { createShelter, getShelterByEmail } from '@/db/queries/shelters';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, deleteSession } from '@/lib/auth/session';

export async function registerAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const city = (formData.get('city') as string | null)?.trim() ?? '';
  const email =
    (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
  const password = (formData.get('password') as string | null) ?? '';

  if (!name || !city || !email || !password) {
    return { error: 'Wszystkie pola są wymagane.' };
  }
  if (password.length < 8) {
    return { error: 'Hasło musi mieć co najmniej 8 znaków.' };
  }

  const db = createServerClient();
  const existing = await getShelterByEmail(db, email);
  if (existing) {
    return { error: 'Ten adres e-mail jest już zarejestrowany.' };
  }

  const password_hash = await hashPassword(password);
  const shelter = await createShelter(db, { name, city, email, password_hash });

  await createSession({ shelterId: shelter.id });
  redirect('/dashboard');
}

export async function loginAction(
  _prevState: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const email =
    (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
  const password = (formData.get('password') as string | null) ?? '';
  const from = (formData.get('from') as string | null) ?? '/dashboard';

  if (!email || !password) {
    return { error: 'Podaj e-mail i hasło.' };
  }

  const db = createServerClient();
  const shelter = await getShelterByEmail(db, email);
  if (!shelter) {
    return { error: 'Nieprawidłowy e-mail lub hasło.' };
  }

  const valid = await verifyPassword(password, shelter.password_hash);
  if (!valid) {
    return { error: 'Nieprawidłowy e-mail lub hasło.' };
  }

  await createSession({ shelterId: shelter.id });
  redirect(from.startsWith('/') ? from : '/dashboard');
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect('/');
}
````

### Success Criteria

#### Automated Verification

- `npx tsc --noEmit` passes
- `npm run lint` passes

---

## Phase 3: Auth Pages

### Overview

Create `/register` and `/login` pages in a `(auth)` route group. Forms call Server Actions; errors display inline.

### Changes Required

#### 1. Create src/app/(auth)/layout.tsx

**File**: `src/app/(auth)/layout.tsx` (new, minimal)

Simple centered layout for auth pages — no auth check (public routes).

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      {children}
    </div>
  );
}
```

#### 2. Create src/app/(auth)/register/page.tsx

**File**: `src/app/(auth)/register/page.tsx` (new)

Form with fields: name, city, email, password. Uses `useActionState` (React 19) to display inline errors from `registerAction`.

```tsx
'use client';

import { useActionState } from 'react';
import { registerAction } from '@/app/actions/auth';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <form action={formAction} className='w-full max-w-sm space-y-4'>
      <h1 className='text-xl font-semibold'>Zarejestruj schronisko</h1>
      {state.error && <p className='text-red-600 text-sm'>{state.error}</p>}
      <input
        name='name'
        placeholder='Nazwa schroniska'
        required
        className='input'
      />
      <input name='city' placeholder='Miasto' required className='input' />
      <input
        name='email'
        type='email'
        placeholder='E-mail'
        required
        className='input'
      />
      <input
        name='password'
        type='password'
        placeholder='Hasło (min. 8 znaków)'
        required
        className='input'
      />
      <button type='submit' disabled={pending} className='btn-primary w-full'>
        {pending ? 'Rejestrowanie…' : 'Zarejestruj'}
      </button>
      <p className='text-sm text-center'>
        Masz konto?{' '}
        <a href='/login' className='underline'>
          Zaloguj się
        </a>
      </p>
    </form>
  );
}
```

**Note**: `registerAction` does not match `useActionState` signature (no `prevState` param). Use a wrapper or switch to `useFormState` — see implementation note below.

**Implementation note**: `useActionState` expects `(prevState, formData) => Promise<State>`. Adjust `registerAction` to accept `(_prev: { error?: string }, formData: FormData)` to match.

#### 3. Create src/app/(auth)/login/page.tsx

**File**: `src/app/(auth)/login/page.tsx` (new)

Reads `from` search param (passed from middleware redirect), includes it as a hidden input.

```tsx
'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import { Suspense } from 'react';

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/dashboard';
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className='w-full max-w-sm space-y-4'>
      <h1 className='text-xl font-semibold'>Logowanie</h1>
      {state.error && <p className='text-red-600 text-sm'>{state.error}</p>}
      <input type='hidden' name='from' value={from} />
      <input
        name='email'
        type='email'
        placeholder='E-mail'
        required
        className='input'
      />
      <input
        name='password'
        type='password'
        placeholder='Hasło'
        required
        className='input'
      />
      <button type='submit' disabled={pending} className='btn-primary w-full'>
        {pending ? 'Logowanie…' : 'Zaloguj się'}
      </button>
      <p className='text-sm text-center'>
        Nie masz konta?{' '}
        <a href='/register' className='underline'>
          Zarejestruj schronisko
        </a>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

### Success Criteria

#### Automated Verification

- `npx tsc --noEmit` passes
- `npm run lint` passes

---

## Phase 4: Middleware and Dashboard Placeholder

### Overview

Add `src/middleware.ts` to guard `/dashboard/*` with JWT verification. Add a placeholder `/dashboard/page.tsx` showing the shelter ID from session. Update `deploy.yml` to note the JWT_SECRET requirement.

### Changes Required

#### 1. Create src/middleware.ts

**File**: `src/middleware.ts` (new, project root under src/)

**Contract**: Intercepts requests matching `/dashboard/:path*`. Reads `shelter_session` cookie, verifies JWT with `jose`. On missing or invalid token: redirects to `/login?from=<pathname>`. On valid token: passes through.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'shelter_session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const from = request.nextUrl.pathname;
    return NextResponse.redirect(new URL(`/login?from=${from}`, request.url));
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const from = request.nextUrl.pathname;
    return NextResponse.redirect(new URL(`/login?from=${from}`, request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

#### 2. Create src/app/dashboard/page.tsx

**File**: `src/app/dashboard/page.tsx` (new, placeholder)

Server Component that reads the session and displays the shelter ID. Replaced by S-01 with real UI.

```tsx
import { getSession } from '@/lib/auth/session';
import { logoutAction } from '@/app/actions/auth';

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <main className='p-8'>
      <h1 className='text-xl font-semibold mb-4'>Panel koordynatora</h1>
      <p className='text-sm text-gray-600 mb-8'>
        Shelter ID: {session?.shelterId}
      </p>
      <form action={logoutAction}>
        <button type='submit' className='btn-secondary'>
          Wyloguj się
        </button>
      </form>
    </main>
  );
}
```

#### 3. Update .github/workflows/deploy.yml

Add `JWT_SECRET` as an active env entry in the Deploy step, sourced from a GitHub Actions **secret** (Settings → Secrets → Actions → New repository secret, Name: `JWT_SECRET`):

```yaml
JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

### Success Criteria

#### Automated Verification

- `npx tsc --noEmit` passes
- `npm run lint` passes

#### Manual Verification

- `npm run dev` → `/register` → fill form → lands on `/dashboard` with correct shelter ID
- `/dashboard` without session cookie → redirects to `/login?from=/dashboard`
- `/login` → correct credentials → lands on `/dashboard`
- Logout button → redirects to `/`
- Login with wrong password → shows inline error "Nieprawidłowy e-mail lub hasło."

**Implementation Note**: After automated passes and manual gate cleared, commit and write SHA back to Progress.

---

## References

- Roadmap F-02: `context/foundation/roadmap.md`
- PRD: `context/foundation/prd.md` — FR-001, FR-002, FR-003
- F-01 plan: `context/changes/data-layer-foundation/plan.md`
- jose docs: https://github.com/panva/jose
- Next.js middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- scrypt (node:crypto): https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Auth Utilities

#### Automated

- [x] 1.1 `npx tsc --noEmit` passes with password.ts and session.ts present — 2d9b3bf
- [x] 1.2 `npm run lint` passes — 2d9b3bf

### Phase 2: Server Actions

#### Automated

- [x] 2.1 `npx tsc --noEmit` passes with auth.ts actions present — 678baff
- [x] 2.2 `npm run lint` passes — 678baff

### Phase 3: Auth Pages

#### Automated

- [x] 3.1 `npx tsc --noEmit` passes
- [x] 3.2 `npm run lint` passes

### Phase 4: Middleware and Dashboard Placeholder

#### Automated

- [ ] 4.1 `npx tsc --noEmit` passes
- [ ] 4.2 `npm run lint` passes

#### Manual

- [ ] 4.3 `/register` → fill form → `/dashboard` shows shelter ID
- [ ] 4.4 `/dashboard` without session → redirects to `/login?from=/dashboard`
- [ ] 4.5 `/login` → correct credentials → `/dashboard`
- [ ] 4.6 Logout → redirects to `/`
- [ ] 4.7 Wrong password → inline error displayed
