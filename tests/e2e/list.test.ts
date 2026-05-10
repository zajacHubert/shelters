import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { binaryExists, runCli, cleanupTempDirs } from "./support/cli";
import { hasAuthSecrets } from "./support/env";
import { ensureSharedAuth } from "./support/auth-setup";

describe("e2e: list", () => {
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

  afterAll(() => cleanupTempDirs());

  it(
    "list --json returns modules array",
    () => {
      if (!hasAuthSecrets()) {
        console.log("Skipping: E2E auth secrets not available");
        return;
      }

      const result = runCli(["list", "--json"], {
        env: { XDG_CONFIG_HOME: configDir, APPDATA: configDir },
      });

      expect(result.exitCode).toBe(0);

      const json = result.json<{
        status: string;
        data: {
          course: string;
          modules: Array<{
            module: number;
            title: string;
            state: string;
            lessonCount: number;
          }>;
        };
      }>();

      expect(json.status).toBe("ok");
      expect(json.data.modules.length).toBeGreaterThan(0);
      expect(json.data.modules[0]!.module).toBe(1);
      expect(json.data.modules[0]!.title).toBeTruthy();
    },
    { timeout: 30_000 },
  );

  it(
    "list 1 --json returns lessons for module 1",
    () => {
      if (!hasAuthSecrets()) {
        console.log("Skipping: E2E auth secrets not available");
        return;
      }

      const result = runCli(["list", "1", "--json"], {
        env: { XDG_CONFIG_HOME: configDir, APPDATA: configDir },
      });

      expect(result.exitCode).toBe(0);

      const json = result.json<{
        status: string;
        data: {
          module: number;
          title: string;
          lessons: Array<{ lessonId: string; title: string }>;
        };
      }>();

      expect(json.status).toBe("ok");
      expect(json.data.module).toBe(1);
      expect(json.data.lessons.length).toBeGreaterThan(0);
    },
    { timeout: 30_000 },
  );

  it(
    "list 99 --json exits with USAGE (out of range)",
    () => {
      if (!hasAuthSecrets()) {
        console.log("Skipping: E2E auth secrets not available");
        return;
      }

      const result = runCli(["list", "99", "--json"], {
        env: { XDG_CONFIG_HOME: configDir, APPDATA: configDir },
      });

      expect(result.exitCode).toBe(2);

      const json = result.json<{
        status: string;
        error: { code: string };
      }>();

      expect(json.status).toBe("error");
      expect(json.error.code).toBe("invalid_module");
    },
    { timeout: 30_000 },
  );
});
