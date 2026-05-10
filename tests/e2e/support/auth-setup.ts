import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { spawnCli } from "./cli";
import { getE2EEnv } from "./env";
import { ResendMagicLinks } from "./resend-magic-links";

export async function authenticateTestUser(configDir: string): Promise<void> {
  const env = getE2EEnv();
  const resend = new ResendMagicLinks(env.resendApiKey);
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

  await fetch(callbackUrl);

  const cliResult = await result;

  if (cliResult.exitCode !== 0) {
    throw new Error(
      `Auth CLI exited ${cliResult.exitCode}. stderr: ${cliResult.stderr}`,
    );
  }

  const authPath = join(configDir, "10x-cli", "auth.json");
  if (!existsSync(authPath)) {
    throw new Error(`auth.json not written at ${authPath}`);
  }

  const auth = JSON.parse(readFileSync(authPath, "utf8"));
  if (!auth.access_token || !auth.refresh_token) {
    throw new Error("auth.json missing tokens");
  }
}
