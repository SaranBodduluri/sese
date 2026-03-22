/**
 * @file route.ts
 * @description Freeform tutor chat: retrieval + Gemini + optional multimodal last frame.
 */

import { NextResponse } from 'next/server';
import type { TutorChatRequest } from '@/lib/ai/types';
import { runTutorChat } from '@/lib/ai/tutorChat';
import { logger } from '@/lib/logger';
import { persistTutorTurn } from '@/lib/persistence/studySession';

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TutorChatRequest;
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const trimmed = body.message.trim();
    if (trimmed.length < 1) {
      return NextResponse.json({ error: 'message is empty' }, { status: 400 });
    }

    logger.info('Tutor chat request', { len: trimmed.length, hasFrame: !!body.lastFrameBase64 });

    const feedback = await runTutorChat({
      message: trimmed,
      sessionProfile: body.sessionProfile,
      lastFrameBase64: body.lastFrameBase64,
      mimeType: body.mimeType,
    });

    if (body.sessionKey) {
      void persistTutorTurn({
        sessionKey: body.sessionKey,
        userMessage: trimmed,
        feedback,
        sessionProfile: body.sessionProfile,
      });
    }

    return NextResponse.json(feedback);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Tutor chat route error', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
