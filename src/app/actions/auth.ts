'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/db/client';
import {
  createShelter,
  getShelterByEmail,
  getShelterById,
  updateShelter,
  deleteShelter,
} from '@/db/queries/shelters';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, deleteSession, getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function registerAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const city = (formData.get('city') as string | null)?.trim() ?? '';
  const email =
    (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
  const password = (formData.get('password') as string | null) ?? '';

  if (!name || !city || !email || !password) {
    return { error: 'Wszystkie pola są wymagane.' };
  }
  if (password.length < 8) {
    return { error: 'Hasło musi mieć co najmniej 8 znaków.' };
  }

  const db = createServerClient();
  const existing = await getShelterByEmail(db, email);
  if (existing) {
    return { error: 'Ten adres e-mail jest już zarejestrowany.' };
  }

  const password_hash = await hashPassword(password);
  const shelter = await createShelter(db, { name, city, email, password_hash });

  await createSession({ shelterId: shelter.id });
  redirect('/dashboard');
}

export async function loginAction(
  _prevState: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const email =
    (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
  const password = (formData.get('password') as string | null) ?? '';
  const from = (formData.get('from') as string | null) ?? '/dashboard';

  if (!email || !password) {
    return { error: 'Podaj e-mail i hasło.' };
  }

  const db = createServerClient();
  const shelter = await getShelterByEmail(db, email);
  if (!shelter) {
    return { error: 'Nieprawidłowy e-mail lub hasło.' };
  }

  const valid = await verifyPassword(password, shelter.password_hash);
  if (!valid) {
    return { error: 'Nieprawidłowy e-mail lub hasło.' };
  }

  await createSession({ shelterId: shelter.id });
  redirect(from.startsWith('/') ? from : '/dashboard');
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect('/');
}

export async function updateShelterAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) redirect('/login');

  const name = (formData.get('name') as string | null)?.trim() ?? '';
  const city = (formData.get('city') as string | null)?.trim() ?? '';
  const email =
    (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
  const password = (formData.get('password') as string | null) ?? '';
  const currentPassword =
    (formData.get('current_password') as string | null) ?? '';

  if (!name || !city || !email) {
    return { error: 'Nazwa, miasto i e-mail są wymagane.' };
  }

  const db = createServerClient();

  // Verify current password before allowing any change
  const shelter = await getShelterById(db, session.shelterId);
  if (!shelter) return { error: 'Schronisko nie istnieje.' };

  const validPassword = await verifyPassword(
    currentPassword,
    shelter.password_hash,
  );
  if (!validPassword) {
    return { error: 'Aktualne hasło jest nieprawidłowe.' };
  }

  // Check e-mail uniqueness if it changed
  if (email !== shelter.email) {
    const existing = await getShelterByEmail(db, email);
    if (existing) return { error: 'Ten adres e-mail jest już zajęty.' };
  }

  const patch: Parameters<typeof updateShelter>[2] = { name, city, email };
  if (password) {
    if (password.length < 8) {
      return { error: 'Nowe hasło musi mieć co najmniej 8 znaków.' };
    }
    patch.password_hash = await hashPassword(password);
  }

  await updateShelter(db, session.shelterId, patch);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteShelterAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/login');

  const currentPassword =
    (formData.get('current_password') as string | null) ?? '';

  const db = createServerClient();
  const shelter = await getShelterById(db, session.shelterId);
  if (!shelter) redirect('/');

  const valid = await verifyPassword(currentPassword, shelter.password_hash);
  if (!valid) {
    // Cannot return error from void action — redirect with error param
    redirect('/dashboard?delete_error=bad_password');
  }

  await deleteShelter(db, session.shelterId);
  await deleteSession();
  redirect('/');
}
