import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { binaryExists, runCli, cleanupTempDirs } from "./support/cli";
import { hasAuthSecrets } from "./support/env";
import { ensureSharedAuth, AuthRateLimitedError } from "./support/auth-setup";

describe("e2e: get", () => {
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
    "get m0l1 --dry-run --json returns write results",
    () => {
      if (!hasAuthSecrets() || authSkipped) {
        console.log("Skipping: E2E auth not available");
        return;
      }

      const result = runCli(["get", "m0l1", "--dry-run", "--json"], {
        env: { XDG_CONFIG_HOME: configDir, APPDATA: configDir },
      });

      expect(result.exitCode).toBe(0);

      const json = result.json<{
        status: string;
        data: {
          lessonId: string;
          dry_run: boolean;
          writes: {
            skills: unknown[];
            prompts: unknown[];
            rules: unknown[];
            configs: unknown[];
          };
        };
      }>();

      expect(json.status).toBe("ok");
      expect(json.data.dry_run).toBe(true);
      expect(json.data.lessonId).toBe("m0l1");
    },
    { timeout: 30_000 },
  );

  it(
    "get m0l99 --json exits with NOT_FOUND",
    () => {
      if (!hasAuthSecrets() || authSkipped) {
        console.log("Skipping: E2E auth not available");
        return;
      }

      const result = runCli(["get", "m0l99", "--json"], {
        env: { XDG_CONFIG_HOME: configDir, APPDATA: configDir },
      });

      expect(result.exitCode).toBe(5);

      const json = result.json<{
        status: string;
        error: { code: string };
      }>();

      expect(json.status).toBe("error");
      expect(json.error.code).toBe("lesson_not_found");
    },
    { timeout: 30_000 },
  );

  it(
    "get m0l1 --dry-run --type skills --json filters to skills only",
    () => {
      if (!hasAuthSecrets() || authSkipped) {
        console.log("Skipping: E2E auth not available");
        return;
      }

      const result = runCli(
        ["get", "m0l1", "--dry-run", "--type", "skills", "--json"],
        { env: { XDG_CONFIG_HOME: configDir, APPDATA: configDir } },
      );

      expect(result.exitCode).toBe(0);

      const json = result.json<{
        status: string;
        data: {
          dry_run: boolean;
          writes: {
            skills: unknown[];
            prompts: unknown[];
            rules: unknown[];
            configs: unknown[];
          };
        };
      }>();

      expect(json.status).toBe("ok");
      expect(json.data.dry_run).toBe(true);
      expect(json.data.writes.prompts.length).toBe(0);
      expect(json.data.writes.configs.length).toBe(0);
    },
    { timeout: 30_000 },
  );
});
