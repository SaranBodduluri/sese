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
 * - GEMINI_API_KEY (or GOOGLE_API_KEY) is set server-side only — never expose keys via NEXT_PUBLIC_*.
 */

export const config = {
  ai: {
    /** Override with GEMINI_MODEL (e.g. gemini-2.5-pro). Default is current Flash for new API users. */
    modelName: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    /**
     * Gemini embedding model for textbook chunking + retrieval.
     * Use `gemini-embedding-001` (Google AI / Gemini API). Legacy `text-embedding-004` often 404s on embedContent v1beta.
     */
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    embeddingDimension: 768,
    temperature: 0.7,
    maxOutputTokens: 1024,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    /** True when the public URL is set (client can show upload UI; server still needs service role). */
    hasPublicUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  },
  grounding: {
    /** Cosine similarity (0–1) minimum for “strong” textbook grounding. */
    strongMatchThreshold: Number(process.env.SESE_GROUNDING_STRONG_THRESHOLD ?? '0.38'),
    matchCount: Number(process.env.SESE_GROUNDING_MATCH_COUNT ?? '5'),
    chunkChars: Number(process.env.SESE_CHUNK_CHARS ?? '900'),
    chunkOverlap: Number(process.env.SESE_CHUNK_OVERLAP ?? '120'),
  },
  elevenlabs: {
    /**
     * Default: ElevenLabs premade "Domi" — US female, bright and high-energy (good for hyping students up).
     * Override with ELEVENLABS_VOICE_ID from your Voice Library.
     */
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'AZnzlk1XvdvUeBnXmlld',
    /** Flash is tuned for low latency; feels snappier for upbeat tutoring. */
    modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5',
    ttsEnabled: process.env.NEXT_PUBLIC_TTS_ENABLED !== 'false',
    autoPlayTutorAudio: process.env.NEXT_PUBLIC_AUTO_PLAY_TUTOR_AUDIO !== 'false',
    /** When ElevenLabs fails, use browser speechSynthesis for tutor lines (same script). */
    browserTtsFallback: process.env.NEXT_PUBLIC_BROWSER_TTS_FALLBACK !== 'false',
    voiceDebugLogging: process.env.NEXT_PUBLIC_VOICE_DEBUG_LOGGING === 'true',
    /**
     * Expressive, upbeat: lower stability + higher style = more animated; faster speed keeps momentum.
     * Tune with ELEVENLABS_TTS_* env vars.
     */
    ttsStability: Number(process.env.ELEVENLABS_TTS_STABILITY ?? '0.32'),
    ttsSimilarityBoost: Number(process.env.ELEVENLABS_TTS_SIMILARITY_BOOST ?? '0.78'),
    ttsStyle: Number(process.env.ELEVENLABS_TTS_STYLE ?? '0.72'),
    /** Above 1.0 = faster, more energetic delivery. */
    ttsSpeed: Number(process.env.ELEVENLABS_TTS_SPEED ?? '1.1'),
    /** Extra clarity for hype-y delivery; set ELEVENLABS_TTS_SPEAKER_BOOST=false to soften. */
    ttsUseSpeakerBoost: process.env.ELEVENLABS_TTS_SPEAKER_BOOST !== 'false',
  },
  features: {
    enableVoice: true, // Enabled for ElevenLabs integration
    enableSessionHistory: true,
  },
  env: {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  timeouts: {
    aiRequest: 15000, // 15 seconds
  }
};
