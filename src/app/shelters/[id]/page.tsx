import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createServerClient } from '@/db/client';
import { getShelterById } from '@/db/queries/shelters';
import { getNeedsByShelter } from '@/db/queries/needs';
import type { Urgency } from '@/db/types';

const URGENCY_LABEL: Record<Urgency, string> = {
  pilne: 'Pilne',
  potrzebne: 'Potrzebne',
  mile_widziane: 'Mile widziane',
};

const URGENCY_COLOR: Record<Urgency, string> = {
  pilne: 'bg-red-100 text-red-800',
  potrzebne: 'bg-yellow-100 text-yellow-800',
  mile_widziane: 'bg-green-100 text-green-800',
};

type ShelterPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShelterPage({ params }: ShelterPageProps) {
  noStore();

  const { id } = await params;
  const db = createServerClient();

  const [shelter, needs] = await Promise.all([
    getShelterById(db, id),
    getNeedsByShelter(db, id),
  ]);

  if (!shelter) {
    notFound();
  }

  return (
    <main className='mx-auto max-w-3xl p-8 space-y-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold'>{shelter.name}</h1>
        <p className='text-sm text-gray-500'>{shelter.city}</p>
      </header>

      {needs.length === 0 ? (
        <p className='text-sm text-gray-500'>To schronisko nie dodalo jeszcze potrzeb.</p>
      ) : (
        <ul className='space-y-3'>
          {needs.map((need) => (
            <li
              key={need.id}
              className='rounded-md border border-gray-200 px-4 py-3 space-y-2'
            >
              <div className='flex items-center gap-3'>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_COLOR[need.urgency]}`}
                >
                  {URGENCY_LABEL[need.urgency]}
                </span>
                <span className='font-medium'>{need.name}</span>
                <span className='text-sm text-gray-500'>x{need.quantity}</span>
              </div>
              {need.allegro_link && (
                <a
                  href={need.allegro_link}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex text-blue-600 underline hover:text-blue-800'
                >
                  Kup na Allegro -&gt;
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
