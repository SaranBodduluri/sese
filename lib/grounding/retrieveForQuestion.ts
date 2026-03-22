/**
 * @file retrieveForQuestion.ts
 * @description Semantic retrieval of textbook chunks via Supabase pgvector RPC.
 */

import type { SourceAttribution } from '@/lib/ai/types';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { embedTexts } from '@/lib/ai/embeddings';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface RetrievedChunkRow {
  id: string;
  document_id: string;
  title: string;
  content: string;
  section_label: string | null;
  chunk_index: number;
  similarity: number;
}

export interface RetrievalResult {
  attempted: boolean;
  strongMatch: boolean;
  topSimilarity: number;
  rows: RetrievedChunkRow[];
  attributions: SourceAttribution[];
}

function rowsToAttributions(rows: RetrievedChunkRow[]): SourceAttribution[] {
  return rows.map((r) => ({
    conceptName: r.content.slice(0, 72).trim() + (r.content.length > 72 ? '…' : ''),
    sourceTitle: r.title,
    section: r.section_label?.trim() || `Chunk ${r.chunk_index + 1}`,
    sourceType: 'textbook' as const,
    excerpt: r.content.slice(0, 280) + (r.content.length > 280 ? '…' : ''),
  }));
}

export async function retrieveChunksForQuestion(question: string): Promise<RetrievalResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { attempted: false, strongMatch: false, topSimilarity: 0, rows: [], attributions: [] };
  }

  const [embedding] = await embedTexts([question]);
  const { data, error } = await supabase.rpc('match_sese_document_chunks', {
    query_embedding: embedding,
    match_threshold: 0.01,
    match_count: config.grounding.matchCount,
  });

  if (error) {
    logger.error('retrieveChunksForQuestion RPC failed', { message: error.message });
    return { attempted: true, strongMatch: false, topSimilarity: 0, rows: [], attributions: [] };
  }

  const rows = (data ?? []) as RetrievedChunkRow[];
  const topSimilarity = rows[0]?.similarity ?? 0;
  const strongMatch = rows.length > 0 && topSimilarity >= config.grounding.strongMatchThreshold;

  return {
    attempted: true,
    strongMatch,
    topSimilarity,
    rows,
    attributions: rowsToAttributions(rows),
  };
}
