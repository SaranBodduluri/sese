'use client';

/**
 * @file WorkspaceLayout.tsx
 * @description Coordinates the state between the 3 surfaces: InputSource, TeachingBoard, and TutorWorkspace.
 * 
 * Use Cases:
 * - Manages the analysis loading state.
 * - Stores the current feedback from the AI.
 * - Calls the Gemini API via the analyzeStudentWork function.
 */

import React, { useState } from 'react';
import { InputSource } from './InputSource';
import { TeachingBoard } from './TeachingBoard';
import { TutorWorkspace } from './TutorWorkspace';
import { TutorFeedback, AnalyzeRequest } from '@/lib/ai/types';
import { logger } from '@/lib/logger';

export function WorkspaceLayout() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (base64Image: string, mimeType: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      logger.info('User requested analysis of image');
      
      const payload: AnalyzeRequest = { base64Image, mimeType };
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
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
  };

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
          <TeachingBoard feedback={feedback} isAnalyzing={isAnalyzing} />
        </div>

        {/* 3. Tutor Workspace (Right Panel) */}
        <div className="w-full lg:w-80 shrink-0 h-[50vh] lg:h-full">
          <TutorWorkspace feedback={feedback} isAnalyzing={isAnalyzing} />
        </div>
      </div>
    </div>
  );
}
