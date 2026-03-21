/**
 * @file explain-concept.ts
 * @description Prompt module for explaining underlying concepts.
 * 
 * Use Cases:
 * - Provides a brief reminder of the core principle if the student is stuck.
 * - Maps to conceptReminder.
 */

export const getExplainConceptPrompt = () => `
Provide a brief reminder of the underlying mathematical or scientific concept relevant to the current step (conceptReminder).
Keep it simple and focused on the core principle.
`;
