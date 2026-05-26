import { getSession } from '@/lib/auth/session';
import { createServerClient } from '@/db/client';
import { getShelterById } from '@/db/queries/shelters';
import { logoutAction } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const db = createServerClient();
  const shelter = await getShelterById(db, session.shelterId);

  return (
    <main className='p-8 max-w-2xl mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-2xl font-semibold'>{shelter?.name ?? 'Panel'}</h1>
          <p className='text-sm text-gray-500 mt-1'>{shelter?.city}</p>
        </div>
        <form action={logoutAction}>
          <button type='submit' className='btn-secondary'>
            Wyloguj się
          </button>
        </form>
      </div>
      <p className='text-gray-600'>Panel zarządzania potrzebami — wkrótce.</p>
    </main>
  );
}
