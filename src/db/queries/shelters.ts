import type { Db } from '../client';
import type { Database } from '../types';

export type Shelter = Database['public']['Tables']['shelters']['Row'];
export type NewShelter = Database['public']['Tables']['shelters']['Insert'];

export async function getSheltersByCity(
  db: Db,
  city: string,
): Promise<Shelter[]> {
  const { data, error } = await db
    .from('shelters')
    .select('*')
    .eq('city', city.toLowerCase());
  if (error) throw error;
  return data ?? [];
}

export async function getShelterByEmail(
  db: Db,
  email: string,
): Promise<Shelter | null> {
  const { data, error } = await db
    .from('shelters')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createShelter(
  db: Db,
  input: NewShelter,
): Promise<Shelter> {
  const { data, error } = await db
    .from('shelters')
    .insert({ ...input, city: input.city.toLowerCase() })
    .select()
    .single();
  if (error) throw error;
  return data;
}
