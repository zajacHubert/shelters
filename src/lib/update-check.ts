/**
 * Best-effort check of the latest published @przeprogramowani/10x-cli version
 * on the npm registry. Used by `10x doctor` to nudge users to upgrade.
 *
 * The registry call is intentionally outside src/lib/api-client.ts so the
 * strict API-host allowlist there stays narrow. A lookup failure must never
 * fail the doctor run — callers treat a non-ok result as "skip the warning".
 */

const NPM_REGISTRY_URL =
  "https://registry.npmjs.org/@przeprogramowani/10x-cli/latest";

export type LatestVersionResult =
  | { ok: true; version: string }
  | { ok: false; code: "timeout" | "network_error" | "parse_error" | "http_error"; error: string };

export async function fetchLatestVersion(
  options: { timeoutMs?: number; url?: string } = {},
): Promise<LatestVersionResult> {
  const timeoutMs = options.timeoutMs ?? 2_000;
  const url = options.url ?? NPM_REGISTRY_URL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "10x-cli" },
    });
    if (!res.ok) {
      return {
        ok: false,
        code: "http_error",
        error: `registry returned HTTP ${res.status}`,
      };
    }
    const body = (await res.json()) as { version?: unknown };
    if (typeof body.version !== "string" || body.version.length === 0) {
      return {
        ok: false,
        code: "parse_error",
        error: "registry payload missing 'version' field",
      };
    }
    return { ok: true, version: body.version };
  } catch (err) {
    const aborted = controller.signal.aborted;
    return {
      ok: false,
      code: aborted ? "timeout" : "network_error",
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Compare two semver strings. Returns -1 if a < b, 0 if equal, 1 if a > b.
 * Pre-release suffixes are stripped before comparison: `1.4.0-rc.1` is
 * treated as `1.4.0`. Non-numeric segments collapse to 0 so a malformed
 * version never throws — callers fall back to "no warning" in that case.
 */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const parse = (v: string): [number, number, number] => {
    const core = v.split(/[-+]/)[0] ?? v;
    const parts = core.split(".").map((p) => {
      const n = Number.parseInt(p, 10);
      return Number.isFinite(n) ? n : 0;
    });
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };
  const [a1, a2, a3] = parse(a);
  const [b1, b2, b3] = parse(b);
  if (a1 !== b1) return a1 < b1 ? -1 : 1;
  if (a2 !== b2) return a2 < b2 ? -1 : 1;
  if (a3 !== b3) return a3 < b3 ? -1 : 1;
  return 0;
}

/**
 * The single upgrade command we surface. Matches the documented install path
 * in README.md ("npm install -g @przeprogramowani/10x-cli"). Standalone-binary
 * users (the third documented path) won't upgrade with this, but they should
 * recognise the package name and grab a new release manually.
 */
export function upgradeCommand(): string {
  return "npm install -g @przeprogramowani/10x-cli";
}
