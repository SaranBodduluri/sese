/**
 * @file admin.ts
 * @description Server-only Supabase client with the service role key (bypasses RLS). Never import from client components.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = config.supabase.url;
  const key = config.supabase.serviceRoleKey;
  if (!url || !key) {
    return null;
  }
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabase.url && config.supabase.serviceRoleKey);
}
