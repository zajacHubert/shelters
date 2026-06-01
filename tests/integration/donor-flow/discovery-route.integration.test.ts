import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const makeLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: unknown;
}) => createElement('a', { href, className }, children);

beforeEach(() => {
  mock.module('next/cache', () => ({
    unstable_noStore: () => {},
  }));

  mock.module('next/link', () => ({
    default: makeLink,
  }));

  mock.module('@/db/client', () => ({
    createServerClient: () => ({ mocked: true }),
  }));
});

const describeIntegration =
  process.env['RUN_INTEGRATION_TESTS'] === '1' ? describe : describe.skip;

describeIntegration('donor discovery route integration contract', () => {
  it('renders no-city prompt when city query is absent', async () => {
    mock.module('@/db/queries/shelters', () => ({
      getSheltersByCity: async () => [],
      getShelterById: async () => null,
    }));

    const pageModule = await import('../../../src/app/page');
    const element = await pageModule.default({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('Wpisz miasto, aby zobaczyc schroniska.');
  });

  it('renders known-city results with shelter links', async () => {
    mock.module('@/db/queries/shelters', () => ({
      getSheltersByCity: async () => [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Schronisko Warszawa',
          city: 'warszawa',
        },
      ],
      getShelterById: async () => null,
    }));

    const pageModule = await import('../../../src/app/page');
    const element = await pageModule.default({
      searchParams: Promise.resolve({ city: 'Warszawa' }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('Schronisko Warszawa');
    expect(html).toContain('Zobacz potrzeby');
    expect(html).toContain('/shelters/11111111-1111-1111-1111-111111111111');
  });

  it('renders empty-state message for unknown city', async () => {
    mock.module('@/db/queries/shelters', () => ({
      getSheltersByCity: async () => [],
      getShelterById: async () => null,
    }));

    const pageModule = await import('../../../src/app/page');
    const element = await pageModule.default({
      searchParams: Promise.resolve({ city: 'miasto-bez-schroniska' }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('Brak schronisk w tym miescie.');
  });
});
