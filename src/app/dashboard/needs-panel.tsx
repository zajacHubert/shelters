'use client';

import { useActionState, useEffect, useState, useCallback } from 'react';
import {
  addNeedAction,
  updateNeedAction,
  deleteNeedAction,
} from '@/app/actions/needs';
import type { Need } from '@/db/queries/needs';
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

function UrgencySelect({ defaultValue }: { defaultValue?: Urgency }) {
  return (
    <select
      name='urgency'
      required
      defaultValue={defaultValue ?? ''}
      className='input'
    >
      <option value='' disabled>
        Pilność
      </option>
      <option value='pilne'>Pilne</option>
      <option value='potrzebne'>Potrzebne</option>
      <option value='mile_widziane'>Mile widziane</option>
    </select>
  );
}

function AddNeedForm() {
  const [state, formAction, pending] = useActionState(addNeedAction, {});
  return (
    <form
      action={formAction}
      className='space-y-3 border border-gray-200 rounded-md p-4'
    >
      <h2 className='text-sm font-medium text-gray-700'>Dodaj potrzebę</h2>
      {state.error && (
        <p role='alert' className='text-red-600 text-sm'>
          {state.error}
        </p>
      )}
      <div className='grid grid-cols-2 gap-3'>
        <input
          name='name'
          placeholder='Nazwa (np. karma sucha)'
          required
          className='input col-span-2'
        />
        <UrgencySelect />
        <input
          name='quantity'
          type='number'
          min='1'
          placeholder='Ilość'
          required
          className='input'
        />
      </div>
      <input
        name='allegro_link'
        type='url'
        placeholder='Link do Allegro (opcjonalnie)'
        className='input'
      />
      <button type='submit' disabled={pending} className='btn-primary'>
        {pending ? 'Dodawanie…' : 'Dodaj'}
      </button>
    </form>
  );
}

function EditNeedForm({
  need,
  onCancel,
}: {
  need: Need;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateNeedAction, {});

  useEffect(() => {
    if (state.success) onCancel();
  }, [state.success, onCancel]);

  return (
    <form
      action={formAction}
      className='space-y-3 border border-blue-200 rounded-md p-4 bg-blue-50'
    >
      <h2 className='text-sm font-medium text-gray-700'>Edytuj potrzebę</h2>
      {state.error && (
        <p role='alert' className='text-red-600 text-sm'>
          {state.error}
        </p>
      )}
      <input type='hidden' name='id' value={need.id} />
      <div className='grid grid-cols-2 gap-3'>
        <input
          name='name'
          defaultValue={need.name}
          required
          className='input col-span-2'
        />
        <UrgencySelect defaultValue={need.urgency} />
        <input
          name='quantity'
          type='number'
          min='1'
          defaultValue={need.quantity}
          required
          className='input'
        />
      </div>
      <input
        name='allegro_link'
        type='url'
        defaultValue={need.allegro_link ?? ''}
        placeholder='Link do Allegro (opcjonalnie)'
        className='input'
      />
      <div className='flex gap-2'>
        <button type='submit' disabled={pending} className='btn-primary'>
          {pending ? 'Zapisywanie…' : 'Zapisz'}
        </button>
        <button type='button' onClick={onCancel} className='btn-secondary'>
          Anuluj
        </button>
      </div>
    </form>
  );
}

export function NeedsPanel({ needs }: { needs: Need[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const closeEdit = useCallback(() => setEditingId(null), []);

  return (
    <section className='space-y-4'>
      <h2 className='text-lg font-semibold'>Potrzeby schroniska</h2>

      {needs.length === 0 && (
        <p className='text-gray-500 text-sm'>
          Brak potrzeb. Dodaj pierwszą poniżej.
        </p>
      )}

      <ul className='space-y-2'>
        {needs.map((need) =>
          editingId === need.id ? (
            <li key={need.id}>
              <EditNeedForm need={need} onCancel={closeEdit} />
            </li>
          ) : (
            <li
              key={need.id}
              className='flex items-center justify-between gap-4 border border-gray-200 rounded-md px-4 py-3'
            >
              <div className='flex items-center gap-3 min-w-0'>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_COLOR[need.urgency]}`}
                >
                  {URGENCY_LABEL[need.urgency]}
                </span>
                <span className='font-medium truncate'>{need.name}</span>
                <span className='text-sm text-gray-500 shrink-0'>
                  ×{need.quantity}
                </span>
                {need.allegro_link && (
                  <a
                    href={need.allegro_link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-blue-600 underline shrink-0'
                  >
                    Allegro
                  </a>
                )}
              </div>
              <div className='flex gap-2 shrink-0'>
                <button
                  type='button'
                  onClick={() => setEditingId(need.id)}
                  className='btn-secondary text-xs px-2 py-1'
                >
                  Edytuj
                </button>
                <form action={deleteNeedAction}>
                  <input type='hidden' name='id' value={need.id} />
                  <button
                    type='submit'
                    className='btn-secondary text-xs px-2 py-1 text-red-600 hover:text-red-800'
                  >
                    Usuń
                  </button>
                </form>
              </div>
            </li>
          ),
        )}
      </ul>

      <AddNeedForm />
    </section>
  );
}
