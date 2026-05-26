import type { Db } from '../client';
import type { Database, Urgency } from '../types';

export type Need = Database['public']['Tables']['needs']['Row'];
export type NewNeed = Database['public']['Tables']['needs']['Insert'];

const URGENCY_ORDER: Record<Urgency, number> = {
  pilne: 1,
  potrzebne: 2,
  mile_widziane: 3,
};

export async function getNeedsByShelter(
  db: Db,
  shelterId: string,
): Promise<Need[]> {
  const { data, error } = await db
    .from('needs')
    .select('*')
    .eq('shelter_id', shelterId);
  if (error) throw error;
  return (data ?? []).sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency],
  );
}

export async function createNeed(
  db: Db,
  shelterId: string,
  input: Omit<NewNeed, 'shelter_id'>,
): Promise<Need> {
  const { data, error } = await db
    .from('needs')
    .insert({ ...input, shelter_id: shelterId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNeed(
  db: Db,
  shelterId: string,
  needId: number,
  changes: Partial<Omit<NewNeed, 'shelter_id'>>,
): Promise<Need> {
  const { data, error } = await db
    .from('needs')
    .update(changes)
    .eq('id', needId)
    .eq('shelter_id', shelterId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNeed(
  db: Db,
  shelterId: string,
  needId: number,
): Promise<void> {
  const { error } = await db
    .from('needs')
    .delete()
    .eq('id', needId)
    .eq('shelter_id', shelterId);
  if (error) throw error;
}
