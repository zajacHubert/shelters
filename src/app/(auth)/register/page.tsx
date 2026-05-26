'use client';

import { useActionState } from 'react';
import { registerAction } from '@/app/actions/auth';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <form action={formAction} className='w-full max-w-sm space-y-4'>
      <h1 className='text-xl font-semibold'>Zarejestruj schronisko</h1>
      {state.error && <p className='text-red-600 text-sm'>{state.error}</p>}
      <input
        name='name'
        placeholder='Nazwa schroniska'
        required
        className='input'
      />
      <input name='city' placeholder='Miasto' required className='input' />
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
        placeholder='Hasło (min. 8 znaków)'
        required
        className='input'
      />
      <button type='submit' disabled={pending} className='btn-primary w-full'>
        {pending ? 'Rejestrowanie…' : 'Zarejestruj'}
      </button>
      <p className='text-sm text-center'>
        Masz konto?{' '}
        <a href='/login' className='underline'>
          Zaloguj się
        </a>
      </p>
    </form>
  );
}
