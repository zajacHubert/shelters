import { join } from "node:path";
import { existsSync, readFileSync, mkdtempSync, cpSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnCli } from "./cli";
import { getE2EEnv } from "./env";
import { ResendMagicLinks } from "./resend-magic-links";

export async function authenticateTestUser(configDir: string): Promise<void> {
  const authPath = join(configDir, "10x-cli", "auth.json");
  if (existsSync(authPath)) {
    const auth = JSON.parse(readFileSync(authPath, "utf8"));
    if (auth.access_token && auth.refresh_token) return;
  }

  const env = getE2EEnv();
  const resend = new ResendMagicLinks(env.resendApiKey);
  const sentAfter = new Date();

  const { result } = spawnCli(
    ["auth", "--email", env.testEmail, "--json"],
    { env: { XDG_CONFIG_HOME: configDir, APPDATA: configDir } },
  );

  const earlyExit = result.then((r) => {
    if (r.exitCode !== 0) {
      throw new Error(
        `Auth CLI exited with code ${r.exitCode}. stdout: ${r.stdout} stderr: ${r.stderr}`,
      );
    }
  });

  const callbackUrl = await Promise.race([
    resend.findCallbackUrl({
      recipientEmail: env.inboxEmail,
      sentAfter,
      timeoutMs: 45_000,
      pollIntervalMs: 1_000,
    }),
    earlyExit.then(() => {
      throw new Error("CLI exited before email was found");
    }),
  ]);

  const callbackResp = await fetch(callbackUrl);
  if (!callbackResp.ok) {
    throw new Error(`Callback request failed: ${callbackResp.status}`);
  }

  const cliResult = await result;

  if (cliResult.exitCode !== 0) {
    throw new Error(
      `Auth CLI exited ${cliResult.exitCode}. stderr: ${cliResult.stderr}`,
    );
  }

  if (!existsSync(authPath)) {
    throw new Error(`auth.json not written at ${authPath}`);
  }

  const auth = JSON.parse(readFileSync(authPath, "utf8"));
  if (!auth.access_token || !auth.refresh_token) {
    throw new Error("auth.json missing tokens");
  }
}

let sharedConfigDir: string | null = null;
let sharedAuthPromise: Promise<void> | null = null;

export function getSharedConfigDir(): string {
  if (!sharedConfigDir) {
    sharedConfigDir = mkdtempSync(join(tmpdir(), "10x-e2e-shared-"));
  }
  return sharedConfigDir;
}

export async function ensureSharedAuth(): Promise<string> {
  const configDir = getSharedConfigDir();

  const seedDir = process.env["E2E_CONFIG_DIR"];
  if (seedDir) {
    const seedAuth = join(seedDir, "10x-cli", "auth.json");
    const destAuth = join(configDir, "10x-cli", "auth.json");
    if (existsSync(seedAuth) && !existsSync(destAuth)) {
      mkdirSync(join(configDir, "10x-cli"), { recursive: true });
      cpSync(seedAuth, destAuth);
    }
  }

  if (!sharedAuthPromise) {
    sharedAuthPromise = authenticateTestUser(configDir).catch((err) => {
      sharedAuthPromise = null;
      throw err;
    });
  }
  await sharedAuthPromise;
  return configDir;
}
