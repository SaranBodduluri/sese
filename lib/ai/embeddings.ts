/**
 * @file embeddings.ts
 * @description Text embeddings via Gemini (same API key as generateContent).
 */

import { GoogleGenAI } from '@google/genai';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY or GOOGLE_API_KEY (server environment).');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/**
 * Returns embedding vectors in the same order as `texts` (Gemini batch embed when possible).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const ai = getClient();
  const trimmed = texts.map((t) => t.trim().slice(0, 8000));

  const embedConfig = {
    outputDimensionality: config.ai.embeddingDimension,
  };

  try {
    const response = await ai.models.embedContent({
      model: config.ai.embeddingModel,
      contents: trimmed,
      config: embedConfig,
    });
    const list = response.embeddings ?? [];
    if (list.length === trimmed.length) {
      const out: number[][] = [];
      for (const emb of list) {
        const values = emb.values;
        if (!values || values.length === 0) {
          logger.error('embedTexts: empty embedding from Gemini');
          throw new Error('Embedding API returned no vector');
        }
        out.push(values);
      }
      return out;
    }
    logger.warn('embedTexts: batch size mismatch; falling back to sequential', {
      got: list.length,
      expected: trimmed.length,
    });
  } catch (e) {
    logger.warn('embedTexts: batch embed failed; falling back to sequential', {
      error: e instanceof Error ? e.message : String(e),
    });
  }

  const out: number[][] = [];
  for (const t of trimmed) {
    const response = await ai.models.embedContent({
      model: config.ai.embeddingModel,
      contents: t,
      config: embedConfig,
    });
    const values = response.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      logger.error('embedTexts: empty embedding from Gemini');
      throw new Error('Embedding API returned no vector');
    }
    out.push(values);
  }
  return out;
}
