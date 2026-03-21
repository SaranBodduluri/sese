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

import React, { useState, useCallback } from 'react';
import { InputSource } from './InputSource';
import { TeachingBoard } from './TeachingBoard';
import { TutorWorkspace } from './TutorWorkspace';
import { VoiceOnboardingModal } from '../onboarding/VoiceOnboardingModal';
import { TutorFeedback, AnalyzeRequest, SessionProfile } from '@/lib/ai/types';
import { logger } from '@/lib/logger';
import { logSessionGroundingReady } from '@/lib/session/sessionContext';

export function WorkspaceLayout() {
  const [sessionProfile, setSessionProfile] = useState<SessionProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFrame, setLastFrame] = useState<{ base64Image: string; mimeType: string } | null>(null);

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

      const payload: AnalyzeRequest = { base64Image, mimeType, sessionProfile: sessionProfile || undefined };
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      logger.error('Analysis failed', { error: errorMessage });
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionProfile]);

  /**
   * Re-runs Gemini on the last frame from the tutor panel (hint / explain / check).
   */
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
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl shrink-0">
          <p className="font-medium">Oops! Something went wrong.</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* 1. Input Source (Left Panel) */}
        <div className="w-full lg:w-64 shrink-0 h-64 lg:h-full">
          <InputSource onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </div>

        {/* 2. Teaching Board (Main Center Panel) */}
        <div className="flex-1 min-w-0 h-[50vh] lg:h-full">
          <TeachingBoard feedback={feedback} isAnalyzing={isAnalyzing} sessionProfile={sessionProfile} />
        </div>

        {/* 3. Tutor Workspace (Right Panel) */}
        <div className="w-full lg:w-80 shrink-0 h-[50vh] lg:h-full">
          <TutorWorkspace
            feedback={feedback}
            isAnalyzing={isAnalyzing}
            sessionProfile={sessionProfile}
            hasLastFrame={!!lastFrame}
            onTutorAction={handleTutorAction}
          />
        </div>
      </div>
    </div>
  );
}
