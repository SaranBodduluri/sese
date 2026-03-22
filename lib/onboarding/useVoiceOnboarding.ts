/**
 * @file useVoiceOnboarding.ts
 * @description Voice-first onboarding: name + study topic, with Web Speech API and TTS.
 * Falls back to browser speechSynthesis if ElevenLabs fails; user can always type answers.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { OnboardingState, OnboardingData } from './types';
import { logger } from '@/lib/logger';
import { selectEnglishFemaleVoice } from '@/lib/tts/selectBrowserVoice';

const INITIAL_DATA: OnboardingData = {
  studentName: '',
  studyTopic: '',
};

/**
 * Hook that runs the two-question onboarding flow with optional speech recognition.
 */
export function useVoiceOnboarding() {
  const [state, setState] = useState<OnboardingState>('idle');
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [transcript, setTranscript] = useState('');

  const dataRef = useRef<OnboardingData>(INITIAL_DATA);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  /** Web Speech API; typings vary by browser — keep loose for compatibility. */
  const recognitionRef = useRef<{
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error: string }) => void) | null;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    type SRConstructor = new () => NonNullable<typeof recognitionRef.current>;
    const SR =
      (window as unknown as { SpeechRecognition?: SRConstructor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SRConstructor }).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
  }, []);

  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined') {
      setTimeout(() => onEnd?.(), 400);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.src = '';
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        onEnd?.();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        onEnd?.();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        logger.info('Onboarding TTS playback interrupted');
        return;
      }
      logger.error('Onboarding TTS failed, using browser speech', { error: String(error) });

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = selectEnglishFemaleVoice(voices);
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1.08;
        utterance.pitch = 1.06;
        utterance.onend = () => onEnd?.();
        utterance.onerror = () => onEnd?.();
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => onEnd?.(), 800);
      }
    }
  }, []);

  /**
   * Starts browser speech recognition and returns the final transcript via callback.
   */
  const listen = useCallback((onResult: (text: string) => void) => {
    setTranscript('');
    const recognition = recognitionRef.current;

    if (!recognition) {
      logger.warn('Speech recognition unavailable; user should use text fallback');
      setTimeout(() => onResult(''), 500);
      return;
    }

    let finalTranscript = '';

    recognition.onresult = (event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string } }> }) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      finalTranscript = current;
      setTranscript(current);
    };

    recognition.onerror = (event: { error: string }) => {
      logger.error('Speech recognition error during onboarding', { error: event.error });
    };

    recognition.onend = () => {
      onResult(finalTranscript.trim());
    };

    try {
      recognition.start();
    } catch (e) {
      logger.error('Could not start speech recognition', { error: String(e) });
      setTimeout(() => onResult(''), 500);
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopListening();
    };
  }, [stopListening]);

  useEffect(() => {
    if (state !== 'listeningForName' && state !== 'listeningForStudyTopic') {
      return;
    }

    let cancelled = false;
    logger.info('Onboarding: listening for answer', { state });

    listen((text) => {
      if (cancelled) return;

      if (state === 'listeningForName') {
        const merged: OnboardingData = {
          ...dataRef.current,
          studentName: text || dataRef.current.studentName,
        };
        dataRef.current = merged;
        setData(merged);
        if (text) {
          logger.info('Onboarding: captured name', { length: text.length });
        }
        setState('askingStudyTopic');
        speak("Nice to meet you. What are you studying today?", () => {
          if (!cancelled) setState('listeningForStudyTopic');
        });
        return;
      }

      if (state === 'listeningForStudyTopic') {
        const merged: OnboardingData = {
          ...dataRef.current,
          studyTopic: text || dataRef.current.studyTopic,
        };
        dataRef.current = merged;
        setData(merged);
        if (text) {
          logger.info('Onboarding: captured study topic', { length: text.length });
        }

        const displayName = merged.studentName.trim() || 'there';
        const displayTopic = merged.studyTopic.trim() || 'your topic';

        setState('confirmingSession');
        speak(
          `Great, ${displayName}. We'll focus on ${displayTopic}. Review your answers if you like, then continue when you're ready.`,
          () => {
            if (!cancelled) setState('ready');
          },
        );
      }
    });

    return () => {
      cancelled = true;
      stopListening();
    };
  }, [state, listen, speak, stopListening]);

  /**
   * Begins the scripted voice flow: greeting, name question, then listening.
   */
  const startOnboarding = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    logger.info('Onboarding: started');

    setState('greeting');
    speak("Hello. I'm Sese, your study companion.", () => {
      setState('askingName');
      speak("What's your name?", () => {
        setState('listeningForName');
      });
    });
  }, [speak]);

  /**
   * Skips remaining voice prompts; user can fill answers manually and continue.
   */
  const skipToReady = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = '';
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopListening();
    setState('ready');
    logger.info('Onboarding: skipped voice prompts');
  }, [stopListening]);

  return {
    state,
    data,
    setData,
    transcript,
    startOnboarding,
    stopListening,
    skipToReady,
  };
}
