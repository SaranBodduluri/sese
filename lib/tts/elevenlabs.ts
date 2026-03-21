/**
 * @file elevenlabs.ts
 * @description Dedicated service layer for interacting with the ElevenLabs TTS API.
 * 
 * Use Cases:
 * - Convert plain text to speech using the configured ElevenLabs voice and model.
 * - Handle API errors gracefully and return playable audio buffers.
 * 
 * Architecture:
 * - This module should only be called from server-side routes to protect the API key.
 * - It abstracts the raw fetch logic away from the UI and API handlers.
 */

import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

export interface TTSRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
}

export interface TTSResponse {
  audioBuffer?: ArrayBuffer;
  error?: string;
}

/**
 * Generates speech from text using ElevenLabs API.
 * 
 * @param request The TTS request containing the text to speak.
 * @returns A promise that resolves to a TTSResponse containing the audio buffer or an error.
 */
export async function generateSpeech(request: TTSRequest): Promise<TTSResponse> {
  if (!config.elevenlabs.ttsEnabled) {
    return { error: 'TTS is disabled in configuration.' };
  }

  const apiKey = process.env.ELEVENLABS_API_KEY || 'sk_144e4d0d9498d070035fe38465a17368da1573720b79030d';
  if (!apiKey) {
    logger.error('ElevenLabs API key is missing.');
    return { error: 'ElevenLabs API key is missing.' };
  }

  const voiceId = request.voiceId || config.elevenlabs.voiceId;
  const modelId = request.modelId || config.elevenlabs.modelId;

  if (config.elevenlabs.voiceDebugLogging) {
    logger.info('Starting TTS request', { voiceId, modelId, textLength: request.text.length });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: modelId,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('ElevenLabs API error', { status: response.status, error: errorText });
      return { error: `ElevenLabs API error: ${response.status} ${response.statusText}` };
    }

    const audioBuffer = await response.arrayBuffer();
    
    if (config.elevenlabs.voiceDebugLogging) {
      logger.info('TTS request successful', { byteLength: audioBuffer.byteLength });
    }

    return { audioBuffer };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during TTS generation';
    logger.error('TTS generation failed', { error: errorMessage });
    return { error: errorMessage };
  }
}
