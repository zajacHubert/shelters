# Shelter Registration and Login Implementation Plan

## Overview

S-01 builds the coordinator UX layer on top of F-02's auth scaffold. All Server Actions (`registerAction`, `loginAction`, `logoutAction`), middleware, and route group are already in place from F-02. This slice makes the experience usable: style the forms, add labels for accessibility, show shelter info (not raw UUID) on the dashboard.

## Current State Analysis

- **`globals.css`** has no `.input`, `.btn-primary`, `.btn-secondary` utility classes. F-02 forms reference these classes but they're undefined — forms render as bare unstyled HTML inputs.
- **Dashboard** (`src/app/dashboard/page.tsx`) shows `Shelter ID: <uuid>` — not the shelter name. Unhelpful for a coordinator.
- **Forms** have placeholders only, no `<label>` elements — fails basic accessibility and the PRD guardrail ("register in <5 minutes") because bare inputs without labels are confusing.
- **DB queries** — `getShelterById` doesn't exist. Only `getShelterByEmail` and `getSheltersByCity` are available.
- **What's working from F-02**: `registerAction` (validates, hashes, creates session), `loginAction` (verifies, creates session), `logoutAction` (deletes session), `middleware.ts` (guards `/dashboard/*`), `(auth)/layout.tsx` (centered layout), session JWT cookie lifecycle.

## Desired End State

- Coordinator visits `/register`, fills a clearly labeled form, submits — lands on `/dashboard` showing their shelter name and city.
- Coordinator visits `/login`, fills a clearly labeled form — lands on `/dashboard`.
- `/dashboard` shows shelter name, city, and a styled logout button.
- Inline error messages display on bad input (already wired in F-02 via `state.error`).
- `npx tsc --project tsconfig.app.json --noEmit` and `npm run lint` pass.
- Forms are responsive and accessible (labeled inputs, disabled submit during pending).

## What We're NOT Doing

- No Server Action changes — F-02 actions are complete (register, login, logout)
- No password confirmation field — PRD doesn't require it in MVP
- No email verification — PRD §FR-001 Socrates note: MVP oparty na zaufaniu
- No "remember me" toggle — always 7 days (F-02 decision)
- No needs management panel — S-02
- No shelter profile edit — post-MVP

## Implementation Approach

Three sequential phases: (1) CSS utilities — define `.input`, `.btn-primary`, `.btn-secondary` in `globals.css` so the existing forms render correctly; (2) DB query + dashboard — add `getShelterById` query, update dashboard to show shelter name and city from session; (3) form labels — add `<label>` elements to register and login pages to meet accessibility and the 5-minute guardrail.

## Critical Implementation Details

**Tailwind CSS v4 `@layer` syntax**: `globals.css` uses `@import "tailwindcss"` (v4 style). To define utility classes, use `@layer components { ... }` or `@layer utilities { ... }` inside the CSS file — NOT `@apply` inside a JS/TS file.

**`getShelterById` must be isolated by shelterId**: the query fetches by primary key `id`. The caller (dashboard page) already gets `shelterId` from `getSession()` which is JWT-verified — no additional isolation needed at the query level.

**Dashboard is a Server Component** — it can `await getSession()` and `await getShelterById()` directly. No client-side state needed.

---

## Phase 1: CSS Utility Classes

### Overview

Define `.input`, `.btn-primary`, `.btn-secondary` in `src/app/globals.css` using Tailwind v4's `@layer components`. These classes are already referenced by the F-02 forms — defining them is the unlock.

### Changes Required

#### 1. Update src/app/globals.css

**File**: `src/app/globals.css` (modify — append layer block)

Add after the existing `body` rule:

```css
@layer components {
  .input {
    @apply w-full rounded-md border border-gray-300 px-3 py-2 text-sm
      placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
      focus:border-transparent disabled:opacity-50;
    font-family: inherit;
  }

  .btn-primary {
    @apply inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2
      text-sm font-medium text-white hover:bg-blue-700 focus:outline-none
      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center rounded-md border border-gray-300
      bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      disabled:opacity-50 transition-colors;
  }
}
```

### Success Criteria

#### Automated Verification

- `npx tsc --project tsconfig.app.json --noEmit` passes
- `npm run lint` passes

#### Manual Verification

- `npm run dev` → `/register` — form inputs have visible border, blue focus ring, submit button is blue
- `/login` — same styling applies

---

## Phase 2: DB Query and Dashboard Update

### Overview

Add `getShelterById` to `src/db/queries/shelters.ts`. Update `src/app/dashboard/page.tsx` to fetch and display shelter name and city from the session's `shelterId`.

### Changes Required

#### 1. Add getShelterById to src/db/queries/shelters.ts

**File**: `src/db/queries/shelters.ts` (modify — append function)

```ts
export async function getShelterById(
  db: Db,
  id: string,
): Promise<Shelter | null> {
  const { data, error } = await db
    .from('shelters')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
```

#### 2. Update src/app/dashboard/page.tsx

**File**: `src/app/dashboard/page.tsx` (replace — show shelter name + city)

```tsx
import { getSession } from '@/lib/auth/session';
import { createServerClient } from '@/db/client';
import { getShelterById } from '@/db/queries/shelters';
import { logoutAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = createServerClient();
  const shelter = await getShelterById(db, session.shelterId);

  return (
    <main className='p-8 max-w-2xl mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-semibold'>{shelter?.name ?? 'Panel'}</h1>
          <p className='text-sm text-gray-500 mt-1'>{shelter?.city}</p>
        </div>
        <form action={logoutAction}>
          <button type='submit' className='btn-secondary'>
            Wyloguj się
          </button>
        </form>
      </div>
      <p className='text-gray-600'>Panel zarządzania potrzebami — wkrótce.</p>
    </main>
  );
}
```

### Success Criteria

#### Automated Verification

- `npx tsc --project tsconfig.app.json --noEmit` passes
- `npm run lint` passes

#### Manual Verification

- `/dashboard` after login shows shelter name and city (not raw UUID)

---

## Phase 3: Form Labels and Accessibility

### Overview

Add `<label>` elements to `/register` and `/login` forms. Labels are linked to inputs via `htmlFor`/`id`. This satisfies the PRD guardrail (non-tech coordinators can orient faster with labels than placeholders alone) and basic accessibility.

### Changes Required

#### 1. Update src/app/(auth)/register/page.tsx

**File**: `src/app/(auth)/register/page.tsx` (replace)

```tsx
'use client';

import { useActionState } from 'react';
import { registerAction } from '@/app/actions/auth';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <form action={formAction} className='w-full max-w-sm space-y-4'>
      <h1 className='text-xl font-semibold'>Zarejestruj schronisko</h1>
      {state.error && (
        <p role='alert' className='text-red-600 text-sm'>
          {state.error}
        </p>
      )}

      <div className='space-y-1'>
        <label
          htmlFor='name'
          className='block text-sm font-medium text-gray-700'
        >
          Nazwa schroniska
        </label>
        <input
          id='name'
          name='name'
          placeholder='np. Schronisko Na Paluchu'
          required
          className='input'
        />
      </div>

      <div className='space-y-1'>
        <label
          htmlFor='city'
          className='block text-sm font-medium text-gray-700'
        >
          Miasto
        </label>
        <input
          id='city'
          name='city'
          placeholder='np. Warszawa'
          required
          className='input'
        />
      </div>

      <div className='space-y-1'>
        <label
          htmlFor='email'
          className='block text-sm font-medium text-gray-700'
        >
          Adres e-mail
        </label>
        <input
          id='email'
          name='email'
          type='email'
          placeholder='koordynator@schronisko.pl'
          required
          className='input'
        />
      </div>

      <div className='space-y-1'>
        <label
          htmlFor='password'
          className='block text-sm font-medium text-gray-700'
        >
          Hasło
        </label>
        <input
          id='password'
          name='password'
          type='password'
          placeholder='Minimum 8 znaków'
          required
          className='input'
        />
      </div>

      <button type='submit' disabled={pending} className='btn-primary w-full'>
        {pending ? 'Rejestrowanie…' : 'Zarejestruj schronisko'}
      </button>
      <p className='text-sm text-center text-gray-600'>
        Masz już konto?{' '}
        <a
          href='/login'
          className='text-blue-600 underline hover:text-blue-800'
        >
          Zaloguj się
        </a>
      </p>
    </form>
  );
}
```

#### 2. Update src/app/(auth)/login/page.tsx

**File**: `src/app/(auth)/login/page.tsx` (replace)

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
      {state.error && (
        <p role='alert' className='text-red-600 text-sm'>
          {state.error}
        </p>
      )}
      <input type='hidden' name='from' value={from} />

      <div className='space-y-1'>
        <label
          htmlFor='email'
          className='block text-sm font-medium text-gray-700'
        >
          Adres e-mail
        </label>
        <input
          id='email'
          name='email'
          type='email'
          placeholder='koordynator@schronisko.pl'
          required
          className='input'
        />
      </div>

      <div className='space-y-1'>
        <label
          htmlFor='password'
          className='block text-sm font-medium text-gray-700'
        >
          Hasło
        </label>
        <input
          id='password'
          name='password'
          type='password'
          placeholder='Twoje hasło'
          required
          className='input'
        />
      </div>

      <button type='submit' disabled={pending} className='btn-primary w-full'>
        {pending ? 'Logowanie…' : 'Zaloguj się'}
      </button>
      <p className='text-sm text-center text-gray-600'>
        Nie masz konta?{' '}
        <a
          href='/register'
          className='text-blue-600 underline hover:text-blue-800'
        >
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

- `npx tsc --project tsconfig.app.json --noEmit` passes
- `npm run lint` passes

#### Manual Verification

- `/register` — each input has a visible label above it; form is usable without placeholders
- `/login` — each input has a visible label above it
- `/dashboard` after registration shows shelter name in heading and city as subtitle
- Full flow: register → dashboard → logout → login → dashboard → logout — all transitions correct
- Form pending state: submit button shows loading text and is disabled during submission

---

## References

- Roadmap S-01: `context/foundation/roadmap.md`
- PRD: `context/foundation/prd.md` — FR-001, FR-002, FR-003, Guardrails
- F-02 plan: `context/changes/auth-scaffold/plan.md`
- Tailwind CSS v4 `@layer`: https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: CSS Utility Classes

#### Automated

- [ ] 1.1 `npx tsc --project tsconfig.app.json --noEmit` passes
- [ ] 1.2 `npm run lint` passes

#### Manual

- [ ] 1.3 `/register` — form inputs have visible border and blue focus ring
- [ ] 1.4 `/login` — same styling applies

### Phase 2: DB Query and Dashboard Update

#### Automated

- [ ] 2.1 `npx tsc --project tsconfig.app.json --noEmit` passes
- [ ] 2.2 `npm run lint` passes

#### Manual

- [ ] 2.3 `/dashboard` after login shows shelter name and city (not raw UUID)

### Phase 3: Form Labels and Accessibility

#### Automated

- [ ] 3.1 `npx tsc --project tsconfig.app.json --noEmit` passes
- [ ] 3.2 `npm run lint` passes

#### Manual

- [ ] 3.3 `/register` — each input has a visible label above it
- [ ] 3.4 `/login` — each input has a visible label above it
- [ ] 3.5 Full flow: register → dashboard → logout → login → dashboard — all transitions correct
- [ ] 3.6 Submit button shows loading text and is disabled during submission
