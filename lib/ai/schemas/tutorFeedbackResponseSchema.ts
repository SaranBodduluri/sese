/**
 * @file tutorFeedbackResponseSchema.ts
 * @description Shared Gemini JSON schema for `TutorFeedback` (analyze + freeform tutor chat).
 */

import { Type } from '@google/genai';

const baseProperties = {
      detectedSubject: { type: Type.STRING, description: 'The subject of the problem.' },
      whatISaw: { type: Type.STRING, description: "What you observe in the student's work or question context." },
      currentStep: { type: Type.STRING, description: 'The current step the student is on.' },
      correctnessAssessment: {
        type: Type.STRING,
        enum: ['correct', 'incorrect', 'partial', 'unclear'],
        description: 'Whether the current step is correct.',
      },
      likelyMistakes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Likely mistakes or misconceptions.' },
      nextHint: { type: Type.STRING, description: 'A small, actionable hint for the next step.' },
      conceptReminder: { type: Type.STRING, description: 'A brief reminder of the underlying concept.' },
      followUpQuestion: { type: Type.STRING, description: 'A guiding question for the student.' },
      confidence: { type: Type.NUMBER, description: 'Confidence score between 0 and 1.' },
      needsClarification: { type: Type.BOOLEAN, description: 'Whether the image is too blurry or unclear.' },
      tutorSpeech: {
        type: Type.STRING,
        description:
          'Hyper-energetic female tutor voice script for TTS: genuinely hyped, fast-paced pep talk energy, celebrate progress, explain meaning and next steps in plain language. Do NOT read equations symbol-by-symbol. ~3–7 punchy sentences.',
      },
      mascotState: {
        type: Type.STRING,
        description: 'The emotion of the panda.',
        enum: ['happy', 'thinking', 'encouraging', 'confused'],
      },
      grounded: { type: Type.BOOLEAN, description: 'Whether the response is grounded in retrieved textbook excerpts or course materials.' },
      citations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sourceTitle: { type: Type.STRING, description: 'The title of the source material.' },
            sourceType: {
              type: Type.STRING,
              enum: ['pdf', 'notes', 'slides', 'formula_sheet'],
              description: 'The type of the source material.',
            },
            pageReference: { type: Type.STRING, description: 'The page number or section reference if truly known; omit if unknown.' },
            quotedOrReferencedSection: { type: Type.STRING, description: 'A short quote or description of the referenced section.' },
            confidence: { type: Type.NUMBER, description: 'Confidence in the citation between 0 and 1.' },
          },
          required: ['sourceTitle', 'sourceType', 'quotedOrReferencedSection', 'confidence'],
        },
        description: 'Citations from retrieved textbook excerpts or course materials.',
      },
      boardContent: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'A short title for the board content.' },
          equations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Clean, corrected, or next-step equations to display on the board.',
          },
          orderedSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Logical steps to solve the problem.',
          },
          conceptNotes: {
            type: Type.STRING,
            description: 'A brief, clear summary of the core concept being taught.',
          },
          correctionHighlights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Short notes highlighting specific mistakes.',
          },
          finalConclusion: {
            type: Type.STRING,
            description: 'A summary or final message displayed on the board.',
          },
        },
        required: ['title', 'equations', 'orderedSteps', 'conceptNotes', 'correctionHighlights', 'finalConclusion'],
      },
      solutionProgress: {
        type: Type.OBJECT,
        description:
          'Optional. When the problem has multiple steps, where the student is now vs total steps (for UI progress). Omit if single-step or unclear.',
        properties: {
          currentStepIndex: {
            type: Type.NUMBER,
            description: '0-based index into boardContent.orderedSteps for the step the student is currently on.',
          },
          totalSteps: {
            type: Type.NUMBER,
            description: 'Total steps in the solution path; typically equals orderedSteps.length when multi-step.',
          },
        },
      },
};

/** Base structured output for multimodal analyze and tutor conversation. */
export function getTutorFeedbackResponseSchema(extraProperties?: Record<string, unknown>) {
  return {
    type: Type.OBJECT,
    properties: {
      ...baseProperties,
      ...(extraProperties ?? {}),
    },
    required: [
      'detectedSubject',
      'whatISaw',
      'currentStep',
      'correctnessAssessment',
      'likelyMistakes',
      'nextHint',
      'conceptReminder',
      'followUpQuestion',
      'confidence',
      'needsClarification',
      'tutorSpeech',
      'mascotState',
      'boardContent',
      'grounded',
      'citations',
    ],
  };
}
