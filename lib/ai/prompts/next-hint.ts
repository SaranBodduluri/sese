/**
 * @file next-hint.ts
 * @description Prompt module for generating actionable hints.
 * 
 * Use Cases:
 * - Guides the model to create scaffolding for the student.
 * - Maps to nextHint.
 */

export const getNextHintPrompt = () => `
Provide a small, actionable hint for the next step (nextHint).
The hint should scaffold their learning without giving away the answer.
If they made a mistake, the hint should guide them to correct it.
If they are on the right track, the hint should prompt them for the next logical operation.
`;
