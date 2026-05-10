import { existsSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import type { Subprocess } from "bun";

const BINARY_NAME = process.platform === "win32" ? "10x.exe" : "10x";
const BINARY_PATH = resolve(import.meta.dir, "../../../dist", BINARY_NAME);

export function getBinaryPath(): string {
  return BINARY_PATH;
}

export function binaryExists(): boolean {
  return existsSync(BINARY_PATH);
}

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  json: <T>() => T;
}

interface CliOptions {
  env?: Record<string, string>;
  timeout?: number;
}

function normalize(raw: string): string {
  return raw.replace(/\r\n/g, "\n");
}

function makeJson(stdout: string): <T>() => T {
  return <T>() => {
    const trimmed = stdout.trim();
    if (!trimmed) throw new Error("stdout is empty — no JSON to parse");
    return JSON.parse(trimmed) as T;
  };
}

function makeTempConfigDir(): string {
  return mkdtempSync(join(tmpdir(), "10x-e2e-"));
}

function buildEnv(
  configDir: string,
  extra?: Record<string, string>,
): Record<string, string> {
  const base: Record<string, string> = {
    PATH: process.env["PATH"] ?? "",
    NO_COLOR: "1",
    HOME: configDir,
    USERPROFILE: configDir,
    XDG_CONFIG_HOME: configDir,
    APPDATA: configDir,
  };
  if (extra) Object.assign(base, extra);
  return base;
}

export function runCli(
  args: string[],
  options: CliOptions = {},
): CliResult {
  if (!binaryExists()) {
    throw new Error(
      `Binary not found at ${BINARY_PATH}. Run \`bun run build:binary\` first.`,
    );
  }

  const configDir = makeTempConfigDir();
  const env = buildEnv(configDir, options.env);
  const timeout = options.timeout ?? 30_000;

  const proc = Bun.spawnSync([BINARY_PATH, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env,
    timeout,
  });

  const stdout = normalize(proc.stdout.toString());
  const stderr = normalize(proc.stderr.toString());

  return {
    exitCode: proc.exitCode,
    stdout,
    stderr,
    json: makeJson(stdout),
  };
}

export function spawnCli(
  args: string[],
  options: Omit<CliOptions, "timeout"> = {},
): { proc: Subprocess; result: Promise<CliResult>; configDir: string } {
  if (!binaryExists()) {
    throw new Error(
      `Binary not found at ${BINARY_PATH}. Run \`bun run build:binary\` first.`,
    );
  }

  const configDir = makeTempConfigDir();
  const env = buildEnv(configDir, options.env);

  const proc = Bun.spawn([BINARY_PATH, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env,
  });

  const result = (async (): Promise<CliResult> => {
    const exitCode = await proc.exited;
    const stdoutRaw = await new Response(proc.stdout).text();
    const stderrRaw = await new Response(proc.stderr).text();
    const stdout = normalize(stdoutRaw);
    const stderr = normalize(stderrRaw);
    return {
      exitCode,
      stdout,
      stderr,
      json: makeJson(stdout),
    };
  })();

  return { proc, result, configDir };
}
