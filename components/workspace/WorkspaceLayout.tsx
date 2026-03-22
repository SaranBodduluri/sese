'use client';

/**
 * @file WorkspaceLayout.tsx
 * @description Coordinates the state between the 3 surfaces: InputSource, TeachingBoard, and TutorWorkspace.
 *
 * Use Cases:
 * - Manages the analysis loading state.
 * - Stores the current feedback from the AI.
 * - Calls the Gemini API via the analyzeStudentWork function.
 * - Keeps the last captured frame so the tutor panel can re-run analysis without a new capture.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { InputSource } from './InputSource';
import { TeachingBoard } from './TeachingBoard';
import { TutorWorkspace } from './TutorWorkspace';
import { VoiceOnboardingModal } from '../onboarding/VoiceOnboardingModal';
import { TutorFeedback, AnalyzeRequest, SessionProfile, TutorChatRequest } from '@/lib/ai/types';
import { logger } from '@/lib/logger';
import { logSessionGroundingReady } from '@/lib/session/sessionContext';
import { sanitizeSessionProfileForAnalyze } from '@/lib/session/analyzePayload';

export function WorkspaceLayout() {
  const [sessionProfile, setSessionProfile] = useState<SessionProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFrame, setLastFrame] = useState<{ base64Image: string; mimeType: string } | null>(null);
  const [sessionKey, setSessionKey] = useState('');
  const [studyStreak, setStudyStreak] = useState(0);

  useEffect(() => {
    try {
      let k = localStorage.getItem('sese_session_key');
      if (!k) {
        k = crypto.randomUUID();
        localStorage.setItem('sese_session_key', k);
      }
      setSessionKey(k);
      const s = Number(localStorage.getItem('sese_study_streak') || '0');
      if (!Number.isNaN(s)) setStudyStreak(s);
    } catch {
      /* ignore */
    }
  }, []);

  const handleStartSession = (profile: SessionProfile) => {
    setSessionProfile(profile);
    logger.info('Session started', { profile });
    logSessionGroundingReady(profile);
  };

  const handleAnalyze = useCallback(async (base64Image: string, mimeType: string) => {
    setIsAnalyzing(true);
    setError(null);
    setLastFrame({ base64Image, mimeType });

    try {
      logger.info('User requested analysis of image');

      const payload: AnalyzeRequest = {
        base64Image,
        mimeType,
        sessionProfile: sessionProfile ? sanitizeSessionProfileForAnalyze(sessionProfile) : undefined,
      };
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 120_000);
      let response: Response;
      try {
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody && typeof errBody.error === 'string') {
            detail = errBody.error;
          }
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const result: TutorFeedback = await response.json();
      setFeedback(result);
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        errorMessage =
          'Could not reach the app server (network error). Confirm `npm run dev` is running and you are on the same URL (e.g. http://localhost:3000). Large uploads in onboarding can also break analysis — we now send a slim session payload; try again after a refresh.';
      }
      if (
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError')
      ) {
        errorMessage =
          'Analysis timed out after 2 minutes. Try again, or use a smaller OneNote window / lower resolution.';
      }
      setError(errorMessage);
      logger.error('Analysis failed', { error: errorMessage });
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionProfile]);

  /**
   * Re-runs Gemini on the last frame from the tutor panel (hint / explain / check).
   */
  const handleTutorFreeform = useCallback(
    async (message: string) => {
      setIsChatting(true);
      setError(null);
      try {
        logger.info('Tutor freeform message', { len: message.length });

        const payload: TutorChatRequest = {
          message,
          sessionProfile: sessionProfile ? sanitizeSessionProfileForAnalyze(sessionProfile) : undefined,
          sessionKey: sessionKey || undefined,
          lastFrameBase64: lastFrame?.base64Image,
          mimeType: lastFrame?.mimeType,
        };

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 120_000);
        let response: Response;
        try {
          response = await fetch('/api/tutor/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timeoutId);
        }

        if (!response.ok) {
          let detail = `HTTP ${response.status}`;
          try {
            const errBody = await response.json();
            if (errBody && typeof errBody.error === 'string') {
              detail = errBody.error;
            }
          } catch {
            /* ignore */
          }
          throw new Error(detail);
        }

        const result: TutorFeedback = await response.json();
        setFeedback(result);

        if (result.celebrationSuggested) {
          try {
            const next = (Number(localStorage.getItem('sese_study_streak') || '0') || 0) + 1;
            localStorage.setItem('sese_study_streak', String(next));
            setStudyStreak(next);
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        let errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          errorMessage =
            'Could not reach the tutor chat API. Confirm `npm run dev` is running and you are on the same URL.';
        }
        if (
          (err instanceof DOMException && err.name === 'AbortError') ||
          (err instanceof Error && err.name === 'AbortError')
        ) {
          errorMessage = 'Tutor chat timed out after 2 minutes. Try a shorter question.';
        }
        setError(errorMessage);
        logger.error('Tutor chat failed', { error: errorMessage });
      } finally {
        setIsChatting(false);
      }
    },
    [sessionProfile, sessionKey, lastFrame],
  );

  const handleTutorAction = useCallback(
    (action: 'hint' | 'explain' | 'check') => {
      if (!lastFrame) {
        const msg = 'Connect OneNote, then use “Analyze Latest Frame” in Live Input first.';
        setError(msg);
        logger.warn('Tutor action with no last frame', { action });
        return;
      }
      setError(null);
      logger.info('Tutor panel action', { action });
      void handleAnalyze(lastFrame.base64Image, lastFrame.mimeType);
    },
    [lastFrame, handleAnalyze],
  );

  if (!sessionProfile) {
    return <VoiceOnboardingModal onStartSession={handleStartSession} />;
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {error && (
        <div className="bg-white border border-[#FECACA] text-[#991B1B] px-4 py-3 rounded-xl shrink-0 shadow-sm">
          <p className="text-sm font-medium">Something went wrong</p>
          <p className="text-sm text-[#B91C1C]/90 mt-1 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-0">
        {/* 1. Input Source (Left Panel) */}
        <div className="w-full lg:w-56 shrink-0 h-64 lg:h-full">
          <InputSource onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </div>

        {/* 2. Teaching Board (Main Center Panel) */}
        <div className="flex-1 min-w-0 h-[50vh] lg:h-full">
          <TeachingBoard
            feedback={feedback}
            isAnalyzing={isAnalyzing || isChatting}
            sessionProfile={sessionProfile}
          />
        </div>

        {/* 3. Tutor Workspace (Right Panel) */}
        <div className="w-full lg:w-[22rem] shrink-0 h-[50vh] lg:h-full">
          <TutorWorkspace
            feedback={feedback}
            isAnalyzing={isAnalyzing}
            isChatting={isChatting}
            studyStreak={studyStreak}
            sessionProfile={sessionProfile}
            hasLastFrame={!!lastFrame}
            onTutorAction={handleTutorAction}
            onTutorMessage={handleTutorFreeform}
          />
        </div>
      </div>
    </div>
  );
}
