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
  features: {
    enableVoice: false, // Disabled for MVP
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
