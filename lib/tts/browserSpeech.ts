/**
 * @file browserSpeech.ts
 * @description Companion-style browser TTS fallback when ElevenLabs is unavailable.
 */

import { logger } from '@/lib/logger';
import { selectEnglishFemaleVoice } from '@/lib/tts/selectBrowserVoice';

let utteranceRef: SpeechSynthesisUtterance | null = null;

/**
 * Speaks text with the browser engine; cancels any in-progress browser speech first.
 *
 * @param text - Plain text to speak (same script as tutorSpeech).
 * @param onEnd - Called when playback finishes or errors.
 * @returns True if speech was queued, false if API missing.
 */
export function speakWithBrowserTTS(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utteranceRef = utterance;
  utterance.rate = 1.08;
  utterance.pitch = 1.06;

  const voices = window.speechSynthesis.getVoices();
  const preferred = selectEnglishFemaleVoice(voices);
  if (preferred) utterance.voice = preferred;

  utterance.onend = () => {
    utteranceRef = null;
    onEnd?.();
  };
  utterance.onerror = () => {
    utteranceRef = null;
    logger.warn('Browser TTS utterance error');
    onEnd?.();
  };

  try {
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    logger.error('Browser TTS speak failed', { error: String(e) });
    onEnd?.();
    return false;
  }
}

/** Stops browser speech immediately. */
export function cancelBrowserTTS(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  utteranceRef = null;
}

/** Some browsers populate voices asynchronously. */
export function primeBrowserVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis?.getVoices();
  };
}
