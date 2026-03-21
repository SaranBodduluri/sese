# Design Architecture

## Product Overview
Sese is a real-time multimodal AI study companion. It acts as an intelligent agent that observes a student's live handwritten work (e.g., in Microsoft OneNote) and provides guided hints, visual explanations, and encouragement. It is not a static file-upload tool; it is a continuous observer and tutor.

## Multi-Surface Product Model
The app is built around 3 conceptual surfaces, preceded by an onboarding flow:
0. **Voice Onboarding Surface**: A conversational modal that collects the student's name, study goal, and course materials (PDFs, notes) via voice (TTS/STT) to ground the session.
1. **Input Surface (Live Observation)**: A live window capture feed (via `getDisplayMedia`) that streams the student's active workspace (like OneNote). Sese extracts frames from this stream to "see" what the student is doing.
2. **Teaching Surface (Agent Output)**: The main visual center. A digital blackboard where Sese generates clean instructional content (equations, steps, concept notes, corrections) based on its reasoning.
3. **Companion Surface (Agent Persona)**: The tutor panel containing the Panda avatar, conversational feedback, citations from course materials, and quick actions.

## Architecture
The app is built with Next.js (App Router), React, and Tailwind CSS. It uses `@google/genai` for multimodal AI reasoning and ElevenLabs for Text-to-Speech (TTS).

### Provider Split
- **Gemini**: Handles all multimodal reasoning, tutoring logic, grounding, and structured JSON output generation.
- **ElevenLabs**: Handles all voice output (TTS) to make the companion feel alive and premium.

### Module Boundaries
- **`/app`**: Next.js routing and main page assembly.
- **`/app/api/analyze`**: Server-side API route that orchestrates the Gemini AI call.
- **`/app/api/tts`**: Server-side API route that orchestrates the ElevenLabs TTS call, protecting the API key.
- **`/components/onboarding`**: UI components for the voice-first session setup flow (`VoiceOnboardingModal.tsx`).
- **`/components/workspace`**: Domain-specific UI components for the 3 surfaces.
  - `InputSource.tsx`: Manages the live `MediaStream` and frame extraction.
  - `TutorWorkspace.tsx`: Displays the mascot, feedback, grounded citations, and handles audio playback.
- **`/lib/ai`**: Gemini integration, types, and modular prompts.
- **`/lib/tts`**: ElevenLabs service layer (`elevenlabs.ts`).
- **`/lib/onboarding`**: Voice onboarding state machine and Web Speech API hooks (`useVoiceOnboarding.ts`).
- **`/lib/config.ts`**: Centralized configuration (feature flags, model names, ElevenLabs settings).
- **`/lib/logger.ts`**: Centralized logging utility for traceability.

## Data Flow
1. User completes the `VoiceOnboardingModal`, providing their name, goal, and optional course materials via voice or text fallback. The voice prompts use the `/api/tts` route.
2. `WorkspaceLayout` stores this `SessionProfile` in state.
3. `InputSource` connects to a live window stream (e.g., OneNote).
4. User clicks "Analyze Latest Frame" (or a future auto-trigger fires).
5. `InputSource` extracts a base64 JPEG from the hidden `<canvas>`.
6. Image and `SessionProfile` are passed to the parent `WorkspaceLayout` state.
7. `WorkspaceLayout` calls the `/api/analyze` route.
8. The server route calls `analyzeWork` from `/lib/ai/gemini.ts`.
9. `analyzeWork` injects the session context and materials into the prompt, and calls the Gemini API with a strict JSON schema.
10. The structured response (`TutorFeedback` including `boardContent`, `tutorSpeech`, and `citations`) is returned to the client.
11. `TeachingBoard` renders the generated equations and concepts.
12. `TutorWorkspace` renders the panda mascot state, chat feedback, and any source citations. It also automatically calls `/api/tts` with the `tutorSpeech` text and plays the resulting audio.

## Current Limitations (MVP)
- Frame extraction is triggered manually via "Analyze Latest Frame" rather than a continuous background loop.
- No persistent database (session state is in React state).
- No user authentication.

## Roadmap
- **Auto Frame Analysis**: Implement a background loop to sample frames every N seconds and only trigger analysis if significant changes are detected.
- **Real-Time Voice**: Integrate the Gemini Live API for low-latency voice interaction.
- **Persistent Memory**: Add user profiles and session history.
