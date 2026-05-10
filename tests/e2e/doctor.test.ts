import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { binaryExists, runCli, cleanupTempDirs } from "./support/cli";
import { hasAuthSecrets, getE2EEnv } from "./support/env";
import { ensureSharedAuth, AuthRateLimitedError } from "./support/auth-setup";

describe("e2e: doctor", () => {
  let configDir: string;
  let authSkipped = false;

  beforeAll(async () => {
    if (!binaryExists()) {
      throw new Error(
        "Binary not found. Run `bun run build:binary` before e2e tests.",
      );
    }
    if (!hasAuthSecrets()) return;

    try {
      configDir = await ensureSharedAuth();
    } catch (err) {
      if (err instanceof AuthRateLimitedError) {
        authSkipped = true;
        return;
      }
      throw err;
    }
  }, 60_000);

  afterAll(() => cleanupTempDirs());

  it(
    "doctor --json reports checks with valid auth",
    () => {
      if (!hasAuthSecrets() || authSkipped) {
        console.log("Skipping: E2E auth not available");
        return;
      }

      const result = runCli(["doctor", "--json"], {
        env: { XDG_CONFIG_HOME: configDir, APPDATA: configDir },
      });

      const json = result.json<{
        status: string;
        data: {
          overall: string;
          passed: number;
          failed: number;
          warned: number;
          checks: Array<{
            name: string;
            status: string;
            message: string;
            details: Record<string, unknown>;
          }>;
        };
      }>();

      expect(json.status).toBe("ok");
      expect(json.data.checks.length).toBe(5);

      const authCheck = json.data.checks.find((c) => c.name === "auth");
      expect(authCheck).toBeDefined();
      expect(authCheck!.status).toBe("pass");
      expect(authCheck!.message).toContain(getE2EEnv().testEmail);

      const apiCheck = json.data.checks.find((c) => c.name === "api");
      expect(apiCheck).toBeDefined();
      expect(apiCheck!.status).toBe("pass");
      expect(apiCheck!.details["latencyMs"]).toBeDefined();
    },
    { timeout: 60_000 },
  );
});
