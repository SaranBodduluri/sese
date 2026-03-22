/**
 * @file tutorChat.ts
 * @description Freeform tutor conversation: retrieval + Gemini structured TutorFeedback (+ optional image).
 */

import { GoogleGenAI, Type } from '@google/genai';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import type { SessionProfile, TutorFeedback } from '@/lib/ai/types';
import { getSystemPrompt } from '@/lib/ai/prompts/system';
import { getTutorFreeformPrompt } from '@/lib/ai/prompts/tutor-freeform';
import { getTutorFeedbackResponseSchema } from '@/lib/ai/schemas/tutorFeedbackResponseSchema';
import { enrichFeedbackWithDemoGrounding, type VectorGroundingOverlay } from '@/lib/grounding/enrichFeedback';
import { retrieveChunksForQuestion } from '@/lib/grounding/retrieveForQuestion';

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

function buildRetrievalContext(rows: { title: string; content: string; section_label: string | null; similarity: number }[]): string {
  if (!rows.length) return '';
  return rows
    .map((r, i) => {
      const sec = r.section_label ? `Section hint: ${r.section_label}\n` : '';
      return `[#${i + 1}] ${sec}Title: ${r.title}\nSimilarity: ${r.similarity.toFixed(3)}\n---\n${r.content}\n`;
    })
    .join('\n');
}

export async function runTutorChat(params: {
  message: string;
  sessionProfile?: SessionProfile;
  lastFrameBase64?: string;
  mimeType?: string;
}): Promise<TutorFeedback> {
  const ai = getGeminiClient();
  const retrieval = await retrieveChunksForQuestion(params.message);
  const retrievalContext = buildRetrievalContext(retrieval.rows);

  let sessionContext = '';
  if (params.sessionProfile) {
    const sp = params.sessionProfile;
    sessionContext = `
--- SESSION CONTEXT ---
Student Name: ${sp.studentName}
Course/Subject: ${sp.courseSubject}
Study Goal: ${sp.studyGoal}
${sp.chapterLabel ? `Chapter/Assignment: ${sp.chapterLabel}` : ''}
`;
  }

  const textPrompt = `
${sessionContext}

${getTutorFreeformPrompt(retrievalContext)}

STUDENT MESSAGE:
${params.message}
`;

  const parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] = [{ text: textPrompt }];
  if (params.lastFrameBase64 && params.mimeType) {
    parts.push({
      inlineData: {
        data: params.lastFrameBase64,
        mimeType: params.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: config.ai.modelName,
    contents: { parts },
    config: {
      systemInstruction: getSystemPrompt(),
      temperature: config.ai.temperature,
      responseMimeType: 'application/json',
      responseSchema: getTutorFeedbackResponseSchema({
        celebrationSuggested: {
          type: Type.BOOLEAN,
          description:
            'True only when the student appears to have completed the problem or reached a final correct solution worth celebrating.',
        },
      }),
    },
  });

  const outputText = response.text;
  if (!outputText) {
    throw new Error('No text returned from Gemini API (tutor chat)');
  }

  const raw = JSON.parse(outputText) as Omit<TutorFeedback, 'groundingMode' | 'sourceAttributions'>;

  const vector: VectorGroundingOverlay | null = retrieval.attempted
    ? {
        strongMatch: retrieval.strongMatch,
        attributions: retrieval.attributions,
        retrievalAttempted: true,
      }
    : null;

  const feedback = enrichFeedbackWithDemoGrounding(raw, params.sessionProfile, vector);

  logger.info('runTutorChat', {
    model: config.ai.modelName,
    retrieval: {
      attempted: retrieval.attempted,
      strongMatch: retrieval.strongMatch,
      topSimilarity: retrieval.topSimilarity,
    },
    groundingMode: feedback.groundingMode,
  });

  return feedback;
}
