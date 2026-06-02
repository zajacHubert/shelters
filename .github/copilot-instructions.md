---

## M3L3 Implementation: Per-Edit Hooks (This Project)

Two per-edit hooks have been configured in `.github/hooks/`:

### 1. **Lint Hook** (`lint-hook.json`)

- **Trigger**: Agent edits any `.ts`, `.tsx`, `.js`, `.jsx` file
- **Action**: Runs `npm run lint --fix` to auto-correct ESLint violations
- **Exit**: 0 (success), or 2 (error blocks with feedback to agent)
- **Latency**: ~100ms per file

### 2. **Typecheck Hook** (`typecheck-hook.json`)

- **Trigger**: Agent edits any `.ts`, `.tsx` file
- **Action**: Runs `npx tsc --noEmit` on the single file
- **Exit**: 0 (success), or 2 (error blocks with feedback to agent)
- **Latency**: ~200ms per file on warm cache

### How to Test

After agent edits a file, check the hook output in Copilot's hook logs (VS Code command palette → "GitHub Copilot: Show Logs"). Both hooks should complete within 1-2s.

### Next Steps

- **Pre-commit hooks**: Configure `lefthook.yml` for staged file checks (linter + full typecheck on commit)
- **Pre-push hooks**: Broader test suite before pushing to remote
- **Risk areas**: Define scoped tests in `context/foundation/test-plan.md`

<!-- BEGIN @przeprogramowani/10x-cli -->

## 10xDevs AI Toolkit - Module 3, Lesson 4 (E2E Tests)

**For E2E tests, use the `/10x-e2e` skill.** It is the single source of truth
for the workflow — risk → seed test + rules → generate → review against the five
anti-patterns → re-prompt → verify. The skill's `references/` carry the full
rules, anti-patterns, seed pattern, and prompt-template.

A few hard rules that hold even before you invoke the skill:

- **Locators:** `getByRole` / `getByLabel` / `getByText` first; `getByTestId`
  only when accessibility attributes are ambiguous. Never CSS selectors, XPath,
  or DOM structure.
- **Never `page.waitForTimeout()`.** Wait for state: `toBeVisible()`,
  `waitForURL()`, `waitForResponse()`.
- **Test independence + cleanup.** Each test runs standalone — its own setup,
  action, assertion, and cleanup; unique ids (timestamp suffix) so parallel runs
  and re-runs don't collide.

Two boundaries to keep straight:

- **DOM (snapshot) is the default.** Vision (`--caps=vision`) is a supplement for
  visual-only risks (layout, z-index, animation); for pixel regression prefer
  deterministic tools (`toMatchSnapshot`, Argos, Lost Pixel). VLM model
  selection/cost is a debugging topic (Lesson 5), not testing.
- **Healer helps on selectors, harms on logic.** A changed selector → healer
  re-finds it (route through PR review). A changed business behavior → healer
  masks the bug; that failing-test-to-fix case is Lesson 5.

<!-- END @przeprogramowani/10x-cli -->
