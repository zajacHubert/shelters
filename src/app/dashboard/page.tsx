import { getSession } from '@/lib/auth/session';
import { logoutAction } from '@/app/actions/auth';

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <main className='p-8'>
      <h1 className='text-xl font-semibold mb-4'>Panel koordynatora</h1>
      <p className='text-sm text-gray-600 mb-8'>
        Shelter ID: {session?.shelterId}
      </p>
      <form action={logoutAction}>
        <button type='submit' className='btn-secondary'>
          Wyloguj się
        </button>
      </form>
    </main>
  );
}
