import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

beforeEach(() => {
  mock.module('next/cache', () => ({
    unstable_noStore: () => {},
  }));

  mock.module('@/db/client', () => ({
    createServerClient: () => ({ mocked: true }),
  }));
});

const describeIntegration =
  process.env['RUN_INTEGRATION_TESTS'] === '1' ? describe : describe.skip;

describeIntegration('donor shelter detail route integration contract', () => {
  it('renders shelter detail with needs for valid shelter id', async () => {
    mock.module('next/navigation', () => ({
      notFound: () => {
        throw new Error('NEXT_NOT_FOUND');
      },
    }));

    mock.module('@/db/queries/shelters', () => ({
      getShelterById: async () => ({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Schronisko Warszawa',
        city: 'warszawa',
      }),
    }));

    mock.module('@/db/queries/needs', () => ({
      getNeedsByShelter: async () => [
        {
          id: 1,
          shelter_id: '11111111-1111-1111-1111-111111111111',
          name: 'Karma sucha',
          urgency: 'pilne',
          quantity: 5,
          allegro_link: 'https://allegro.pl/oferta/karma-sucha',
          created_at: new Date().toISOString(),
        },
      ],
    }));

    const pageModule = await import('../../../src/app/shelters/[id]/page');
    const element = await pageModule.default({
      params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('Schronisko Warszawa');
    expect(html).toContain('Karma sucha');
    expect(html).toContain('Kup na Allegro -&gt;');
  });

  it('throws notFound contract for unknown shelter id', async () => {
    mock.module('next/navigation', () => ({
      notFound: () => {
        throw new Error('NEXT_NOT_FOUND');
      },
    }));

    mock.module('@/db/queries/shelters', () => ({
      getShelterById: async () => null,
    }));

    mock.module('@/db/queries/needs', () => ({
      getNeedsByShelter: async () => [],
    }));

    const pageModule = await import('../../../src/app/shelters/[id]/page');

    await expect(
      pageModule.default({
        params: Promise.resolve({ id: '99999999-9999-9999-9999-999999999999' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
