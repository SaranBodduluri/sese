/**
 * @file tutor-speech.ts
 * @description Prompt module for generating the tutor's spoken/text response.
 * 
 * Use Cases:
 * - Combines encouragement and guidance into a conversational response.
 * - Maps to tutorSpeech, followUpQuestion, and mascotState.
 */

export const getTutorSpeechPrompt = () => `
Generate the conversational response from Sese the Panda.

1. tutorSpeech: Verbally explain what is currently shown on the teaching board, guide the user to the next step, and add warmth/personality. Keep it conversational.
2. followUpQuestion: A guiding question to prompt the student to think about the next step.
3. mascotState: The emotion Sese should display ('happy', 'thinking', 'encouraging', or 'confused').
`;
