import { describe, expect, it } from 'bun:test';
import {
  assertBodyContainsMarkers,
  assertHttpStatus,
  createDonorTestContext,
  normalizeBody,
} from './support/harness';
import {
  donorFixtureKnownShelter,
  donorFixtureUnknownCity,
  donorFixtureUnknownShelter,
  donorFixtureWithShelters,
} from './support/fixtures';

const describeIntegration =
  process.env['RUN_INTEGRATION_TESTS'] === '1' ? describe : describe.skip;

describeIntegration('donor integration harness scaffold', () => {
  it('creates context and validates status + body markers', async () => {
    const context = await createDonorTestContext();

    expect(context.runId.startsWith('donor-')).toBe(true);
    expect(context.startedAt instanceof Date).toBe(true);

    const mockResult = {
      status: 200,
      body: '<main>  Schronisko Warszawa   Zobacz potrzeby </main>',
    };

    assertHttpStatus(mockResult, 200);
    assertBodyContainsMarkers(mockResult.body, [
      'Schronisko Warszawa',
      'Zobacz potrzeby',
    ]);

    expect(normalizeBody('  a   b  c ')).toBe('a b c');
  });

  it('exports deterministic donor fixture contract', () => {
    expect(donorFixtureWithShelters.city).toBe('warszawa');
    expect(donorFixtureWithShelters.shelters.length).toBeGreaterThan(0);
    expect(donorFixtureUnknownCity.city).toBe('miasto-bez-schroniska');
    expect(donorFixtureKnownShelter.id).toBe(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(donorFixtureUnknownShelter.id).toBe(
      '99999999-9999-9999-9999-999999999999',
    );
  });
});
