# Design Architecture

## Product Overview
Sese is a real-time multimodal AI study companion. It acts as an intelligent agent that observes a student's live handwritten work (e.g., in Microsoft OneNote) and provides guided hints, visual explanations, and encouragement. It is not a static file-upload tool; it is a continuous observer and tutor.

## Multi-Surface Product Model
The app is built around 3 conceptual surfaces:
1. **Input Surface (Live Observation)**: A live window capture feed (via `getDisplayMedia`) that streams the student's active workspace (like OneNote). Sese extracts frames from this stream to "see" what the student is doing.
2. **Teaching Surface (Agent Output)**: The main visual center. A digital blackboard where Sese generates clean instructional content (equations, steps, concept notes, corrections) based on its reasoning.
3. **Companion Surface (Agent Persona)**: The tutor panel containing the Panda avatar, conversational feedback, and quick actions.

## Architecture
The app is built with Next.js (App Router), React, and Tailwind CSS. It uses `@google/genai` for multimodal AI reasoning.

### Module Boundaries
- **`/app`**: Next.js routing and main page assembly.
- **`/app/api/analyze`**: Server-side API route that orchestrates the AI call, keeping secrets and complex logic off the client.
- **`/components/workspace`**: Domain-specific UI components for the 3 surfaces.
  - `InputSource.tsx`: Manages the live `MediaStream` and frame extraction.
- **`/lib/ai`**: AI integration, including the Gemini client, types, and modular prompts.
- **`/lib/config.ts`**: Centralized configuration (feature flags, model names).
- **`/lib/logger.ts`**: Centralized logging utility for traceability.

## Data Flow
1. `InputSource` connects to a live window stream (e.g., OneNote).
2. User clicks "Analyze Latest Frame" (or a future auto-trigger fires).
3. `InputSource` extracts a base64 JPEG from the hidden `<canvas>`.
4. Image is passed to the parent `WorkspaceLayout` state.
5. `WorkspaceLayout` calls the `/api/analyze` route.
6. The server route calls `analyzeWork` from `/lib/ai/gemini.ts`.
7. `analyzeWork` uses prompts from `/lib/ai/prompts` and calls the Gemini API with a strict JSON schema.
8. The structured response (`TutorFeedback` including `boardContent`) is returned to the client.
9. `TeachingBoard` renders the generated equations and concepts. `TutorWorkspace` renders the panda mascot state and chat feedback.

## Current Limitations (MVP)
- Frame extraction is triggered manually via "Analyze Latest Frame" rather than a continuous background loop.
- No persistent database (session state is in React state).
- No user authentication.

## Roadmap
- **Auto Frame Analysis**: Implement a background loop to sample frames every N seconds and only trigger analysis if significant changes are detected.
- **Real-Time Voice**: Integrate the Gemini Live API for low-latency voice interaction.
- **Persistent Memory**: Add user profiles and session history.
