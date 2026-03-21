/**
 * @file types.ts
 * @description State machine and data for voice-first onboarding (two questions only).
 */

export type OnboardingState =
  | 'idle'
  | 'greeting'
  | 'askingName'
  | 'listeningForName'
  | 'askingStudyTopic'
  | 'listeningForStudyTopic'
  | 'confirmingSession'
  | 'ready'
  | 'error';

/** Captures only the two onboarding answers; mapped to SessionProfile on continue. */
export interface OnboardingData {
  studentName: string;
  studyTopic: string;
}
