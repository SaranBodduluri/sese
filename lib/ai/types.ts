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

export interface BoardContent {
  title: string;
  equations: string[];
  steps: string[];
  annotations: string[];
  highlights: string[];
  conceptNotes: string;
  corrections: string[];
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
}

export interface AnalyzeRequest {
  base64Image: string;
  mimeType: string;
  sessionProfile?: SessionProfile;
}
