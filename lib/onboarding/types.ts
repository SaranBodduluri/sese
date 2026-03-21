export type OnboardingState =
  | 'idle'
  | 'greeting'
  | 'askingName'
  | 'listeningForName'
  | 'askingSubject'
  | 'listeningForSubject'
  | 'askingStudyGoal'
  | 'listeningForStudyGoal'
  | 'askingOptionalContext'
  | 'listeningForOptionalContext'
  | 'confirmingSession'
  | 'ready'
  | 'error';

export interface OnboardingData {
  studentName: string;
  courseSubject: string;
  studyGoal: string;
  chapterLabel: string;
}
