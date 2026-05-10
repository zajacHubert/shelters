import { describe, it, expect, beforeAll } from "bun:test";
import { mkdtempSync } from "node:fs";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { binaryExists, spawnCli } from "./support/cli";
import { hasAuthSecrets, getE2EEnv } from "./support/env";
import { ResendMagicLinks } from "./support/resend-magic-links";

describe("e2e: auth flow", () => {
  beforeAll(() => {
    if (!binaryExists()) {
      throw new Error(
        "Binary not found. Run `bun run build:binary` before e2e tests.",
      );
    }
  });

  it(
    "completes full magic-link login flow",
    async () => {
      if (!hasAuthSecrets()) {
        console.log("Skipping: E2E auth secrets not available");
        return;
      }

      const env = getE2EEnv();
      const resend = new ResendMagicLinks(env.resendApiKey);
      const configDir = mkdtempSync(join(tmpdir(), "10x-e2e-auth-"));
      const sentAfter = new Date();

      const { result } = spawnCli(
        ["auth", "--email", env.testEmail, "--json"],
        { env: { XDG_CONFIG_HOME: configDir, APPDATA: configDir } },
      );

      const callbackUrl = await resend.findCallbackUrl({
        recipientEmail: env.inboxEmail,
        sentAfter,
        timeoutMs: 45_000,
        pollIntervalMs: 1_000,
      });

      expect(callbackUrl).toContain("/auth/callback");

      await fetch(callbackUrl);

      const cliResult = await result;

      expect(cliResult.exitCode).toBe(0);

      const json = cliResult.json<{
        status: string;
        data: { authenticated: boolean; email: string };
      }>();
      expect(json.status).toBe("ok");
      expect(json.data.authenticated).toBe(true);
      expect(json.data.email).toBe(env.testEmail);

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
