/**
 * @file generate-teaching-board.ts
 * @description Prompt module for generating content for Sese's Teaching Board.
 *
 * Use Cases:
 * - Instructs the model to generate clean equations, structured text, ordered steps, concept notes, correction highlights, and final conclusion.
 * - Maps to the boardContent object.
 */

export const getGenerateTeachingBoardPrompt = () => `
Based on your analysis, generate content for Sese's Teaching Board.
The board is plain text (no canvas); keep it scannable and concise.

Provide:
1. title: Short headline for this turn (what you are helping them with).
2. equations: Key equations or expressions (corrected form or next line to write). Use standard math notation as plain text.
3. orderedSteps: Numbered-style steps they should follow next (small bites, not the full solution).
4. conceptNotes: One tight paragraph on the idea behind the step.
5. correctionHighlights: If something looks wrong in their work, short bullets; otherwise use an empty array.
6. finalConclusion: One-sentence wrap-up or encouragement.

Keep boardContent consistent with tutorSpeech so voice and board never contradict each other.
`;
