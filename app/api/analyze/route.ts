/**
 * @file route.ts
 * @description Server-side API route for analyzing student work.
 * 
 * Use Cases:
 * - Accepts base64 encoded images of the student's work.
 * - Routes the request to Gemini AI via `analyzeStudentWork`.
 * - Returns structured JSON containing tutor feedback, equations, and speech.
 */

import { NextResponse } from 'next/server';
import { analyzeStudentWork } from '@/lib/ai/gemini';
import { AnalyzeRequest } from '@/lib/ai/types';
import { logger } from '@/lib/logger';

/** Allow long Gemini multimodal calls when deployed (e.g. Vercel). */
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body: AnalyzeRequest = await request.json();
    
    if (!body.base64Image || !body.mimeType) {
      return NextResponse.json(
        { error: 'Missing base64Image or mimeType in request body' },
        { status: 400 }
      );
    }

    logger.info('Received analysis request via API route');
    const feedback = await analyzeStudentWork(body.base64Image, body.mimeType, body.sessionProfile);
    
    return NextResponse.json(feedback);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('API Route Error', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
