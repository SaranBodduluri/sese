import { useState, useEffect, useCallback, useRef } from 'react';
import { OnboardingState, OnboardingData } from './types';
import { logger } from '@/lib/logger';

export function useVoiceOnboarding() {
  const [state, setState] = useState<OnboardingState>('idle');
  const [data, setData] = useState<OnboardingData>({
    studentName: '',
    courseSubject: '',
    studyGoal: '',
    chapterLabel: '',
  });
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (typeof window !== 'undefined') {
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
          headers: {
            'Content-Type': 'application/json',
          },
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
          if (onEnd) onEnd();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (onEnd) onEnd();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          logger.info('Audio play interrupted by user');
          return;
        }
        logger.error('TTS playback failed, falling back to browser TTS', { error: String(error) });
        
        // Fallback to browser TTS
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => 
            v.name.includes('Google UK English Female') || 
            v.name.includes('Samantha') || 
            v.name.includes('Daniel')
          ) || voices[0];
          
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          
          utterance.onend = () => {
            if (onEnd) onEnd();
          };
          
          utterance.onerror = () => {
            if (onEnd) onEnd();
          };
          
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => {
            if (onEnd) onEnd();
          }, 1000);
        }
      }
    } else {
      // Fallback if not in browser
      setTimeout(() => {
        if (onEnd) onEnd();
      }, 1000);
    }
  }, []);

  const listen = useCallback((onResult: (text: string) => void) => {
    setTranscript('');
    if (recognitionRef.current) {
      let finalTranscript = '';
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        finalTranscript = currentTranscript;
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        onResult(finalTranscript);
      };
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        logger.error('Could not start recognition', { error: String(e) });
        setTimeout(() => onResult(''), 3000);
      }
    } else {
      // Simulate listening if not supported
      setTimeout(() => onResult(''), 3000);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const advanceState = useCallback((currentState: OnboardingState, text: string) => {
    if (currentState === 'listeningForName') {
      if (text) setData(prev => ({ ...prev, studentName: text }));
      setState('askingSubject');
      speak("Nice to meet you. What course or subject are we studying today?", () => {
        setState('listeningForSubject');
      });
    } else if (currentState === 'listeningForSubject') {
      if (text) setData(prev => ({ ...prev, courseSubject: text }));
      setState('askingStudyGoal');
      speak("Got it. And what specifically are you practicing or focusing on?", () => {
        setState('listeningForStudyGoal');
      });
    } else if (currentState === 'listeningForStudyGoal') {
      if (text) setData(prev => ({ ...prev, studyGoal: text }));
      setState('askingOptionalContext');
      speak("Is there a specific chapter, assignment, or exam this is for? You can just say no if not.", () => {
        setState('listeningForOptionalContext');
      });
    } else if (currentState === 'listeningForOptionalContext') {
      if (text && !text.toLowerCase().includes('no')) {
        setData(prev => ({ ...prev, chapterLabel: text }));
      }
      setState('confirmingSession');
      speak("Great. I have everything I need. You can review your answers on the screen, and we can begin when you are ready.", () => {
        setState('ready');
      });
    }
  }, [speak]);

  // Handle automatic listening transitions
  useEffect(() => {
    if (state === 'listeningForName' || 
        state === 'listeningForSubject' || 
        state === 'listeningForStudyGoal' || 
        state === 'listeningForOptionalContext') {
      listen((text) => {
        advanceState(state, text);
      });
    }
  }, [state, listen, advanceState]);

  const startOnboarding = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    
    setState('greeting');
    speak("Hello. I am Sese, your personal study companion. I'm here to help you learn.", () => {
      setState('askingName');
      speak("What is your name?", () => {
        setState('listeningForName');
      });
    });
  }, [speak]);

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
    stopListening();
    setState('ready');
  }, [stopListening]);

  return {
    state,
    data,
    setData,
    transcript,
    startOnboarding,
    stopListening,
    skipToReady,
    advanceState
  };
}
