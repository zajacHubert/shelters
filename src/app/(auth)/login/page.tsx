'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import { Suspense } from 'react';

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/dashboard';
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className='w-full max-w-sm space-y-4'>
      <h1 className='text-xl font-semibold'>Logowanie</h1>
      {state.error && <p className='text-red-600 text-sm'>{state.error}</p>}
      <input type='hidden' name='from' value={from} />
      <input
        name='email'
        type='email'
        placeholder='E-mail'
        required
        className='input'
      />
      <input
        name='password'
        type='password'
        placeholder='Hasło'
        required
        className='input'
      />
      <button type='submit' disabled={pending} className='btn-primary w-full'>
        {pending ? 'Logowanie…' : 'Zaloguj się'}
      </button>
      <p className='text-sm text-center'>
        Nie masz konta?{' '}
        <a href='/register' className='underline'>
          Zarejestruj schronisko
        </a>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
