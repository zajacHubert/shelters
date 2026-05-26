import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type Db = SupabaseClient<Database>;

/**
 * Create a typed Supabase client for server-side use.
 *
 * Usage in Server Components / Server Actions:
 *   import { createServerClient } from '@/db/client';
 *   const db = createServerClient();
 *   const shelters = await getSheltersByCity(db, 'warszawa');
 *
 * Note: NEXT_PUBLIC_ variables are inlined at build time by Next.js.
 * They are available from Server Components and Client Components alike.
 */
export function createServerClient(): Db {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    );
  }
  return createClient<Database>(url, key);
}
