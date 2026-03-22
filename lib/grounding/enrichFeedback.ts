/**
 * @file enrichFeedback.ts
 * @description Adds demo grounding metadata after Gemini returns structured feedback.
 * Combines uploaded material names (when present) with deterministic topic→reference mapping.
 */

import type {
  TutorFeedback,
  SessionProfile,
  SourceAttribution,
  GroundingMode,
  CourseMaterial,
} from '@/lib/ai/types';
import { DEMO_TOPIC_SOURCES } from './demoTopicSources';
import { logger } from '@/lib/logger';

/**
 * Maps uploaded material types to attribution source types for display.
 */
function materialTypeToSourceType(t: CourseMaterial['type']): SourceAttribution['sourceType'] {
  switch (t) {
    case 'pdf':
      return 'textbook';
    case 'notes':
      return 'notes';
    case 'slides':
      return 'slides';
    case 'formula_sheet':
      return 'concept';
    default:
      return 'notes';
  }
}

/**
 * Builds a search blob from session + model output for keyword matching.
 */
function buildTopicBlob(
  feedback: Pick<TutorFeedback, 'detectedSubject' | 'boardContent'>,
  session?: SessionProfile,
): string {
  const parts = [
    feedback.detectedSubject,
    feedback.boardContent?.title ?? '',
    session?.courseSubject ?? '',
    session?.studyGoal ?? '',
    session?.chapterLabel ?? '',
  ];
  return parts.join(' ').toLowerCase();
}

/**
 * Returns up to two deterministic attributions from keyword rules (order preserved, dedupe by concept).
 */
function matchDemoSources(blob: string): SourceAttribution[] {
  const seen = new Set<string>();
  const out: SourceAttribution[] = [];
  for (const rule of DEMO_TOPIC_SOURCES) {
    if (out.length >= 2) break;
    const hit = rule.keywords.some((k) => blob.includes(k.toLowerCase()));
    if (!hit) continue;
    const key = rule.attribution.conceptName + rule.attribution.sourceTitle;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...rule.attribution });
  }
  return out;
}

/**
 * Chips from files the user uploaded during onboarding (names only in analyze payload).
 */
function attributionsFromSessionMaterials(session: SessionProfile): SourceAttribution[] {
  return session.materials.slice(0, 2).map((m) => {
    const shortName = m.name.replace(/\.[^/.]+$/, '');
    return {
      conceptName: shortName,
      sourceTitle: m.name,
      section: 'Uploaded',
      sourceType: materialTypeToSourceType(m.type),
    };
  });
}

export interface VectorGroundingOverlay {
  /** True when top retrieved chunk similarity clears the configured threshold. */
  strongMatch: boolean;
  attributions: SourceAttribution[];
  /** Supabase + RPC ran (even if no rows passed the threshold). */
  retrievalAttempted: boolean;
}

/**
 * Merges Gemini JSON with grounding metadata for UI + demo credibility.
 * Optional `vector` applies real textbook retrieval chips over demo/topic mapping.
 */
export function enrichFeedbackWithDemoGrounding(
  feedback: Omit<TutorFeedback, 'groundingMode' | 'sourceAttributions'>,
  sessionProfile?: SessionProfile,
  vector?: VectorGroundingOverlay | null,
): TutorFeedback {
  const blob = buildTopicBlob(feedback, sessionProfile);

  let groundingMode: GroundingMode = 'general';
  let sourceAttributions: SourceAttribution[] = [];

  if (sessionProfile && sessionProfile.materials.length > 0) {
    groundingMode = 'course_materials';
    sourceAttributions = attributionsFromSessionMaterials(sessionProfile);
    const extra = matchDemoSources(blob).filter(
      (e) => !sourceAttributions.some((s) => s.conceptName === e.conceptName),
    );
    sourceAttributions = [...sourceAttributions, ...extra].slice(0, 3);
  } else {
    const matched = matchDemoSources(blob);
    if (matched.length > 0) {
      groundingMode = 'topic_reference';
      sourceAttributions = matched;
    } else {
      groundingMode = 'general';
      sourceAttributions = [];
    }
  }

  if (vector?.retrievalAttempted) {
    if (vector.strongMatch && vector.attributions.length > 0) {
      groundingMode = 'vector_retrieval';
      sourceAttributions = vector.attributions.slice(0, 4);
    } else {
      groundingMode = 'general_reasoning';
      sourceAttributions = [];
    }
  }

  logger.info('Demo grounding enriched', { groundingMode, chipCount: sourceAttributions.length });

  let grounded = feedback.grounded;
  if (vector?.strongMatch) {
    grounded = true;
  } else if (vector?.retrievalAttempted && !vector.strongMatch) {
    grounded = false;
  }

  return {
    ...feedback,
    groundingMode,
    sourceAttributions,
    grounded,
  };
}
