/**
 * @file analyzePayload.ts
 * @description Keeps /api/analyze request bodies small enough for dev servers and edge limits.
 *
 * Full PDF/image base64 from onboarding should not be re-posted on every frame analysis.
 */

import { SessionProfile } from '@/lib/ai/types';

/**
 * Returns a copy of the session profile safe to JSON-encode with the image payload.
 * Strips per-material binary content; names and types are kept for context strings on the server.
 */
export function sanitizeSessionProfileForAnalyze(profile: SessionProfile): SessionProfile {
  return {
    studentName: profile.studentName,
    courseSubject: profile.courseSubject,
    studyGoal: profile.studyGoal,
    chapterLabel: profile.chapterLabel,
    materials: profile.materials.map(({ id, name, type }) => ({
      id,
      name,
      type,
    })),
  };
}
