# Needs Management Panel Implementation Plan

## Overview

S-02 builds the CRUD panel for needs on top of F-01's DB query helpers (`getNeedsByShelter`, `createNeed`, `updateNeed`, `deleteNeed`) and S-01's auth. All four query functions already exist with proper `shelter_id` isolation. This slice adds: Server Actions that read `shelterId` from session (never from the client), a `NeedsPanel` Client Component with inline add/edit/delete, and wires it into the dashboard.

## Current State Analysis

- **`src/db/queries/needs.ts`** — COMPLETE: `getNeedsByShelter`, `createNeed`, `updateNeed`, `deleteNeed` — all with `shelter_id` guard. `Need` type has: `id` (number), `shelter_id`, `name`, `urgency` (Urgency), `quantity` (number), `allegro_link` (string | null), `created_at`.
- **`src/app/dashboard/page.tsx`** — currently shows shelter name/city/logout + placeholder "Panel zarządzania potrzebami — wkrótce."
- **`src/app/actions/auth.ts`** — exists; `needs.ts` sibling does NOT exist yet.
- **No `src/app/dashboard/needs-panel.tsx`** — needs to be created.
- **Urgency values**: `'pilne' | 'potrzebne' | 'mile_widziane'` (DB enum, TypeScript union in `src/db/types.ts`).

## Desired End State

- Dashboard shows the coordinator's needs list sorted by urgency (pilne → potrzebne → mile_widziane).
- Coordinator can add a need (name, urgency, quantity, optional allegro_link) via a form on the dashboard — list updates without full page reload.
- Coordinator can edit a need inline — clicking "Edytuj" reveals a pre-filled edit form in place of the item.
- Coordinator can delete a need — clicking "Usuń" removes the item.
- All mutations read `shelterId` from the JWT session (never trusted from client formData).
- `npx tsc --project tsconfig.app.json --noEmit` and `npm run lint` pass.
- FR-004, FR-005, FR-006 are satisfied.

## What We're NOT Doing

- No delete confirmation modal — PRD doesn't require it; plain button is sufficient for MVP
- No optimistic UI — `revalidatePath` + Next.js RSC rerender is sufficient
- No pagination / search — PRD doesn't specify; small shelter has ≤20 needs
- No bulk operations — post-MVP
- No file uploads for allegro_link — coordinator pastes URL manually
- No separate `/dashboard/needs/[id]/edit` page — inline edit is simpler and faster

## Implementation Approach

**Two phases**: (1) Server Actions — new `src/app/actions/needs.ts` with `addNeedAction`, `updateNeedAction`, `deleteNeedAction`; all read `shelterId` from `getSession()`, validate inputs, call query helpers, call `revalidatePath('/dashboard')`. (2) UI — new `src/app/dashboard/needs-panel.tsx` Client Component that receives `needs: Need[]` from server, manages `editingId` local state for inline edit, uses `useActionState` for add and update; dashboard page updated to fetch needs and render NeedsPanel.

## Critical Implementation Details

**Security — shelterId from session only**: Actions NEVER accept `shelter_id` or `shelterId` via formData. They call `getSession()` server-side. This ensures a malicious user cannot delete/edit another shelter's needs.

**`revalidatePath` causes RSC refresh**: After each mutation, `revalidatePath('/dashboard')` marks the path stale. Next.js App Router then pushes fresh RSC payload to the client — `DashboardPage` re-fetches `getNeedsByShelter` and passes the updated `needs` array to `NeedsPanel`. The Client Component receives new props and re-renders the list.

**`editingId` after mutation**: When `updateNeedAction` succeeds, the returned state contains `{ success: true }`. `NeedsPanel` watches for this in a `useEffect` and resets `editingId` to `null` on success. Alternative: return `{}` on success (no `success` key) and reset on empty state — but `useEffect` watching state change is cleaner.

Actually simpler: `updateNeedAction` returns `{ success?: true, error?: string }`. `NeedsPanel` clears `editingId` when `useActionState` returns `success: true`. Use `useEffect(() => { if (updateState.success) setEditingId(null); }, [updateState.success])`.

**Urgency display labels**: map DB values to Polish display:

```ts
const URGENCY_LABEL: Record<Urgency, string> = {
  pilne: 'Pilne',
  potrzebne: 'Potrzebne',
  mile_widziane: 'Mile widziane',
};
```

**`quantity` validation**: must be a positive integer. Parse with `parseInt`, check `isNaN` and `<1`.

**`allegro_link` validation**: optional — if provided, should start with `https://` to avoid XSS. Basic URL check is sufficient for MVP.

---

## Phase 1: Server Actions

### Overview

Create `src/app/actions/needs.ts` with three Server Actions. Each reads `shelterId` from session, validates input, calls the corresponding query helper, and calls `revalidatePath('/dashboard')`.

### Changes Required

#### 1. Create src/app/actions/needs.ts

**File**: `src/app/actions/needs.ts` (new)

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { createServerClient } from '@/db/client';
import { createNeed, updateNeed, deleteNeed } from '@/db/queries/needs';
import type { Urgency } from '@/db/types';

const VALID_URGENCY: Urgency[] = ['pilne', 'potrzebne', 'mile_widziane'];

function parseNeedForm(formData: FormData):
  | {
      name: string;
      urgency: Urgency;
      quantity: number;
      allegro_link: string | null;
    }
  | { error: string } {
  const name = formData.get('name')?.toString().trim() ?? '';
  const urgency = formData.get('urgency')?.toString() as Urgency;
  const quantity = parseInt(formData.get('quantity')?.toString() ?? '', 10);
  const raw_link = formData.get('allegro_link')?.toString().trim() ?? '';
  const allegro_link = raw_link === '' ? null : raw_link;

  if (!name) return { error: 'Nazwa jest wymagana.' };
  if (!VALID_URGENCY.includes(urgency))
    return { error: 'Nieprawidłowy poziom pilności.' };
  if (isNaN(quantity) || quantity < 1)
    return { error: 'Ilość musi być liczbą większą od 0.' };
  if (allegro_link !== null && !allegro_link.startsWith('https://')) {
    return { error: 'Link do Allegro musi zaczynać się od https://.' };
  }

  return { name, urgency, quantity, allegro_link };
}

export async function addNeedAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) redirect('/login');

  const parsed = parseNeedForm(formData);
  if ('error' in parsed) return { error: parsed.error };

  const db = createServerClient();
  await createNeed(db, session.shelterId, parsed);
  revalidatePath('/dashboard');
  return {};
}

export async function updateNeedAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = parseInt(formData.get('id')?.toString() ?? '', 10);
  if (isNaN(id)) return { error: 'Nieprawidłowe ID potrzeby.' };

  const parsed = parseNeedForm(formData);
  if ('error' in parsed) return { error: parsed.error };

  const db = createServerClient();
  await updateNeed(db, session.shelterId, id, parsed);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteNeedAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = parseInt(formData.get('id')?.toString() ?? '', 10);
  if (!isNaN(id)) {
    const db = createServerClient();
    await deleteNeed(db, session.shelterId, id);
    revalidatePath('/dashboard');
  }
}
```

### Success Criteria

#### Automated Verification

- `npx tsc --project tsconfig.app.json --noEmit` passes
- `npm run lint` passes

---

## Phase 2: NeedsPanel Component and Dashboard Integration

### Overview

Create `src/app/dashboard/needs-panel.tsx` (Client Component) with the list, inline add form, inline edit form, and delete buttons. Update `src/app/dashboard/page.tsx` to fetch needs from DB and render `NeedsPanel`.

### Changes Required

#### 1. Create src/app/dashboard/needs-panel.tsx

**File**: `src/app/dashboard/needs-panel.tsx` (new)

```tsx
'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  addNeedAction,
  updateNeedAction,
  deleteNeedAction,
} from '@/app/actions/needs';
import type { Need } from '@/db/queries/needs';
import type { Urgency } from '@/db/types';

const URGENCY_LABEL: Record<Urgency, string> = {
  pilne: 'Pilne',
  potrzebne: 'Potrzebne',
  mile_widziane: 'Mile widziane',
};

const URGENCY_COLOR: Record<Urgency, string> = {
  pilne: 'bg-red-100 text-red-800',
  potrzebne: 'bg-yellow-100 text-yellow-800',
  mile_widziane: 'bg-green-100 text-green-800',
};

function UrgencySelect({ defaultValue }: { defaultValue?: Urgency }) {
  return (
    <select
      name='urgency'
      required
      defaultValue={defaultValue ?? ''}
      className='input'
    >
      <option value='' disabled>
        Pilność
      </option>
      <option value='pilne'>Pilne</option>
      <option value='potrzebne'>Potrzebne</option>
      <option value='mile_widziane'>Mile widziane</option>
    </select>
  );
}

function AddNeedForm() {
  const [state, formAction, pending] = useActionState(addNeedAction, {});
  return (
    <form
      action={formAction}
      className='space-y-3 border border-gray-200 rounded-md p-4'
    >
      <h2 className='text-sm font-medium text-gray-700'>Dodaj potrzebę</h2>
      {state.error && (
        <p role='alert' className='text-red-600 text-sm'>
          {state.error}
        </p>
      )}
      <div className='grid grid-cols-2 gap-3'>
        <input
          name='name'
          placeholder='Nazwa (np. karma sucha)'
          required
          className='input col-span-2'
        />
        <UrgencySelect />
        <input
          name='quantity'
          type='number'
          min='1'
          placeholder='Ilość'
          required
          className='input'
        />
      </div>
      <input
        name='allegro_link'
        type='url'
        placeholder='Link do Allegro (opcjonalnie)'
        className='input'
      />
      <button type='submit' disabled={pending} className='btn-primary'>
        {pending ? 'Dodawanie…' : 'Dodaj'}
      </button>
    </form>
  );
}

function EditNeedForm({
  need,
  onCancel,
}: {
  need: Need;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateNeedAction, {});

  useEffect(() => {
    if (state.success) onCancel();
  }, [state.success, onCancel]);

  return (
    <form
      action={formAction}
      className='space-y-3 border border-blue-200 rounded-md p-4 bg-blue-50'
    >
      <h2 className='text-sm font-medium text-gray-700'>Edytuj potrzebę</h2>
      {state.error && (
        <p role='alert' className='text-red-600 text-sm'>
          {state.error}
        </p>
      )}
      <input type='hidden' name='id' value={need.id} />
      <div className='grid grid-cols-2 gap-3'>
        <input
          name='name'
          defaultValue={need.name}
          required
          className='input col-span-2'
        />
        <UrgencySelect defaultValue={need.urgency} />
        <input
          name='quantity'
          type='number'
          min='1'
          defaultValue={need.quantity}
          required
          className='input'
        />
      </div>
      <input
        name='allegro_link'
        type='url'
        defaultValue={need.allegro_link ?? ''}
        placeholder='Link do Allegro (opcjonalnie)'
        className='input'
      />
      <div className='flex gap-2'>
        <button type='submit' disabled={pending} className='btn-primary'>
          {pending ? 'Zapisywanie…' : 'Zapisz'}
        </button>
        <button type='button' onClick={onCancel} className='btn-secondary'>
          Anuluj
        </button>
      </div>
    </form>
  );
}

export function NeedsPanel({ needs }: { needs: Need[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <section className='space-y-4'>
      <h2 className='text-lg font-semibold'>Potrzeby schroniska</h2>

      {needs.length === 0 && (
        <p className='text-gray-500 text-sm'>
          Brak potrzeb. Dodaj pierwszą poniżej.
        </p>
      )}

      <ul className='space-y-2'>
        {needs.map((need) =>
          editingId === need.id ? (
            <li key={need.id}>
              <EditNeedForm need={need} onCancel={() => setEditingId(null)} />
            </li>
          ) : (
            <li
              key={need.id}
              className='flex items-center justify-between gap-4 border border-gray-200 rounded-md px-4 py-3'
            >
              <div className='flex items-center gap-3 min-w-0'>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_COLOR[need.urgency]}`}
                >
                  {URGENCY_LABEL[need.urgency]}
                </span>
                <span className='font-medium truncate'>{need.name}</span>
                <span className='text-sm text-gray-500 shrink-0'>
                  ×{need.quantity}
                </span>
                {need.allegro_link && (
                  <a
                    href={need.allegro_link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-blue-600 underline shrink-0'
                  >
                    Allegro
                  </a>
                )}
              </div>
              <div className='flex gap-2 shrink-0'>
                <button
                  type='button'
                  onClick={() => setEditingId(need.id)}
                  className='btn-secondary text-xs px-2 py-1'
                >
                  Edytuj
                </button>
                <form action={deleteNeedAction}>
                  <input type='hidden' name='id' value={need.id} />
                  <button
                    type='submit'
                    className='btn-secondary text-xs px-2 py-1 text-red-600 hover:text-red-800'
                  >
                    Usuń
                  </button>
                </form>
              </div>
            </li>
          ),
        )}
      </ul>

      <AddNeedForm />
    </section>
  );
}
```

#### 2. Update src/app/dashboard/page.tsx

**File**: `src/app/dashboard/page.tsx` (modify — add needs fetch + NeedsPanel)

```tsx
import { getSession } from '@/lib/auth/session';
import { createServerClient } from '@/db/client';
import { getShelterById } from '@/db/queries/shelters';
import { getNeedsByShelter } from '@/db/queries/needs';
import { logoutAction } from '@/app/actions/auth';
import { NeedsPanel } from './needs-panel';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = createServerClient();
  const [shelter, needs] = await Promise.all([
    getShelterById(db, session.shelterId),
    getNeedsByShelter(db, session.shelterId),
  ]);

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
      <NeedsPanel needs={needs} />
    </main>
  );
}
```

### Success Criteria

#### Automated Verification

- `npx tsc --project tsconfig.app.json --noEmit` passes
- `npm run lint` passes

#### Manual Verification

- `/dashboard` shows the needs list (empty state: "Brak potrzeb. Dodaj pierwszą poniżej.")
- Add form: fill name + urgency + quantity → submit → need appears in list sorted by urgency
- Edit: click "Edytuj" → inline form appears pre-filled → save → item updates
- Delete: click "Usuń" → item disappears from list
- Validation: submit add form with empty name → error message appears
- Urgency badges show correct color (red=pilne, yellow=potrzebne, green=mile_widziane)
- Allegro link (when provided) appears as clickable link

---

## References

- Roadmap S-02: `context/foundation/roadmap.md`
- PRD: `context/foundation/prd.md` — FR-004, FR-005, FR-006
- F-01 plan: `context/changes/data-layer-foundation/plan.md`
- S-01 plan: `context/changes/shelter-registration-and-login/plan.md`

---

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Server Actions

#### Automated

- [x] 1.1 `npx tsc --project tsconfig.app.json --noEmit` passes — 67559be
- [x] 1.2 `npm run lint` passes — 67559be

### Phase 2: NeedsPanel Component and Dashboard Integration

#### Automated

- [x] 2.1 `npx tsc --project tsconfig.app.json --noEmit` passes — 67559be
- [x] 2.2 `npm run lint` passes — 67559be

#### Manual

- [x] 2.3 `/dashboard` shows empty state when no needs — 67559be
- [x] 2.4 Add need → appears in list sorted by urgency — 67559be
- [x] 2.5 Edit need inline → item updates — 67559be
- [x] 2.6 Delete need → item disappears — 67559be
- [x] 2.7 Add form validation: empty name → error message — 67559be
- [x] 2.8 Urgency badges show correct colors — 67559be
- [x] 2.9 Allegro link appears as clickable link when provided — 67559be
