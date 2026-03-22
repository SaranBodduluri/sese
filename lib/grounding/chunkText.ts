/**
 * @file chunkText.ts
 * @description Simple paragraph-aware chunking for textbook PDFs (demo-oriented).
 */

import { config } from '@/lib/config';

export function chunkPlainText(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!cleaned) return [];

  const max = config.grounding.chunkChars;
  const overlap = config.grounding.chunkOverlap;
  const chunks: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    let end = Math.min(cleaned.length, i + max);
    if (end < cleaned.length) {
      const slice = cleaned.slice(i, end);
      const lastBreak = Math.max(slice.lastIndexOf('\n\n'), slice.lastIndexOf('. '));
      if (lastBreak > 200) {
        end = i + lastBreak + 1;
      }
    }
    const piece = cleaned.slice(i, end).trim();
    if (piece.length > 40) {
      chunks.push(piece);
    }
    i = Math.max(end - overlap, i + 1);
  }
  return chunks;
}

/** Heuristic section label from first line if it looks like a heading. */
export function guessSectionLabel(chunk: string): string | undefined {
  const first = chunk.split('\n')[0]?.trim() ?? '';
  if (first.length > 8 && first.length < 80 && /^[0-9A-Z]/.test(first)) {
    return first;
  }
  return undefined;
}
