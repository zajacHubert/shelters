# Per-Edit Hooks (M3L3)

Per-edit hooks fire when the AI agent edits a TypeScript/JavaScript file, providing instant feedback for trivial corrections (formatting, imports, type errors).

## Hooki

### `lint-hook.json`

- **Trigger**: `PostToolUse` (after Write/Edit tool use)
- **Matcher**: `.ts`, `.tsx`, `.js`, `.jsx` files
- **Handler**: `npm run lint --fix $FILE`
- **Exit Code**: 0 (pass), 2 (blocking error with feedback)
- **Purpose**: Auto-fix ESLint violations on agent edits

### `typecheck-hook.json`

- **Trigger**: `PostToolUse` (after Write/Edit tool use)
- **Matcher**: `.ts`, `.tsx` files only
- **Handler**: `npx tsc --noEmit $FILE`
- **Exit Code**: 0 (pass), 2 (blocking error with feedback)
- **Purpose**: Catch type errors immediately on TypeScript file edits

## How It Works

1. Agent edits a file (e.g., `src/commands/foo.ts`)
2. Hook fires → runs lint/typecheck on that file
3. If passes (exit 0) → agent continues to next edit
4. If fails (exit 2) → error output flows to agent context → agent sees the problem and fixes it in next iteration

## Performance Tuning

- **Lint**: Runs ESLint with `--fix` to auto-correct most issues (fast: ~100ms per file)
- **Typecheck**: Uses `tsc --noEmit` on single file (fast: ~200ms per file on warm cache)
- **Timeout**: Both should complete within 1-2 seconds per file; if slower, move to pre-commit layer

## Logs & Feedback

- Output is capped at 50 lines (`head -50`) to stay within 10KB agent context limit
- Blocking errors (exit 2) = agent sees the message and can self-correct
- Non-blocking (exit 1 or other) = logged but does not interrupt

## Disabling Hooks

To disable hooks temporarily:

- Copilot settings: Settings → Extensions → GitHub Copilot → Disable inline hooks
- Or manually comment out hooks in `.github/hooks/*.json`

## Notes

- These hooks are per-edit only (M3L3 per-edit layer)
- Pre-commit hooks (linters + full typecheck) live in `lefthook.yml` (not yet configured in this phase)
- CI gates are in `.github/workflows/` (not configured here; this is local-only)
