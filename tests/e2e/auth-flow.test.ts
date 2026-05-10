import { describe, it, expect, beforeAll } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { binaryExists } from "./support/cli";
import { hasAuthSecrets, getE2EEnv } from "./support/env";
import { ensureSharedAuth, AuthRateLimitedError } from "./support/auth-setup";

describe("e2e: auth flow", () => {
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

  it(
    "completes full magic-link login flow",
    () => {
      if (!hasAuthSecrets() || authSkipped) {
        console.log("Skipping: E2E auth not available");
        return;
      }

      const env = getE2EEnv();
      const authPath = join(configDir, "10x-cli", "auth.json");

      expect(existsSync(authPath)).toBe(true);

      const authData = JSON.parse(readFileSync(authPath, "utf8"));
      expect(authData.access_token).toBeTruthy();
      expect(authData.refresh_token).toBeTruthy();
      expect(authData.email).toBe(env.testEmail);
    },
    { timeout: 60_000 },
  );
});
