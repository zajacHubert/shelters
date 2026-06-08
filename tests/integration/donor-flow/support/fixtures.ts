import type { DonorFixtureSeed, DonorFixtureSeedWithNeeds } from './harness';

// ---------------------------------------------------------------------------
// Shelter fixtures
// ---------------------------------------------------------------------------

export const donorFixtureWithShelters: DonorFixtureSeed = {
  city: 'warszawa',
  shelters: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Schronisko Warszawa',
      city: 'warszawa',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Przytulisko Mokotow',
      city: 'warszawa',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Dom dla Zwierzat Praga',
      city: 'warszawa',
    },
  ],
};

export const donorFixtureKrakow: DonorFixtureSeed = {
  city: 'krakow',
  shelters: [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Schronisko Krakow',
      city: 'krakow',
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Fundacja Cztery Lapy Krakow',
      city: 'krakow',
    },
  ],
};

export const donorFixtureGdansk: DonorFixtureSeed = {
  city: 'gdansk',
  shelters: [
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'Schronisko Trojmiasto',
      city: 'gdansk',
    },
  ],
};

export const donorFixtureUnknownCity = {
  city: 'miasto-bez-schroniska',
};

export const donorFixtureKnownShelter = {
  id: '11111111-1111-1111-1111-111111111111',
};

export const donorFixtureUnknownShelter = {
  id: '99999999-9999-9999-9999-999999999999',
};

// ---------------------------------------------------------------------------
// Needs fixtures
// ---------------------------------------------------------------------------

export interface NeedFixture {
  id: number;
  shelter_id: string;
  name: string;
  urgency: 'pilne' | 'potrzebne' | 'mile_widziane';
  quantity: number;
  allegro_link: string | null;
  created_at: string;
}

/** Mixed urgency levels for the primary Warsaw shelter — used by ordering tests. */
export const needsFixtureKnownShelter: NeedFixture[] = [
  {
    id: 1,
    shelter_id: '11111111-1111-1111-1111-111111111111',
    name: 'Karma sucha dla psow',
    urgency: 'pilne',
    quantity: 10,
    allegro_link: 'https://allegro.pl/oferta/karma-sucha-dla-psow',
    created_at: new Date(0).toISOString(),
  },
  {
    id: 2,
    shelter_id: '11111111-1111-1111-1111-111111111111',
    name: 'Koce i podkladki',
    urgency: 'potrzebne',
    quantity: 20,
    allegro_link: null,
    created_at: new Date(0).toISOString(),
  },
  {
    id: 3,
    shelter_id: '11111111-1111-1111-1111-111111111111',
    name: 'Zabawki dla kotow',
    urgency: 'mile_widziane',
    quantity: 5,
    allegro_link: 'https://allegro.pl/oferta/zabawki-dla-kotow',
    created_at: new Date(0).toISOString(),
  },
  {
    id: 4,
    shelter_id: '11111111-1111-1111-1111-111111111111',
    name: 'Leki weterynaryjne',
    urgency: 'pilne',
    quantity: 3,
    allegro_link: null,
    created_at: new Date(0).toISOString(),
  },
  {
    id: 5,
    shelter_id: '11111111-1111-1111-1111-111111111111',
    name: 'Karma mokra dla kotow',
    urgency: 'potrzebne',
    quantity: 50,
    allegro_link: 'https://allegro.pl/oferta/karma-mokra-dla-kotow',
    created_at: new Date(0).toISOString(),
  },
];

/** Single urgent need — minimal fixture for tests that just need one need. */
export const needsFixtureSingleUrgent: NeedFixture[] = [
  {
    id: 10,
    shelter_id: '11111111-1111-1111-1111-111111111111',
    name: 'Karma sucha',
    urgency: 'pilne',
    quantity: 5,
    allegro_link: 'https://allegro.pl/oferta/karma-sucha',
    created_at: new Date(0).toISOString(),
  },
];

/** Empty needs — for shelters with no active needs listed. */
export const needsFixtureEmpty: NeedFixture[] = [];

// ---------------------------------------------------------------------------
// Full seed fixture — every shelter has needs (mirrors supabase/seed.sql)
// ---------------------------------------------------------------------------

export const fullSeedFixture: DonorFixtureSeedWithNeeds = {
  city: 'warszawa',
  shelters: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Schronisko Warszawa',
      city: 'warszawa',
      needs: [
        {
          id: 1,
          name: 'Karma sucha dla psow',
          urgency: 'pilne',
          quantity: 10,
          allegro_link: 'https://allegro.pl/oferta/karma-sucha-dla-psow',
        },
        {
          id: 2,
          name: 'Leki weterynaryjne',
          urgency: 'pilne',
          quantity: 3,
          allegro_link: null,
        },
        {
          id: 3,
          name: 'Koce i podkladki',
          urgency: 'potrzebne',
          quantity: 20,
          allegro_link: null,
        },
        {
          id: 4,
          name: 'Karma mokra dla kotow',
          urgency: 'potrzebne',
          quantity: 50,
          allegro_link: 'https://allegro.pl/oferta/karma-mokra-dla-kotow',
        },
        {
          id: 5,
          name: 'Zabawki dla kotow',
          urgency: 'mile_widziane',
          quantity: 5,
          allegro_link: 'https://allegro.pl/oferta/zabawki-dla-kotow',
        },
      ],
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Przytulisko Mokotow',
      city: 'warszawa',
      needs: [
        {
          id: 6,
          name: 'Karma sucha dla kotow',
          urgency: 'pilne',
          quantity: 15,
          allegro_link: 'https://allegro.pl/oferta/karma-sucha-dla-kotow',
        },
        {
          id: 7,
          name: 'Smycze i obroze',
          urgency: 'potrzebne',
          quantity: 10,
          allegro_link: null,
        },
        {
          id: 8,
          name: 'Transportery',
          urgency: 'mile_widziane',
          quantity: 2,
          allegro_link: null,
        },
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Dom dla Zwierzat Praga',
      city: 'warszawa',
      needs: [
        {
          id: 9,
          name: 'Poduszki i legowiska',
          urgency: 'pilne',
          quantity: 8,
          allegro_link: null,
        },
        {
          id: 10,
          name: 'Strzykawki i igly',
          urgency: 'pilne',
          quantity: 20,
          allegro_link: null,
        },
        {
          id: 11,
          name: 'Miska do wody',
          urgency: 'potrzebne',
          quantity: 12,
          allegro_link: 'https://allegro.pl/oferta/miska-do-wody',
        },
        {
          id: 12,
          name: 'Smycze',
          urgency: 'potrzebne',
          quantity: 6,
          allegro_link: null,
        },
        {
          id: 13,
          name: 'Gryzaki dla psow',
          urgency: 'mile_widziane',
          quantity: 4,
          allegro_link: 'https://allegro.pl/oferta/gryzaki-dla-psow',
        },
      ],
    },
  ],
};

export const krakowSeedFixture: DonorFixtureSeedWithNeeds = {
  city: 'krakow',
  shelters: [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Schronisko Krakow',
      city: 'krakow',
      needs: [
        {
          id: 14,
          name: 'Karma sucha mix',
          urgency: 'pilne',
          quantity: 25,
          allegro_link: 'https://allegro.pl/oferta/karma-sucha-mix',
        },
        {
          id: 15,
          name: 'Leki przeciwpasozytnicze',
          urgency: 'pilne',
          quantity: 8,
          allegro_link: null,
        },
        {
          id: 16,
          name: 'Reczniki papierowe',
          urgency: 'potrzebne',
          quantity: 30,
          allegro_link: null,
        },
        {
          id: 17,
          name: 'Klatki transportowe',
          urgency: 'potrzebne',
          quantity: 3,
          allegro_link: 'https://allegro.pl/oferta/klatki-transportowe',
        },
        {
          id: 18,
          name: 'Miski metalowe',
          urgency: 'mile_widziane',
          quantity: 10,
          allegro_link: null,
        },
      ],
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Fundacja Cztery Lapy Krakow',
      city: 'krakow',
      needs: [
        {
          id: 19,
          name: 'Worki na odchody',
          urgency: 'pilne',
          quantity: 50,
          allegro_link: null,
        },
        {
          id: 20,
          name: 'Karma sucha dla psow',
          urgency: 'pilne',
          quantity: 18,
          allegro_link: 'https://allegro.pl/oferta/karma-sucha-dla-psow',
        },
        {
          id: 21,
          name: 'Szampony dla psow',
          urgency: 'potrzebne',
          quantity: 5,
          allegro_link: 'https://allegro.pl/oferta/szampon-dla-psow',
        },
        {
          id: 22,
          name: 'Obroze z chipem',
          urgency: 'potrzebne',
          quantity: 7,
          allegro_link: null,
        },
        {
          id: 23,
          name: 'Zabawki interaktywne',
          urgency: 'mile_widziane',
          quantity: 3,
          allegro_link: 'https://allegro.pl/oferta/zabawki-interaktywne',
        },
      ],
    },
  ],
};

export const gdanskSeedFixture: DonorFixtureSeedWithNeeds = {
  city: 'gdansk',
  shelters: [
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'Schronisko Trojmiasto',
      city: 'gdansk',
      needs: [
        {
          id: 24,
          name: 'Karma sucha dla kotow',
          urgency: 'pilne',
          quantity: 20,
          allegro_link: 'https://allegro.pl/oferta/karma-sucha-dla-kotow',
        },
        {
          id: 25,
          name: 'Bandaze i gaza',
          urgency: 'pilne',
          quantity: 15,
          allegro_link: null,
        },
        {
          id: 26,
          name: 'Legowiska dla psow',
          urgency: 'potrzebne',
          quantity: 6,
          allegro_link: 'https://allegro.pl/oferta/legowiska-dla-psow',
        },
        {
          id: 27,
          name: 'Karma mokra dla psow',
          urgency: 'potrzebne',
          quantity: 40,
          allegro_link: 'https://allegro.pl/oferta/karma-mokra-dla-psow',
        },
        {
          id: 28,
          name: 'Drapaki dla kotow',
          urgency: 'mile_widziane',
          quantity: 2,
          allegro_link: 'https://allegro.pl/oferta/drapaki-dla-kotow',
        },
      ],
    },
  ],
};
