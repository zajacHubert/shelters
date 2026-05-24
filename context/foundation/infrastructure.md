---
project: ShelterNeeds
researched_at: 2026-05-21
recommended_platform: Cloudflare Workers
runner_up: Render
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Next.js (App Router)
  runtime: Node.js / Cloudflare Workers edge runtime (via @opennextjs/cloudflare)
---

## Recommendation

**Deploy on Cloudflare Workers.**

Cloudflare Workers scored 5/5 on all agent-friendly criteria — the only platform in the pool to do so. It is the cheapest option at free/$5/month, ships full SSR Next.js support via the `@opennextjs/cloudflare` OpenNext adapter, has a mature `wrangler` CLI for fully unattended deploys, publishes docs in GitHub-readable markdown with `llms.txt`, and provides official MCP servers for structured agent access. The cost-sensitive constraint (Q2) and the existing `cloudflare-pages` deployment target in `tech-stack.md` both point here — though the target must be corrected to Workers (see risk register). WebSocket support is available via Durable Objects; this adds complexity but is viable for MVP scope.

## Platform Comparison

| Platform               | CLI-first | Managed/Serverless | Agent-readable docs | Stable deploy API | MCP/Integration | Pass count                                             |
| ---------------------- | --------- | ------------------ | ------------------- | ----------------- | --------------- | ------------------------------------------------------ |
| **Cloudflare Workers** | ✅ Pass   | ✅ Pass            | ✅ Pass             | ✅ Pass           | ✅ Pass         | **5 / 5**                                              |
| Render                 | ✅ Pass   | ✅ Pass            | ⚪ Partial          | ✅ Pass           | ✅ Pass         | 4 Pass, 1 Partial                                      |
| Fly.io                 | ✅ Pass   | ✅ Pass            | ✅ Pass             | ✅ Pass           | ⚪ Partial      | 4 Pass, 1 Partial                                      |
| Railway                | ✅ Pass   | ✅ Pass            | ⚪ Partial          | ✅ Pass           | ⚪ Partial      | 3 Pass, 2 Partial                                      |
| **Vercel**             | —         | —                  | —                   | —                 | —               | **DROPPED** — serverless-only, no persistent processes |
| **Netlify**            | —         | —                  | —                   | —                 | —               | **DROPPED** — serverless-only, no persistent processes |

**Hard filter applied:** Persistent connections required (Q1 = Yes). Vercel and Netlify dropped.

**Soft weights applied:** Cost-sensitive (Q2) → up-weighted free/cheap platforms. Single-region deployment (Q4) → no edge-native preference added. External data providers fine (Q5) → no co-location premium.

### Shortlisted Platforms

#### 1. Cloudflare Workers (Recommended)

Full-stack SSR Next.js runs via the OpenNext adapter (`@opennextjs/cloudflare`), deployed with `wrangler`. All five agent-friendly criteria pass: `wrangler` CLI covers deploy, secret management, live log tailing, and rollback; Workers is fully managed with no OS or TLS overhead; docs are published on GitHub as MDX with a `llms.txt` at `developers.cloudflare.com`; `npm run deploy` is deterministic with structured output and `wrangler rollback` for reversals; official MCP servers exist across Workers, D1, R2, and observability. Free tier (100k requests/day) is sufficient for early MVP; paid plan at $5/month is the cheapest always-on option in the pool. WebSocket connections are supported via Durable Objects.

#### 2. Render

Render scores 4 Pass / 1 Partial. Its MCP server (`render.com/docs/mcp-server`) is official and production-ready, which is a genuine differentiator over Fly.io and Railway. Persistent web services run Node.js natively — WebSockets work without any additional primitives (unlike Durable Objects on Workers). Free tier available but web services spin down after 15 minutes of inactivity (cold starts ~30s); Starter at $7/month avoids this. The partial on agent-readable docs reflects that Render's docs are not GitHub-hosted MDX, making them harder for an agent to read directly. Overall a strong runner-up, especially if WebSocket complexity on Workers becomes a blocker.

#### 3. Fly.io

Fly.io scores 4 Pass / 1 Partial. `fly launch` auto-detects Next.js and generates a Dockerfile, making initial setup fast. `flyctl` CLI is comprehensive: `fly deploy`, `fly logs`, `fly status`, `fly ssh console`. Docs are hosted on GitHub as MDX, earning a full Pass on agent-readable docs. Persistent processes and native WebSockets are its strongest advantage over Workers. The partial is on MCP/integration — no confirmed official MCP server as of May 2026. Cost is pay-as-you-go (shared-cpu-1x ~$1.94/month), but there is no real free tier (only a 30-day trial). Requires writing and maintaining a Dockerfile, which adds modest ops overhead for a solo after-hours developer compared to Workers or Render.

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. **WebSocket via Durable Objects is not "just add websockets"** — Persistent connections require Durable Objects: a stateful primitive with its own API, billing model, and programming paradigm. On Render or Fly.io, adding WebSockets is `npm i socket.io`. On Workers it requires architecting DOs, a non-trivial investment for a solo after-hours developer.

2. **`cloudflare-pages` deployment target in tech-stack.md is wrong for SSR** — Cloudflare's docs now redirect full-stack SSR Next.js explicitly to Workers, not Pages. Any CI/CD pipeline targeting Cloudflare Pages will fail to serve SSR routes correctly. The existing stack artifact must be updated before wiring GitHub Actions.

3. **Two dev commands with diverging runtimes** — `npm run dev` runs the Next.js dev server (Node.js); `npm run preview` runs the Cloudflare Workers simulation. They can behave differently. Bugs in `preview`-only behaviour (e.g., `next/headers`, session middleware, certain Node.js built-ins) cost disproportionate time to diagnose for a solo developer.

4. **OpenNext adapter is community-maintained, not a Cloudflare product** — `@opennextjs/cloudflare` is the OpenNext project with Cloudflare involvement. It is not part of Cloudflare's product SLA. Compatibility gaps between Next.js major versions and the adapter have occurred before and will occur again.

5. **Workers environment variable injection differs from Node.js** — Variables must be declared in `wrangler.jsonc` bindings or set via `wrangler secret put`. `NEXT_PUBLIC_*` variables require build-time injection described only in OpenNext docs. Auth.js / NextAuth sessions have documented footguns with this model.

### Pre-Mortem — How This Could Fail

Six months after deploying ShelterNeeds on Cloudflare Workers, the project stalled. The initial deployment worked — `npm run deploy` succeeded, Supabase Auth connected, the shelter list page loaded fast. Problems emerged when coordinators asked for live updates on the dashboard. The PRD said `has_realtime: false`, but real usage showed coordinators needed instant feedback when donors marked needs as fulfilled. Adding WebSockets required Durable Objects — an entirely different programming model. Three evenings were spent understanding DOs before a single socket message was sent. Separately, the GitHub Actions pipeline had been wired to Cloudflare Pages (following the `deployment_target: cloudflare-pages` hint from `tech-stack.md`); SSR routes served stale static builds until the Workers target mismatch was diagnosed. A NextAuth session cookie configured via `next/headers` worked in local dev but failed silently in the Workers preview environment — a two-evening bug hunt discovered it was a Node.js middleware incompatibility flagged in the Cloudflare docs but missed during setup. Each issue was solvable, but the sum of Workers-specific friction — DO model, Pages/Workers confusion, two-command dev workflow, env var injection — consumed the project's limited after-hours time budget before any new shelter features shipped.

### Unknown Unknowns

- **`cloudflare-pages` in tech-stack.md is the wrong deployment target for SSR**: Cloudflare Pages now only supports static Next.js. Cloudflare's own guide redirects SSR apps to Workers. Setting up CI for Pages will break SSR routes silently.
- **Node.js in Next.js Middleware is not supported**: As of April 2026 Cloudflare docs, "Node.js middleware introduced in Next.js 15.2 are not yet supported" on Workers. Any middleware using Node.js APIs will fail.
- **Workers pricing counts every SSR render as a billable request**: The free tier (100k requests/day) can be consumed faster than expected on an SSR app with several API routes per page. Monitor this during early traffic growth.
- **Two dev commands introduce a runtime fidelity gap**: `npm run dev` (Node.js) vs `npm run preview` (Workers runtime) can diverge on `next/headers`, session libs, and some Node.js built-ins. Testing in `preview` before pushing to CI is mandatory, not optional.
- **WebSocket complexity vs alternatives**: If the "persistent connections" requirement materialises as WebSockets, Durable Objects are required. On Render or Fly.io this is a 20-line Node.js addition. On Workers it is a new architectural component.

## Operational Story

- **Preview deploys**: Workers Builds creates a `*.workers.dev` URL for every push to a branch. These preview URLs are public by default — use Cloudflare Access (free for up to 50 users) to gate them if the shelter data should not be publicly browsable before launch.
- **Secrets**: `wrangler secret put SECRET_NAME` writes a secret to the Workers runtime; `wrangler secret list` shows names (not values). For GitHub Actions: store `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets and pass via the `actions/wrangler` workflow step. Secrets are never in `.env` files committed to the repo.
- **Rollback**: `npx wrangler rollback` reverts to the previous Workers deployment in approximately 10 seconds. Database migrations (Supabase) do NOT roll back automatically — migration reversals must be handled manually before rolling back the Worker.
- **Approval**: Agent may perform unattended: `npm run deploy`, `wrangler tail` (log tailing), `wrangler secret put` (add/update secrets), `wrangler deployments list` (deployment history). Human-only: delete a Worker, rotate the Cloudflare API token, change billing plan, modify DNS records, drop a Supabase database.
- **Logs**: `npx wrangler tail` streams live request and console logs in JSON or pretty format. Workers Logs in the Cloudflare dashboard provide 7-day retention on the Paid plan (3-day on Free). Structured JSON output: `npx wrangler tail --format=json | jq .` for agent-parseable output.

## Risk Register

| Risk                                                                                                      | Source           | Likelihood | Impact | Mitigation                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------- | ---------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cloudflare-pages` deployment target set in tech-stack.md causes CI/CD to target Pages instead of Workers | Unknown unknowns | H          | H      | Before wiring CI, update `deployment_target` to `cloudflare-workers` and confirm `wrangler.jsonc` is used (not Pages config). Run `npx wrangler deploy` once manually to verify. |
| WebSocket / persistent connection implementation requires Durable Objects — high complexity for solo dev  | Devil's advocate | M          | M      | Defer WebSocket features to post-MVP. Use polling or Supabase Realtime instead of native DOs for any live-update needs at MVP stage.                                             |
| OpenNext adapter compatibility breaks on Next.js major version bump                                       | Devil's advocate | M          | H      | Pin both `next` and `@opennextjs/cloudflare` versions in `package.json`. Before upgrading Next.js, check the OpenNext Cloudflare release notes at `opennext.js.org/cloudflare`.  |
| `npm run dev` vs `npm run preview` runtime divergence causes prod-only bugs                               | Pre-mortem       | M          | M      | Run `npm run preview` as a CI step before merge. Treat `preview` as the truth environment for Workers-specific APIs; treat `dev` as DX convenience only.                         |
| Node.js APIs in Next.js Middleware not supported on Workers runtime                                       | Unknown unknowns | L          | H      | Audit all middleware files for Node.js API usage before deployment. If Node.js middleware is required, migrate to Render (runner-up).                                            |
| Auth.js / NextAuth session cookies behave differently in Workers env var model                            | Pre-mortem       | M          | M      | Follow OpenNext env var guide exactly. Test auth flow end-to-end in `npm run preview` before first production deploy.                                                            |
| Free tier (100k req/day) exceeded by SSR traffic sooner than expected                                     | Research finding | L          | L      | Upgrade to Workers Paid ($5/month) before public launch. Set a Workers CPU limit in `wrangler.jsonc` to prevent runaway billing.                                                 |

## Getting Started

1. **Install the Workers toolchain** in the project root (the existing project was bootstrapped for Cloudflare Pages; Workers needs its own adapter):

   ```bash
   npm install -D @opennextjs/cloudflare wrangler@latest
   ```

2. **Create `open-next.config.ts`** in the project root:

   ```ts
   import { defineCloudflareConfig } from '@opennextjs/cloudflare';
   export default defineCloudflareConfig();
   ```

3. **Create `wrangler.jsonc`** in the project root (replace `shelter-needs` with your actual Worker name):

   ```jsonc
   {
     "$schema": "./node_modules/wrangler/config-schema.json",
     "main": ".open-next/worker.js",
     "name": "shelter-needs",
     "compatibility_date": "2026-05-21",
     "compatibility_flags": ["nodejs_compat"],
     "assets": {
       "directory": ".open-next/assets",
       "binding": "ASSETS",
     },
     "observability": { "enabled": true },
   }
   ```

4. **Update `package.json` scripts** (keep existing `dev` and `build`; add `preview` and `deploy`):

   ```json
   "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
   "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
   ```

5. **Authenticate and deploy**:
   ```bash
   npx wrangler login        # opens browser — authenticate once
   npm run preview           # verify SSR works in Workers runtime locally
   npm run deploy            # deploy to *.workers.dev
   ```

## Out of Scope

The following were not evaluated in this research:

- Docker image configuration
- CI/CD pipeline setup (GitHub Actions wiring)
- Production-scale architecture (multi-region, HA, DR)
- Database selection or migration tooling
