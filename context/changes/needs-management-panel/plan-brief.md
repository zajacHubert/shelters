# Plan Brief — needs-management-panel

## Goal

Coordinator can add, edit, delete needs from the dashboard panel. F-01 DB queries are ready; this slice adds Server Actions + Client Component UI.

## Key Decisions

- `shelterId` always from `getSession()` — never from formData (security isolation)
- `revalidatePath('/dashboard')` triggers RSC refresh after each mutation — no manual router.refresh()
- `NeedsPanel` is a Client Component: receives `needs: Need[]` from Server Component, manages `editingId` state for inline edit
- `deleteNeedAction` is a plain Server Action (no useActionState) — delete button uses `<form action={deleteNeedAction}>`
- `allegro_link` validation: must start with `https://` if provided

## Phase Summary

| Phase | What                                           | Files                                                             |
| ----- | ---------------------------------------------- | ----------------------------------------------------------------- |
| 1     | Server Actions (add, update, delete)           | `src/app/actions/needs.ts`                                        |
| 2     | NeedsPanel Client Component + dashboard update | `src/app/dashboard/needs-panel.tsx`, `src/app/dashboard/page.tsx` |
