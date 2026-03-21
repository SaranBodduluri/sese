# Prompt Architecture

Sese uses a modular prompt architecture to ensure the AI's response is structured, predictable, and easy to tune.

## Why Modular Prompts?
Instead of one giant prompt string, we split responsibilities into separate files. This makes it easier to:
- Test and tweak specific behaviors (e.g., how hints are generated) without breaking others (e.g., how equations are formatted).
- Maintain clean code.
- Map specific prompt instructions to specific fields in the structured JSON output.

## Prompt Modules

All prompt modules live in `/lib/ai/prompts/`.

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

## Structured Outputs
We use Gemini's `responseSchema` feature to enforce a strict JSON contract (`TutorFeedback`). This ensures the UI components always receive predictable data types (e.g., arrays for equations, enums for correctness) and prevents the app from crashing due to malformed text outputs.
