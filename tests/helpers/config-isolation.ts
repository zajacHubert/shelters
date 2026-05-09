/**
 * Cross-platform config directory isolation for tests.
 *
 * On POSIX, configDir() reads XDG_CONFIG_HOME. On Windows, it reads APPDATA.
 * Tests must redirect both to a temp directory for proper isolation.
 */

let priorXdg: string | undefined;
let priorAppData: string | undefined;

export function redirectConfigDir(tmpDir: string): void {
  priorXdg = process.env["XDG_CONFIG_HOME"];
  priorAppData = process.env["APPDATA"];
  process.env["XDG_CONFIG_HOME"] = tmpDir;
  process.env["APPDATA"] = tmpDir;
}

export function restoreConfigDir(): void {
  if (priorXdg === undefined) delete process.env["XDG_CONFIG_HOME"];
  else process.env["XDG_CONFIG_HOME"] = priorXdg;
  if (priorAppData === undefined) delete process.env["APPDATA"];
  else process.env["APPDATA"] = priorAppData;
}
