/**
 * @file sessionContext.ts
 * @description Minimal session grounding summary for logging and future RAG hooks.
 * Keeps a single place for how we describe the active study session without inventing citations.
 */

import { SessionProfile } from '@/lib/ai/types';
import { logger } from '@/lib/logger';

/**
 * Builds a short plain-text summary of the session for logs and optional future grounding.
 *
 * @param profile - Session profile from onboarding (name, topic, optional materials).
 * @returns Multi-line summary string.
 */
export function buildSessionGroundingSummary(profile: SessionProfile): string {
  const lines = [
    `Student: ${profile.studentName}`,
    `Studying: ${profile.courseSubject}`,
    `Session focus: ${profile.studyGoal}`,
  ];
  if (profile.chapterLabel?.trim()) {
    lines.push(`Extra context: ${profile.chapterLabel}`);
  }
  if (profile.materials.length > 0) {
    lines.push(`Materials on file: ${profile.materials.map((m) => m.name).join(', ')}`);
  }
  return lines.join('\n');
}

/**
 * Logs that session context is ready for tutoring (placeholder for heavier indexing later).
 *
 * @param profile - Session profile from onboarding.
 */
export function logSessionGroundingReady(profile: SessionProfile): void {
  const summary = buildSessionGroundingSummary(profile);
  logger.info('Session grounding context prepared', { summary });
}
