'use client';

import { useActionState } from 'react';
import { registerAction } from '@/app/actions/auth';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <form action={formAction} className='w-full max-w-sm space-y-4'>
      <h1 className='text-xl font-semibold'>Zarejestruj schronisko</h1>
      {state.error && (
        <p role='alert' className='text-red-600 text-sm'>
          {state.error}
        </p>
      )}

      <div className='space-y-1'>
        <label
          htmlFor='name'
          className='block text-sm font-medium text-gray-700'
        >
          Nazwa schroniska
        </label>
        <input
          id='name'
          name='name'
          placeholder='np. Schronisko Na Paluchu'
          required
          className='input'
        />
      </div>

      <div className='space-y-1'>
        <label
          htmlFor='city'
          className='block text-sm font-medium text-gray-700'
        >
          Miasto
        </label>
        <input
          id='city'
          name='city'
          placeholder='np. Warszawa'
          required
          className='input'
        />
      </div>

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
          placeholder='Minimum 8 znaków'
          required
          className='input'
        />
      </div>

      <button type='submit' disabled={pending} className='btn-primary w-full'>
        {pending ? 'Rejestrowanie…' : 'Zarejestruj schronisko'}
      </button>
      <p className='text-sm text-center text-gray-600'>
        Masz już konto?{' '}
        <a href='/login' className='text-blue-600 underline hover:text-blue-800'>
          Zaloguj się
        </a>
      </p>
    </form>
  );
}
