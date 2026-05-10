import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface E2EEnv {
  resendApiKey: string;
  testEmail: string;
  inboxEmail: string;
}

function loadDotEnv(): void {
  const dotenvPath = resolve(import.meta.dir, "../.env.test");
  if (!existsSync(dotenvPath)) return;

  const content = readFileSync(dotenvPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

export function hasAuthSecrets(): boolean {
  return !!(process.env["E2E_RESEND_API_KEY"] && process.env["E2E_TEST_EMAIL"]);
}

export function getE2EEnv(): E2EEnv {
  const resendApiKey = process.env["E2E_RESEND_API_KEY"];
  const testEmail = process.env["E2E_TEST_EMAIL"];
  if (!resendApiKey || !testEmail) {
    throw new Error(
      "Missing E2E secrets: E2E_RESEND_API_KEY and E2E_TEST_EMAIL must be set. " +
        "See tests/e2e/.env.test.example.",
    );
  }
  const inboxEmail = process.env["E2E_INBOX_EMAIL"] || testEmail;
  return { resendApiKey, testEmail, inboxEmail };
}
