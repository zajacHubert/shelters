# Repository Guidelines

`@przeprogramowani/10x-cli` fetches and applies AI coding lessons, skills, and configs for the 10xDevs course. Stack: TypeScript, Bun runtime (local dev), Node 20+ for the published binary.

## Hard rules

- Never hand-edit `src/generated/api-types.ts` — run `npm run generate-types` to regenerate from `/openapi.json`.
- Never call `process.exit` directly — use `outputError(ctx, code, message, exitCode, hint)` with semantic `ExitCodes` from `@src/lib/output.ts`.
- Stdout is for data; stderr is for humans. Route all output through `output()` / `outputError()`, never raw `console.log` to stdout.
- Index access returns `T | undefined` (`noUncheckedIndexedAccess`) — always handle the undefined branch.
- Stub commands call `exitNotImplemented` — replace the call, don't work around it.
- `API_BASE_URL` allowlist: production host or `http://localhost` / `http://127.0.0.1` only — see `@src/lib/api-client.ts`.

## API contract

API calls return `ApiResult<T>` — always branch on `ok`. Exit codes are semantic: `0` SUCCESS, `1` ERROR, `2` USAGE, `3` AUTH_REQUIRED, `4` FORBIDDEN, `5` NOT_FOUND. Auth stored at `$XDG_CONFIG_HOME/10x-cli/auth.json`. Full I/O contract: `@src/lib/output.ts`.

## Project structure

- `src/index.ts` — CAC command dispatcher; wires all `register*Command` calls.
- `src/commands/` — one file per command, each exports `register<Name>Command(cli)`. Use `@src/commands/doctor.ts` as the reference shape.
- `src/lib/` — `api-client`, `config`, `output`, `auth-flow`, `signing`, and other shared modules.
- `src/generated/` — auto-generated; excluded from oxlint; never hand-edit.
- `tests/` — unit + integration; `tests/e2e/` and `tests/smoke/` are separate tiers requiring a built binary.
- `context/` — lesson-chain metadata; never modified by scaffolding or automation.

To add a command: create `src/commands/<name>.ts`, export `register<Name>Command(cli)`, import and call it in `src/index.ts`.

## Commands

| Purpose                 | Command         |
| ----------------------- | --------------- |
| Start dev server        | `npm run dev`   |
| Build for production    | `npm run build` |
| Start production server | `npm run start` |
| Lint                    | `npm run lint`  |

## TypeScript and style

`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` — see `@tsconfig.json`. Linter: ESLint via `eslint-config-next` (`@eslint.config.mjs`). Run with `npm run lint`.

## Testing

No test framework configured for the Next.js app yet. The `tests/` directory contains the 10x-cli source tests (bun:test); run those with `bun test` directly if needed. To add tests for the Next.js app, install Vitest or Jest with `@testing-library/react`.

## Commits and CI

Conventional Commits: `feat(scope):`, `fix(scope):`, `chore(release):`, `test(scope):`, `ci:`. Scope = command or module name (`get`, `auth`, `api-client`). CI gate: typecheck → lint → test → build → binary → smoke → e2e — see `@.github/workflows/ci.yml`. Runs on every PR and push to `main`/`master`.
