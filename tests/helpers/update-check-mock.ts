/**
 * Shared module mock for src/lib/update-check.
 *
 * Doctor calls fetchLatestVersion() against the npm registry; tests must
 * never hit the network. Same singleton pattern as api-content-mock: capture
 * the real exports, install a mutable steer-point, fall through to the real
 * impl when no override is set. compareSemver / upgradeCommand are pure and
 * pass through unchanged.
 */

import { mock } from "bun:test";
import type { LatestVersionResult } from "../../src/lib/update-check";

const real = await import("../../src/lib/update-check");
const realFetchLatestVersion = real.fetchLatestVersion;
const realCompareSemver = real.compareSemver;
const realUpgradeCommand = real.upgradeCommand;

export interface UpdateCheckMockState {
  fetchLatestVersionImpl: null | (() => Promise<LatestVersionResult> | LatestVersionResult);
  upgradeCommandImpl: null | (() => string);
}

export const updateCheckMockState: UpdateCheckMockState = {
  fetchLatestVersionImpl: null,
  upgradeCommandImpl: null,
};

mock.module("../../src/lib/update-check", () => ({
  fetchLatestVersion: (options?: { timeoutMs?: number; url?: string }) =>
    updateCheckMockState.fetchLatestVersionImpl
      ? Promise.resolve(updateCheckMockState.fetchLatestVersionImpl())
      : realFetchLatestVersion(options),
  compareSemver: realCompareSemver,
  upgradeCommand: () =>
    updateCheckMockState.upgradeCommandImpl
      ? updateCheckMockState.upgradeCommandImpl()
      : realUpgradeCommand(),
}));

export function resetUpdateCheckMock(): void {
  updateCheckMockState.fetchLatestVersionImpl = null;
  updateCheckMockState.upgradeCommandImpl = null;
}
