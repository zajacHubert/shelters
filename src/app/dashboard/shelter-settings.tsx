'use client';

import { useActionState, useEffect, useState } from 'react';
import { updateShelterAction, deleteShelterAction } from '@/app/actions/auth';
import type { Shelter } from '@/db/queries/shelters';

function EditShelterForm({
  shelter,
  onSuccess,
}: {
  shelter: Shelter;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateShelterAction, {});

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className='space-y-3'>
      <h3 className='text-sm font-medium text-gray-700'>
        Edytuj dane schroniska
      </h3>
      {state.error && (
        <p role='alert' className='text-red-600 text-sm'>
          {state.error}
        </p>
      )}
      {state.success && (
        <p role='status' className='text-green-600 text-sm'>
          Dane zostały zaktualizowane.
        </p>
      )}

      <div className='space-y-2'>
        <label htmlFor='shelter-name' className='block text-sm text-gray-600'>
          Nazwa schroniska
        </label>
        <input
          id='shelter-name'
          name='name'
          defaultValue={shelter.name}
          required
          className='input'
        />
      </div>

      <div className='space-y-2'>
        <label htmlFor='shelter-city' className='block text-sm text-gray-600'>
          Miasto
        </label>
        <input
          id='shelter-city'
          name='city'
          defaultValue={shelter.city}
          required
          className='input'
        />
      </div>

      <div className='space-y-2'>
        <label htmlFor='shelter-email' className='block text-sm text-gray-600'>
          Adres e-mail
        </label>
        <input
          id='shelter-email'
          name='email'
          type='email'
          defaultValue={shelter.email}
          required
          className='input'
        />
      </div>

      <div className='space-y-2'>
        <label
          htmlFor='shelter-new-password'
          className='block text-sm text-gray-600'
        >
          Nowe hasło{' '}
          <span className='text-gray-400'>(zostaw puste, by nie zmieniać)</span>
        </label>
        <input
          id='shelter-new-password'
          name='password'
          type='password'
          placeholder='Minimum 8 znaków'
          className='input'
        />
      </div>

      <div className='space-y-2'>
        <label
          htmlFor='shelter-current-password'
          className='block text-sm text-gray-600'
        >
          Aktualne hasło <span className='text-red-500'>*</span>
        </label>
        <input
          id='shelter-current-password'
          name='current_password'
          type='password'
          required
          placeholder='Wymagane do potwierdzenia zmian'
          className='input'
        />
      </div>

      <button type='submit' disabled={pending} className='btn-primary'>
        {pending ? 'Zapisywanie…' : 'Zapisz zmiany'}
      </button>
    </form>
  );
}

function DeleteShelterForm() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type='button'
        onClick={() => setConfirming(true)}
        className='btn-secondary text-red-600 hover:text-red-800'
      >
        Usuń konto schroniska
      </button>
    );
  }

  return (
    <form action={deleteShelterAction} className='space-y-3'>
      <p className='text-sm text-red-700 font-medium'>
        Tej operacji nie można cofnąć. Wszystkie potrzeby zostaną usunięte.
      </p>
      <div className='space-y-2'>
        <label
          htmlFor='delete-current-password'
          className='block text-sm text-gray-600'
        >
          Wpisz aktualne hasło, aby potwierdzić
        </label>
        <input
          id='delete-current-password'
          name='current_password'
          type='password'
          required
          autoFocus
          className='input'
        />
      </div>
      <div className='flex gap-2'>
        <button
          type='submit'
          className='btn-secondary text-red-600 hover:text-red-800'
        >
          Usuń konto
        </button>
        <button
          type='button'
          onClick={() => setConfirming(false)}
          className='btn-secondary'
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}

export function ShelterSettings({ shelter }: { shelter: Shelter }) {
  const [open, setOpen] = useState(false);

  return (
    <section className='space-y-4 border border-gray-200 rounded-md p-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Ustawienia konta</h2>
        <button
          type='button'
          onClick={() => setOpen((v) => !v)}
          className='btn-secondary text-sm'
        >
          {open ? 'Zwiń' : 'Edytuj'}
        </button>
      </div>

      {open && (
        <div className='space-y-6 pt-2'>
          <EditShelterForm shelter={shelter} onSuccess={() => setOpen(false)} />
          <hr className='border-gray-200' />
          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-gray-700'>
              Strefa niebezpieczna
            </h3>
            <DeleteShelterForm />
          </div>
        </div>
      )}
    </section>
  );
}
