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
  if (!data || data.length === 0) return [];

  // Only show shelters that have at least one need listed
  const ids = data.map((s) => s.id);
  const { data: needsRows, error: needsError } = await db
    .from('needs')
    .select('shelter_id')
    .in('shelter_id', ids);
  if (needsError) throw needsError;

  const shelterIdsWithNeeds = new Set(
    (needsRows ?? []).map((n) => n.shelter_id),
  );
  return data.filter((s) => shelterIdsWithNeeds.has(s.id));
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

export async function getShelterById(
  db: Db,
  id: string,
): Promise<Shelter | null> {
  const { data, error } = await db
    .from('shelters')
    .select('*')
    .eq('id', id)
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

export async function updateShelter(
  db: Db,
  id: string,
  changes: Partial<
    Pick<NewShelter, 'name' | 'city' | 'email' | 'password_hash'>
  >,
): Promise<Shelter> {
  const patch = { ...changes };
  if (patch.city !== undefined) patch.city = patch.city.toLowerCase();
  const { data, error } = await db
    .from('shelters')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteShelter(db: Db, id: string): Promise<void> {
  const { error } = await db.from('shelters').delete().eq('id', id);
  if (error) throw error;
}
