/**
 * Unit tests for src/lib/update-check.
 *
 * fetchLatestVersion is exercised via a mock fetch URL (a tiny in-process
 * server) to avoid hitting registry.npmjs.org during CI. compareSemver is
 * pure so it gets table-driven cases.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { compareSemver, fetchLatestVersion } from "../src/lib/update-check";

describe("compareSemver", () => {
  it("returns 0 when versions are equal", () => {
    expect(compareSemver("1.4.0", "1.4.0")).toBe(0);
  });

  it("returns -1 when a is older than b", () => {
    expect(compareSemver("1.4.0", "1.5.0")).toBe(-1);
    expect(compareSemver("1.4.0", "2.0.0")).toBe(-1);
    expect(compareSemver("1.4.0", "1.4.1")).toBe(-1);
  });

  it("returns 1 when a is newer than b", () => {
    expect(compareSemver("1.5.0", "1.4.0")).toBe(1);
    expect(compareSemver("2.0.0", "1.99.99")).toBe(1);
  });

  it("strips pre-release suffixes", () => {
    expect(compareSemver("1.4.0-rc.1", "1.4.0")).toBe(0);
    expect(compareSemver("1.4.0", "1.4.0-rc.1")).toBe(0);
  });

  it("treats malformed segments as 0 instead of throwing", () => {
    expect(compareSemver("abc", "0.0.0")).toBe(0);
    expect(compareSemver("1.x.0", "1.0.0")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// fetchLatestVersion — exercised against a local Bun server so the real
// npm registry is never contacted from tests.
// ---------------------------------------------------------------------------

let server: ReturnType<typeof Bun.serve>;
let baseUrl: string;
let routeHandler: (req: Request) => Response | Promise<Response>;

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch: (req) => routeHandler(req),
  });
  baseUrl = `http://127.0.0.1:${server.port}`;
});

afterAll(() => {
  server.stop(true);
});

describe("fetchLatestVersion", () => {
  it("returns the parsed version on success", async () => {
    routeHandler = () =>
      new Response(JSON.stringify({ version: "2.0.0" }), {
        headers: { "content-type": "application/json" },
      });
    const result = await fetchLatestVersion({ url: `${baseUrl}/latest` });
    expect(result).toEqual({ ok: true, version: "2.0.0" });
  });

  it("returns parse_error when payload lacks a version field", async () => {
    routeHandler = () =>
      new Response(JSON.stringify({ name: "foo" }), {
        headers: { "content-type": "application/json" },
      });
    const result = await fetchLatestVersion({ url: `${baseUrl}/latest` });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("parse_error");
  });

  it("returns http_error when registry responds non-2xx", async () => {
    routeHandler = () => new Response("not found", { status: 404 });
    const result = await fetchLatestVersion({ url: `${baseUrl}/latest` });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("http_error");
  });

  it("returns timeout when the request exceeds the deadline", async () => {
    routeHandler = () =>
      new Promise<Response>((resolve) => {
        setTimeout(() => resolve(new Response("late")), 200);
      });
    const result = await fetchLatestVersion({
      url: `${baseUrl}/latest`,
      timeoutMs: 50,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("timeout");
  });
});
