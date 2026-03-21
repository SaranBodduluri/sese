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
The board is a digital blackboard where Sese writes clean explanations.

Provide:
1. title: A short title for the board content.
2. equations: A list of clean, corrected, or next-step equations. Format them nicely.
3. orderedSteps: A list of logical steps to solve the problem.
4. conceptNotes: A brief, clear summary of the core concept being taught.
5. correctionHighlights: A list of short notes highlighting specific mistakes (if any). Leave empty if correct.
6. finalConclusion: A summary or final message displayed on the board.
`;
