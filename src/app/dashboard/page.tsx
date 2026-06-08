import { getSession } from '@/lib/auth/session';
import { createServerClient } from '@/db/client';
import { getShelterById } from '@/db/queries/shelters';
import { getNeedsByShelter } from '@/db/queries/needs';
import { logoutAction } from '@/app/actions/auth';
import { NeedsPanel } from './needs-panel';
import { ShelterSettings } from './shelter-settings';
import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

type DashboardProps = {
  searchParams?: Promise<{ delete_error?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardProps) {
  noStore();

  const session = await getSession();
  if (!session) redirect('/login');

  const db = createServerClient();
  const [shelter, needs] = await Promise.all([
    getShelterById(db, session.shelterId),
    getNeedsByShelter(db, session.shelterId),
  ]);

  if (!shelter) redirect('/login');

  const params = (await searchParams) ?? {};
  const deleteError =
    params.delete_error === 'bad_password'
      ? 'Nieprawidłowe hasło — konto nie zostało usunięte.'
      : null;

  return (
    <main className='p-8 max-w-2xl mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-semibold'>{shelter.name}</h1>
          <p className='text-sm text-gray-500 mt-1'>{shelter.city}</p>
        </div>
        <form action={logoutAction}>
          <button type='submit' className='btn-secondary'>
            Wyloguj się
          </button>
        </form>
      </div>
      {deleteError && (
        <p
          role='alert'
          className='mb-4 text-sm text-red-600 border border-red-200 rounded-md px-4 py-2'
        >
          {deleteError}
        </p>
      )}
      <NeedsPanel needs={needs} />
      <ShelterSettings shelter={shelter} />
    </main>
  );
}
