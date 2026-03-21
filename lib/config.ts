/**
 * @file config.ts
 * @description Centralized configuration for the Sese application.
 * Contains model names, feature flags, environment variable mappings, and timeouts.
 * 
 * Use Cases:
 * - Import this file instead of using process.env directly.
 * - Toggle features on/off for the MVP.
 * 
 * Assumptions:
 * - NEXT_PUBLIC_GEMINI_API_KEY is provided in the environment.
 */

export const config = {
  ai: {
    // We use gemini-3.1-pro-preview for complex reasoning and multimodal tasks
    modelName: 'gemini-3.1-pro-preview',
    temperature: 0.7,
    maxOutputTokens: 1024,
  },
  elevenlabs: {
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL', // Default to a warm, soft voice
    modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5',
    ttsEnabled: process.env.NEXT_PUBLIC_TTS_ENABLED !== 'false',
    autoPlayTutorAudio: process.env.NEXT_PUBLIC_AUTO_PLAY_TUTOR_AUDIO !== 'false',
    voiceDebugLogging: process.env.NEXT_PUBLIC_VOICE_DEBUG_LOGGING === 'true',
  },
  features: {
    enableVoice: true, // Enabled for ElevenLabs integration
    enableSessionHistory: true,
  },
  env: {
    geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  timeouts: {
    aiRequest: 15000, // 15 seconds
  }
};
