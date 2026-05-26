'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { createServerClient } from '@/db/client';
import { createNeed, updateNeed, deleteNeed } from '@/db/queries/needs';
import type { Urgency } from '@/db/types';

const VALID_URGENCY: Urgency[] = ['pilne', 'potrzebne', 'mile_widziane'];

function parseNeedForm(
  formData: FormData,
):
  | {
      name: string;
      urgency: Urgency;
      quantity: number;
      allegro_link: string | null;
    }
  | { error: string } {
  const name = formData.get('name')?.toString().trim() ?? '';
  const urgency = formData.get('urgency')?.toString() as Urgency;
  const quantity = parseInt(formData.get('quantity')?.toString() ?? '', 10);
  const raw_link = formData.get('allegro_link')?.toString().trim() ?? '';
  const allegro_link = raw_link === '' ? null : raw_link;

  if (!name) return { error: 'Nazwa jest wymagana.' };
  if (!VALID_URGENCY.includes(urgency))
    return { error: 'Nieprawidłowy poziom pilności.' };
  if (isNaN(quantity) || quantity < 1)
    return { error: 'Ilość musi być liczbą większą od 0.' };
  if (allegro_link !== null && !allegro_link.startsWith('https://')) {
    return { error: 'Link do Allegro musi zaczynać się od https://.' };
  }

  return { name, urgency, quantity, allegro_link };
}

export async function addNeedAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) redirect('/login');

  const parsed = parseNeedForm(formData);
  if ('error' in parsed) return { error: parsed.error };

  const db = createServerClient();
  await createNeed(db, session.shelterId, parsed);
  revalidatePath('/dashboard');
  return {};
}

export async function updateNeedAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = parseInt(formData.get('id')?.toString() ?? '', 10);
  if (isNaN(id)) return { error: 'Nieprawidłowe ID potrzeby.' };

  const parsed = parseNeedForm(formData);
  if ('error' in parsed) return { error: parsed.error };

  const db = createServerClient();
  await updateNeed(db, session.shelterId, id, parsed);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteNeedAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = parseInt(formData.get('id')?.toString() ?? '', 10);
  if (!isNaN(id)) {
    const db = createServerClient();
    await deleteNeed(db, session.shelterId, id);
    revalidatePath('/dashboard');
  }
}
