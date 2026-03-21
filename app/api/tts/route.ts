/**
 * @file route.ts
 * @description Server-side API route for Text-to-Speech (TTS) generation.
 * 
 * Use Cases:
 * - Accepts text from the client and returns an audio stream.
 * - Protects the ElevenLabs API key by keeping it server-side.
 * - Handles errors gracefully so the client can fall back to text-only mode.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/tts/elevenlabs';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      logger.warn('Invalid TTS request: missing or invalid text');
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    logger.info('Received TTS request', { textLength: text.length });

    const result = await generateSpeech({ text });

    if (result.error) {
      logger.error('TTS generation failed in route', { error: result.error });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.audioBuffer) {
      logger.error('TTS generation returned no audio buffer');
      return NextResponse.json({ error: 'No audio generated' }, { status: 500 });
    }

    // Return the audio buffer as an audio/mpeg stream
    return new NextResponse(result.audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in TTS route';
    logger.error('TTS route error', { error: errorMessage });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
