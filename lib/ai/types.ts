/**
 * @file types.ts
 * @description Type definitions for the AI module.
 * 
 * Use Cases:
 * - Defines the structured output expected from the Gemini API.
 * - Used by the UI to render the tutor's feedback and teaching board.
 */

export interface CourseMaterial {
  id: string;
  name: string;
  type: 'pdf' | 'notes' | 'slides' | 'formula_sheet';
  contentBase64?: string; // For passing to the backend
  mimeType?: string;
}

export interface SessionProfile {
  studentName: string;
  courseSubject: string;
  studyGoal: string;
  chapterLabel?: string;
  materials: CourseMaterial[];
}

export interface Citation {
  sourceTitle: string;
  sourceType: 'pdf' | 'notes' | 'slides' | 'formula_sheet';
  pageReference?: string;
  quotedOrReferencedSection: string;
  confidence: number;
}

/** How explanations are grounded for UI (demo + vector retrieval + general). */
export type GroundingMode =
  | 'course_materials'
  | 'topic_reference'
  | 'general'
  | 'vector_retrieval'
  | 'general_reasoning';

/**
 * Premium demo attribution for chips (no fake page numbers; sections are broad).
 */
export interface SourceAttribution {
  conceptName: string;
  sourceTitle: string;
  section: string;
  sourceType: 'textbook' | 'notes' | 'slides' | 'concept';
  /** Short excerpt shown in grounding UI when available (e.g. vector chunk). */
  excerpt?: string;
}

export interface BoardContent {
  title: string;
  equations: string[];
  orderedSteps: string[];
  conceptNotes: string;
  correctionHighlights: string[];
  finalConclusion: string;
}

/** Optional multi-step solution position for UI progress (from model). */
export interface SolutionProgress {
  /** 0-based index into `boardContent.orderedSteps` for the student’s current focus. */
  currentStepIndex: number;
  /** Total steps in the solution; usually matches `orderedSteps.length` when multi-step. */
  totalSteps: number;
}

export interface TutorFeedback {
  detectedSubject: string;
  whatISaw: string;
  currentStep: string;
  correctnessAssessment: 'correct' | 'incorrect' | 'partial' | 'unclear';
  likelyMistakes: string[];
  nextHint: string;
  conceptReminder: string;
  followUpQuestion: string;
  confidence: number;
  needsClarification: boolean;
  tutorSpeech: string;
  mascotState: 'happy' | 'thinking' | 'encouraging' | 'confused';
  boardContent: BoardContent;
  grounded: boolean;
  citations: Citation[];
  /** Set server-side after Gemini parse for demo UI. */
  groundingMode: GroundingMode;
  /** Deterministic + material-based chips for credibility. */
  sourceAttributions: SourceAttribution[];
  /** Chat-only: model suggests a tasteful celebration (problem solved / big win). */
  celebrationSuggested?: boolean;
  /** Where the learner is along a multi-step solution (drives progress bar when set). */
  solutionProgress?: SolutionProgress;
}

export interface AnalyzeRequest {
  base64Image: string;
  mimeType: string;
  sessionProfile?: SessionProfile;
}

/** Freeform tutor chat (text/voice) — optional last frame for multimodal follow-ups. */
export interface TutorChatRequest {
  message: string;
  sessionProfile?: SessionProfile;
  /** Stable client id for persistence (localStorage). */
  sessionKey?: string;
  lastFrameBase64?: string;
  mimeType?: string;
}
