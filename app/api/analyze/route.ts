import { NextResponse } from 'next/server';
import { analyzeStudentWork } from '@/lib/ai/gemini';
import { AnalyzeRequest } from '@/lib/ai/types';
import { logger } from '@/lib/logger';

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
    logger.error('API Route Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
