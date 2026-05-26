'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/db/client';
import { createShelter, getShelterByEmail } from '@/db/queries/shelters';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, deleteSession } from '@/lib/auth/session';

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
