import type { DonorFixtureSeed } from './harness';

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
