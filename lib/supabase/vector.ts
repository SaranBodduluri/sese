/**
 * @file vector.ts
 * @description pgvector serialization for Supabase/PostgREST inserts.
 */

/** Format a float array as a Postgres `vector` literal for PostgREST JSON bodies. */
export function toPgVectorString(values: number[]): string {
  return `[${values.map((v) => (Number.isFinite(v) ? v : 0)).join(',')}]`;
}
