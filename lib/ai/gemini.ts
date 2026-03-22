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

import { GoogleGenAI } from '@google/genai';
import { config } from '../config';
import { logger } from '../logger';
import { TutorFeedback, SessionProfile } from './types';
import { getSystemPrompt } from './prompts/system';
import { getAnalyzeBoardPrompt } from './prompts/analyze-board';
import { getGenerateTeachingBoardPrompt } from './prompts/generate-teaching-board';
import { getNextHintPrompt } from './prompts/next-hint';
import { getExplainConceptPrompt } from './prompts/explain-concept';
import { getTutorSpeechPrompt } from './prompts/tutor-speech';
import { getGroundingSpeechHint } from './prompts/grounding-speech';
import { enrichFeedbackWithDemoGrounding } from '../grounding/enrichFeedback';
import { getTutorFeedbackResponseSchema } from './schemas/tutorFeedbackResponseSchema';

/** Server-only Gemini client; API key must never be bundled to the browser. */
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY or GOOGLE_API_KEY (server environment).');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

/**
 * Analyzes the student's handwritten work and provides structured feedback.
 * 
 * @param base64Image - The base64 encoded image of the student's work.
 * @param mimeType - The MIME type of the image (e.g., 'image/jpeg').
 * @param sessionProfile - Optional session profile containing student info and course materials.
 * @returns A promise that resolves to a TutorFeedback object.
 */
export async function analyzeStudentWork(base64Image: string, mimeType: string, sessionProfile?: SessionProfile): Promise<TutorFeedback> {
  logger.info('Starting analysis of student work (Server-side)');
  const ai = getGeminiClient();

  try {
    let sessionContext = '';
    if (sessionProfile) {
      sessionContext = `
        --- SESSION CONTEXT ---
        Student Name: ${sessionProfile.studentName}
        Course/Subject: ${sessionProfile.courseSubject}
        Study Goal: ${sessionProfile.studyGoal}
        ${sessionProfile.chapterLabel ? `Chapter/Assignment: ${sessionProfile.chapterLabel}` : ''}
        
        --- COURSE MATERIALS ---
        ${sessionProfile.materials.length > 0 ? 
          sessionProfile.materials.map(m => `Source: ${m.name} (${m.type})\nContent:\n${m.contentBase64 ? Buffer.from(m.contentBase64, 'base64').toString('utf-8') : 'No content provided'}`).join('\n\n') 
          : 'No course materials provided.'}
        
        INSTRUCTIONS FOR GROUNDING:
        - Greet the student by name in your tutorSpeech.
        - Reference their study goal if relevant.
        - If course materials are provided, you MUST use them to ground your explanations, hints, and concept reminders.
        - If you use the materials, set "grounded" to true and provide "citations".
        - If the materials do not contain relevant information, or if no materials are provided, set "grounded" to false and leave "citations" empty. Do NOT invent fake citations.
      `;
    }

    const promptParts = [
      {
        text: `
          ${sessionContext}

          ${getAnalyzeBoardPrompt()}
          
          ${getNextHintPrompt()}
          
          ${getExplainConceptPrompt()}
          
          ${getTutorSpeechPrompt()}

          ${getGroundingSpeechHint()}

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
        responseSchema: getTutorFeedbackResponseSchema()
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('No text returned from Gemini API');
    }

    const raw = JSON.parse(outputText) as Omit<TutorFeedback, 'groundingMode' | 'sourceAttributions'>;
    const feedback = enrichFeedbackWithDemoGrounding(raw, sessionProfile);

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
