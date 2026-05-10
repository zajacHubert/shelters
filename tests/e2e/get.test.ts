import { describe, it, expect, beforeAll } from "bun:test";
import { binaryExists, runCli } from "./support/cli";
import { hasAuthSecrets } from "./support/env";
import { ensureSharedAuth } from "./support/auth-setup";

describe("e2e: get", () => {
  let configDir: string;

  beforeAll(async () => {
    if (!binaryExists()) {
      throw new Error(
        "Binary not found. Run `bun run build:binary` before e2e tests.",
      );
    }
    if (!hasAuthSecrets()) return;

    configDir = await ensureSharedAuth();
  }, 60_000);

  it(
    "get m1l1 --dry-run --json returns write results",
    () => {
      if (!hasAuthSecrets()) {
        console.log("Skipping: E2E auth secrets not available");
        return;
      }

      const result = runCli(["get", "m1l1", "--dry-run", "--json"], {
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
      expect(json.data.lessonId).toBe("m1l1");
    },
    { timeout: 30_000 },
  );

  it(
    "get m1l99 --json exits with NOT_FOUND",
    () => {
      if (!hasAuthSecrets()) {
        console.log("Skipping: E2E auth secrets not available");
        return;
      }

      const result = runCli(["get", "m1l99", "--json"], {
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
    "get m1l1 --dry-run --type skills --json filters to skills only",
    () => {
      if (!hasAuthSecrets()) {
        console.log("Skipping: E2E auth secrets not available");
        return;
      }

      const result = runCli(
        ["get", "m1l1", "--dry-run", "--type", "skills", "--json"],
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
