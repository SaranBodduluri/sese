'use client';

/**
 * @file SolutionProgressBar.tsx
 * @description Thin progress indicator for multi-step problems (model-driven + light heuristic fallback).
 */

import React from 'react';
import type { TutorFeedback } from '@/lib/ai/types';

function deriveProgress(feedback: TutorFeedback): { pct: number; label: string } | null {
  const sp = feedback.solutionProgress;
  const stepCount = feedback.boardContent?.orderedSteps?.length ?? 0;

  if (sp && typeof sp.totalSteps === 'number' && sp.totalSteps > 0) {
    const total = Math.max(1, Math.round(sp.totalSteps));
    const rawIdx = typeof sp.currentStepIndex === 'number' ? sp.currentStepIndex : 0;
    const idx = Math.min(Math.max(0, Math.floor(rawIdx)), Math.max(0, total - 1));
    const pct = Math.min(100, Math.max(0, ((idx + 1) / total) * 100));
    return { pct, label: `Step ${idx + 1} of ${total}` };
  }

  if (stepCount >= 2) {
    let pct = 42;
    if (feedback.correctnessAssessment === 'correct') pct = 90;
    else if (feedback.correctnessAssessment === 'partial') pct = 58;
    else if (feedback.correctnessAssessment === 'incorrect') pct = 28;
    else pct = 40;
    return { pct, label: `${stepCount} steps · momentum` };
  }

  return null;
}

export function SolutionProgressBar({ feedback }: { feedback: TutorFeedback }) {
  const data = deriveProgress(feedback);
  if (!data) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">Solution progress</span>
        <span className="text-[10px] font-medium text-[#6B7280] tabular-nums">{data.label}</span>
      </div>
      <div
        className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden border border-[#E5E7EB]/80"
        role="progressbar"
        aria-valuenow={Math.round(data.pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={data.label}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FBBF24] transition-[width] duration-500 ease-out"
          style={{ width: `${data.pct}%` }}
        />
      </div>
    </div>
  );
}
