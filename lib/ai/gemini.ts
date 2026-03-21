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
import { TutorFeedback, SessionProfile } from './types';
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
 * @param sessionProfile - Optional session profile containing student info and course materials.
 * @returns A promise that resolves to a TutorFeedback object.
 */
export async function analyzeStudentWork(base64Image: string, mimeType: string, sessionProfile?: SessionProfile): Promise<TutorFeedback> {
  logger.info('Starting analysis of student work (Server-side)');

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
            grounded: { type: Type.BOOLEAN, description: "Whether the response is grounded in the provided course materials." },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sourceTitle: { type: Type.STRING, description: "The title of the source material." },
                  sourceType: { type: Type.STRING, enum: ['pdf', 'notes', 'slides', 'formula_sheet'], description: "The type of the source material." },
                  pageReference: { type: Type.STRING, description: "The page number or section reference." },
                  quotedOrReferencedSection: { type: Type.STRING, description: "A short quote or description of the referenced section." },
                  confidence: { type: Type.NUMBER, description: "Confidence in the citation between 0 and 1." }
                },
                required: ['sourceTitle', 'sourceType', 'quotedOrReferencedSection', 'confidence']
              },
              description: "Citations from the provided course materials."
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
                orderedSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Logical steps to solve the problem."
                },
                conceptNotes: {
                  type: Type.STRING,
                  description: "A brief, clear summary of the core concept being taught."
                },
                correctionHighlights: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Short notes highlighting specific mistakes."
                },
                finalConclusion: {
                  type: Type.STRING,
                  description: "A summary or final message displayed on the board."
                }
              },
              required: ['title', 'equations', 'orderedSteps', 'conceptNotes', 'correctionHighlights', 'finalConclusion']
            }
          },
          required: [
            'detectedSubject', 'whatISaw', 'currentStep', 'correctnessAssessment', 
            'likelyMistakes', 'nextHint', 'conceptReminder', 'followUpQuestion', 
            'confidence', 'needsClarification', 'tutorSpeech', 'mascotState', 'boardContent', 'grounded', 'citations'
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
