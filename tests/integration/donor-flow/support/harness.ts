export interface DonorTestContext {
  runId: string;
  startedAt: Date;
}

export interface DonorFixtureSeed {
  city: string;
  shelters: Array<{
    id: string;
    name: string;
    city: string;
  }>;
}

export interface DonorHttpResult {
  status: number;
  body: string;
}

export interface CreateDonorContextOptions {
  seedFixture?: DonorFixtureSeed;
  seedAdapter?: (fixture: DonorFixtureSeed) => Promise<void>;
}

export async function createDonorTestContext(
  options: CreateDonorContextOptions = {},
): Promise<DonorTestContext> {
  const ctx: DonorTestContext = {
    runId: `donor-${Date.now()}`,
    startedAt: new Date(),
  };

  if (options.seedFixture && options.seedAdapter) {
    await options.seedAdapter(options.seedFixture);
  }

  return ctx;
}

export function assertHttpStatus(
  result: DonorHttpResult,
  expectedStatus: number,
): void {
  if (result.status !== expectedStatus) {
    throw new Error(
      `Expected HTTP ${expectedStatus}, received ${result.status}. Body: ${result.body}`,
    );
  }
}

export function assertBodyContainsMarkers(
  body: string,
  markers: string[],
): void {
  const normalized = normalizeBody(body);
  for (const marker of markers) {
    if (!normalized.includes(marker)) {
      throw new Error(`Expected marker not found: ${marker}`);
    }
  }
}

export function normalizeBody(body: string): string {
  return body.replace(/\s+/g, ' ').trim();
}
