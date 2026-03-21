/**
 * @file gemini.ts
 * @description Server-side utility for interacting with the Gemini API.
 * 
 * Use Cases:
 * - Initializes the GoogleGenAI client.
 * - Assembles modular prompts and calls the model.
 * - Parses and returns the structured output.
 * 
 * Interactions:
 * - Uses config.ts for model settings.
 * - Uses logger.ts for traceability.
 * - Uses prompt modules for constructing the request.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config';
import { logger } from '../logger';
import { TutorFeedback } from './types';
import { getSystemPrompt } from './prompts/system';
import { getAnalyzeBoardPrompt } from './prompts/analyze-board';
import { getGenerateTeachingBoardPrompt } from './prompts/generate-teaching-board';
import { getNextHintPrompt } from './prompts/next-hint';
import { getExplainConceptPrompt } from './prompts/explain-concept';
import { getTutorSpeechPrompt } from './prompts/tutor-speech';

// Initialize the Gemini client
// Note: NEXT_PUBLIC_GEMINI_API_KEY must be set in the environment.
const ai = new GoogleGenAI({ apiKey: config.env.geminiApiKey });

/**
 * Analyzes the student's handwritten work and provides structured feedback.
 * 
 * @param base64Image - The base64 encoded image of the student's work.
 * @param mimeType - The MIME type of the image (e.g., 'image/jpeg').
 * @returns A promise that resolves to a TutorFeedback object.
 */
export async function analyzeStudentWork(base64Image: string, mimeType: string): Promise<TutorFeedback> {
  logger.info('Starting analysis of student work (Server-side)');

  try {
    const promptParts = [
      {
        text: `
          ${getAnalyzeBoardPrompt()}
          
          ${getNextHintPrompt()}
          
          ${getExplainConceptPrompt()}
          
          ${getTutorSpeechPrompt()}

          ${getGenerateTeachingBoardPrompt()}
        `
      },
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: config.ai.modelName,
      contents: { parts: promptParts },
      config: {
        systemInstruction: getSystemPrompt(),
        temperature: config.ai.temperature,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedSubject: { type: Type.STRING, description: "The subject of the problem." },
            whatISaw: { type: Type.STRING, description: "What you observe in the student's work." },
            currentStep: { type: Type.STRING, description: "The current step the student is on." },
            correctnessAssessment: { 
              type: Type.STRING, 
              enum: ['correct', 'incorrect', 'partial', 'unclear'],
              description: "Whether the current step is correct." 
            },
            likelyMistakes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Likely mistakes or misconceptions." },
            nextHint: { type: Type.STRING, description: "A small, actionable hint for the next step." },
            conceptReminder: { type: Type.STRING, description: "A brief reminder of the underlying concept." },
            followUpQuestion: { type: Type.STRING, description: "A guiding question for the student." },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1." },
            needsClarification: { type: Type.BOOLEAN, description: "Whether the image is too blurry or unclear." },
            tutorSpeech: { type: Type.STRING, description: "A short motivational message and feedback." },
            mascotState: {
              type: Type.STRING,
              description: "The emotion of the panda.",
              enum: ['happy', 'thinking', 'encouraging', 'confused']
            },
            boardContent: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "A short title for the board content." },
                equations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Clean, corrected, or next-step equations to display on the board."
                },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Logical steps to solve the problem."
                },
                annotations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Short notes to display alongside the equations."
                },
                highlights: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Specific parts of the equations or steps to highlight."
                },
                conceptNotes: {
                  type: Type.STRING,
                  description: "A brief, clear summary of the core concept being taught."
                },
                corrections: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Short notes highlighting specific mistakes."
                }
              },
              required: ['title', 'equations', 'steps', 'annotations', 'highlights', 'conceptNotes', 'corrections']
            }
          },
          required: [
            'detectedSubject', 'whatISaw', 'currentStep', 'correctnessAssessment', 
            'likelyMistakes', 'nextHint', 'conceptReminder', 'followUpQuestion', 
            'confidence', 'needsClarification', 'tutorSpeech', 'mascotState', 'boardContent'
          ]
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('No text returned from Gemini API');
    }

    const feedback: TutorFeedback = JSON.parse(outputText);
    
    logger.ai('analyzeStudentWork', {
      model: config.ai.modelName,
      output: feedback,
    });

    return feedback;

  } catch (error) {
    logger.ai('analyzeStudentWork', {
      model: config.ai.modelName,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
