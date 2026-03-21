/**
 * @file analyze-board.ts
 * @description Prompt module for analyzing the student's handwritten work.
 * 
 * Use Cases:
 * - Instructs the model on what to look for in the provided image.
 * - Maps to detectedSubject, whatISaw, currentStep, correctnessAssessment, likelyMistakes, confidence, needsClarification.
 */

export const getAnalyzeBoardPrompt = () => `
Analyze the provided image of the student's handwritten work.

1. Identify the subject (detectedSubject).
2. Describe exactly what you see in the image (whatISaw).
3. Determine the current step the student is on (currentStep).
4. Assess the correctness of the current step (correctnessAssessment: 'correct', 'incorrect', 'partial', or 'unclear').
5. Identify any likely mistakes or misconceptions (likelyMistakes).
6. Provide a confidence score between 0 and 1 for your analysis (confidence).
7. Indicate if the image is too blurry or unclear to read (needsClarification).
`;
