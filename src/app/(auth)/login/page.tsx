'use client';

import Link from 'next/link';
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
      {state.error && (
        <p role='alert' className='text-red-600 text-sm'>
          {state.error}
        </p>
      )}
      <input type='hidden' name='from' value={from} />

      <div className='space-y-1'>
        <label
          htmlFor='email'
          className='block text-sm font-medium text-gray-700'
        >
          Adres e-mail
        </label>
        <input
          id='email'
          name='email'
          type='email'
          placeholder='koordynator@schronisko.pl'
          required
          className='input'
        />
      </div>

      <div className='space-y-1'>
        <label
          htmlFor='password'
          className='block text-sm font-medium text-gray-700'
        >
          Hasło
        </label>
        <input
          id='password'
          name='password'
          type='password'
          placeholder='Twoje hasło'
          required
          className='input'
        />
      </div>

      <button type='submit' disabled={pending} className='btn-primary w-full'>
        {pending ? 'Logowanie…' : 'Zaloguj się'}
      </button>
      <p className='text-sm text-center text-gray-600'>
        Nie masz konta?{' '}
        <Link
          href='/register'
          className='text-blue-600 underline hover:text-blue-800'
        >
          Zarejestruj schronisko
        </Link>
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
