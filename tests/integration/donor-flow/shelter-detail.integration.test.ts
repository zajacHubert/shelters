import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  donorFixtureKnownShelter,
  needsFixtureSingleUrgent,
} from './support/fixtures';

beforeEach(() => {
  mock.module('next/cache', () => ({
    unstable_noStore: () => {},
  }));

  mock.module('@/db/client', () => ({
    createServerClient: () => ({ mocked: true }),
  }));
});

describe('donor shelter detail route integration contract', () => {
  it('renders shelter detail with needs for valid shelter id', async () => {
    mock.module('next/navigation', () => ({
      notFound: () => {
        throw new Error('NEXT_NOT_FOUND');
      },
    }));

    mock.module('@/db/queries/shelters', () => ({
      getShelterById: async () => ({
        id: donorFixtureKnownShelter.id,
        name: 'Schronisko Warszawa',
        city: 'warszawa',
      }),
    }));

    mock.module('@/db/queries/needs', () => ({
      getNeedsByShelter: async () => needsFixtureSingleUrgent,
    }));

    const pageModule = await import('../../../src/app/shelters/[id]/page');
    const element = await pageModule.default({
      params: Promise.resolve({ id: donorFixtureKnownShelter.id }),
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
