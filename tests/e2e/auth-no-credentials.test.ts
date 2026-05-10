import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { binaryExists, runCli, cleanupTempDirs } from "./support/cli";

describe("e2e: auth without credentials", () => {
  beforeAll(() => {
    if (!binaryExists()) {
      throw new Error(
        "Binary not found. Run `bun run build:binary` before e2e tests.",
      );
    }
  });

  afterAll(() => cleanupTempDirs());

  it("auth --status --json exits 3 (AUTH_REQUIRED) with error envelope", () => {
    const result = runCli(["auth", "--status", "--json"]);
    expect(result.exitCode).toBe(3);
    const json = result.json<{
      status: string;
      error: { code: string };
    }>();
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("auth_required");
  });

  it("auth --logout --json exits 0 with logout envelope", () => {
    const result = runCli(["auth", "--logout", "--json"]);
    expect(result.exitCode).toBe(0);
    const json = result.json<{
      status: string;
      data: { logged_out: boolean; had_credentials: boolean };
    }>();
    expect(json.status).toBe("ok");
    expect(json.data.logged_out).toBe(true);
    expect(json.data.had_credentials).toBe(false);
  });
});
