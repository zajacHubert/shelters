import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { createServerClient } from '@/db/client';
import { getSheltersByCity } from '@/db/queries/shelters';
import type { Shelter } from '@/db/queries/shelters';

type HomeProps = {
  searchParams?: Promise<{
    city?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  noStore();

  const params = (await searchParams) ?? {};
  const city = params.city?.trim() ?? '';

  let shelters: Shelter[] = [];
  if (city) {
    const db = createServerClient();
    shelters = await getSheltersByCity(db, city);
  }

  return (
    <main className='mx-auto max-w-3xl p-8 space-y-8'>
      <section className='space-y-2'>
        <h1 className='text-3xl font-semibold'>ShelterNeeds</h1>
        <p className='text-gray-600'>
          Znajdź schronisko po mieście i sprawdź aktualne potrzeby.
        </p>
      </section>

      <section className='space-y-3'>
        <form className='flex flex-col gap-3 sm:flex-row'>
          <input
            name='city'
            defaultValue={city}
            placeholder='Podaj miasto (np. Warszawa)'
            className='input'
          />
          <button type='submit' className='btn-primary'>
            Szukaj
          </button>
        </form>
      </section>

      {!city && (
        <p className='text-sm text-gray-500'>
          Wpisz miasto, aby zobaczyć schroniska.
        </p>
      )}

      {city && shelters.length === 0 && (
        <p className='text-sm text-gray-500'>Brak schronisk w tym miescie.</p>
      )}

      {shelters.length > 0 && (
        <ul className='space-y-3'>
          {shelters.map((shelter) => (
            <li
              key={shelter.id}
              className='rounded-md border border-gray-200 p-4 flex items-center justify-between gap-3'
            >
              <div>
                <p className='font-medium'>{shelter.name}</p>
                <p className='text-sm text-gray-500'>{shelter.city}</p>
              </div>
              <Link
                href={`/shelters/${shelter.id}`}
                className='text-blue-600 underline hover:text-blue-800'
              >
                Zobacz potrzeby
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
