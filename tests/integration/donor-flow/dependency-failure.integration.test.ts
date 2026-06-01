import { beforeEach, describe, expect, it, mock } from 'bun:test';

beforeEach(() => {
  mock.module('next/cache', () => ({
    unstable_noStore: () => {},
  }));

  mock.module('next/link', () => ({
    default: ({ children }: { children: unknown }) => children,
  }));
});

const describeIntegration =
  process.env['RUN_INTEGRATION_TESTS'] === '1' ? describe : describe.skip;

describeIntegration('donor dependency failure contract', () => {
  it('fails fast when Supabase env configuration is missing', async () => {
    mock.module('@/db/client', () => ({
      createServerClient: () => {
        throw new Error(
          'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.',
        );
      },
    }));

    mock.module('@/db/queries/shelters', () => ({
      getSheltersByCity: async () => [],
      getShelterById: async () => null,
    }));

    const pageModule = await import('../../../src/app/page');

    await expect(
      pageModule.default({
        searchParams: Promise.resolve({ city: 'warszawa' }),
      }),
    ).rejects.toThrow('Missing Supabase env vars');
  });

  it('fails fast when shelter city query throws', async () => {
    mock.module('@/db/client', () => ({
      createServerClient: () => ({ mocked: true }),
    }));

    mock.module('@/db/queries/shelters', () => ({
      getSheltersByCity: async () => {
        throw new Error('query_failed');
      },
      getShelterById: async () => null,
    }));

    const pageModule = await import('../../../src/app/page');

    await expect(
      pageModule.default({
        searchParams: Promise.resolve({ city: 'warszawa' }),
      }),
    ).rejects.toThrow('query_failed');
  });
});
