/**
 * @file route.ts
 * @description Ingest a PDF textbook: extract → chunk → embed → Supabase `sese_document_*` tables.
 * Prefer `multipart/form-data` with field `file` (avoids huge JSON base64 and body limits).
 */

import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { embedTexts } from '@/lib/ai/embeddings';
import { chunkPlainText, guessSectionLabel } from '@/lib/grounding/chunkText';
import { extractTextFromPdfBuffer } from '@/lib/grounding/extractPdfText';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { toPgVectorString } from '@/lib/supabase/vector';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface JsonIngestBody {
  fileName: string;
  title?: string;
  base64Pdf: string;
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        {
          error:
            'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server, then run supabase/migrations/001_sese_grounding.sql.',
          code: 'SUPABASE_NOT_CONFIGURED',
        },
        { status: 503 },
      );
    }

    let buffer: Buffer;
    let fileName: string;
    let title: string | undefined;

    const ct = request.headers.get('content-type') || '';

    if (ct.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof Blob) || file.size === 0) {
        return NextResponse.json({ error: 'Missing PDF file (use multipart field "file").' }, { status: 400 });
      }
      const titleField = form.get('title');
      title = typeof titleField === 'string' && titleField.trim() ? titleField.trim() : undefined;
      fileName = file instanceof File && file.name ? file.name : 'upload.pdf';
      const ab = await file.arrayBuffer();
      buffer = Buffer.from(ab);
    } else {
      const body = (await request.json()) as JsonIngestBody;
      if (!body.base64Pdf || !body.fileName) {
        return NextResponse.json({ error: 'base64Pdf and fileName are required for JSON uploads.' }, { status: 400 });
      }
      buffer = Buffer.from(body.base64Pdf, 'base64');
      fileName = body.fileName;
      title = body.title?.trim();
    }

    if (buffer.length < 5) {
      return NextResponse.json({ error: 'File is empty or too small.' }, { status: 400 });
    }

    const text = await extractTextFromPdfBuffer(buffer);
    const chunks = chunkPlainText(text);
    if (chunks.length === 0) {
      return NextResponse.json(
        {
          error:
            'No extractable text from this PDF. Try a text-based PDF (not only scanned images), or ensure the file is not encrypted.',
        },
        { status: 400 },
      );
    }

    const docTitle = title || fileName.replace(/\.[^/.]+$/, '');

    const { data: doc, error: docErr } = await supabase
      .from('sese_documents')
      .insert({ title: docTitle, file_name: fileName })
      .select('id')
      .single();

    if (docErr || !doc?.id) {
      logger.error('Ingest: document insert failed', { message: docErr?.message, hint: docErr?.hint });
      return NextResponse.json(
        {
          error:
            docErr?.message ??
            'Could not insert document. Confirm tables `sese_documents` / `sese_document_chunks` exist (run the migration SQL).',
          code: 'DOCUMENT_INSERT_FAILED',
        },
        { status: 500 },
      );
    }

    const documentId = doc.id as string;

    const batchSize = 8;
    let inserted = 0;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const slice = chunks.slice(i, i + batchSize);
      const vectors = await embedTexts(slice);
      const rows = slice.map((content, j) => {
        const idx = i + j;
        const vec = vectors[j];
        if (!vec || vec.length !== config.ai.embeddingDimension) {
          throw new Error(
            `Embedding dimension mismatch: expected ${config.ai.embeddingDimension}, got ${vec?.length ?? 0}`,
          );
        }
        return {
          document_id: documentId,
          chunk_index: idx,
          section_label: guessSectionLabel(content) ?? null,
          content,
          embedding: toPgVectorString(vec),
        };
      });

      const { error: insErr } = await supabase.from('sese_document_chunks').insert(rows);
      if (insErr) {
        logger.error('Ingest: chunk insert failed', { message: insErr.message, details: insErr.details });
        await supabase.from('sese_documents').delete().eq('id', documentId);
        return NextResponse.json(
          {
            error:
              insErr.message ||
              'Could not store embeddings. Check pgvector column `embedding vector(768)` and migration SQL.',
            code: 'CHUNK_INSERT_FAILED',
          },
          { status: 500 },
        );
      }
      inserted += rows.length;
    }

    logger.info('Document ingested', { documentId, title: docTitle, chunks: inserted, model: config.ai.embeddingModel });

    return NextResponse.json({
      ok: true,
      documentId,
      title: docTitle,
      chunkCount: inserted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Ingest route error', { error: message });
    return NextResponse.json({ error: message, code: 'INGEST_EXCEPTION' }, { status: 500 });
  }
}
