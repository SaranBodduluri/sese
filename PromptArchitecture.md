# Prompt Architecture

Sese uses a modular prompt architecture to ensure the AI's response is structured, predictable, and easy to tune.

## Why Modular Prompts?
Instead of one giant prompt string, we split responsibilities into separate files. This makes it easier to:
- Test and tweak specific behaviors (e.g., how hints are generated) without breaking others (e.g., how equations are formatted).
- Maintain clean code.
- Map specific prompt instructions to specific fields in the structured JSON output.

## Prompt Modules

All prompt modules live in `/lib/ai/prompts/`.

### 0. `tutor-freeform.ts` (freeform chat)
- **Responsibility**: Guides Gemini on conversational turns: when to trust retrieved textbook excerpts, when to fall back to general reasoning, how to update `boardContent`, and how to write `tutorSpeech` for spoken output (no symbol-by-symbol reading).
- **Maps to Schema**: Same `TutorFeedback` JSON as analyze, plus optional `celebrationSuggested` on chat routes.

### 1. `system.ts`
- **Responsibility**: Sets the core persona (Sese the Panda), tone, and unbreakable rules (e.g., "NEVER give the final answer directly").

### 2. `analyze-board.ts`
- **Responsibility**: Instructs the model on how to interpret the raw image input.
- **Maps to Schema**: `detectedSubject`, `whatISaw`, `currentStep`, `correctnessAssessment`, `likelyMistakes`, `confidence`, `needsClarification`.

### 3. `generate-teaching-board.ts`
- **Responsibility**: Instructs the model to generate visual instructional content for the main blackboard UI.
- **Maps to Schema**: `boardContent` (`title`, `equations`, `steps`, `annotations`, `highlights`, `conceptNotes`, `corrections`).

### 4. `next-hint.ts`
- **Responsibility**: Guides the model to create scaffolding for the student.
- **Maps to Schema**: `nextHint`.

### 5. `explain-concept.ts`
- **Responsibility**: Provides a brief reminder of the core principle if the student is stuck.
- **Maps to Schema**: `conceptReminder`.

### 6. `tutor-speech.ts`
- **Responsibility**: Generates the conversational response from Sese, combining encouragement and guidance.
- **Maps to Schema**: `tutorSpeech`, `followUpQuestion`, `mascotState`.

## Dynamic Context Injection
In `gemini.ts`, we dynamically inject the `SessionProfile` (collected via the voice onboarding flow) into the prompt before the modular parts. This includes:
- **Student Context**: Name, course, and study goal.
- **Course Materials**: Base64 encoded text/PDF content from uploaded materials.
- **Grounding Instructions**: Explicit instructions to use the materials, set `grounded: true`, and provide `citations` if the materials are used.

## Structured Outputs
We use Gemini's `responseSchema` feature to enforce a strict JSON contract (`TutorFeedback`). The schema object is centralized in `/lib/ai/schemas/tutorFeedbackResponseSchema.ts` so **analyze** and **tutor chat** stay aligned.

Freeform chat adds optional `celebrationSuggested` (not required in JSON) for milestone celebrations.

This ensures the UI components always receive predictable data types (e.g., arrays for equations, enums for correctness, arrays of citation objects) and prevents the app from crashing due to malformed text outputs.

## Retrieval context (textbook grounding)
For `/api/tutor/chat`, the server may inject retrieved chunk text (from Supabase `match_sese_document_chunks`) ahead of the modular freeform prompt. The model is instructed not to invent page numbers and to set `grounded` / `citations` honestly.
