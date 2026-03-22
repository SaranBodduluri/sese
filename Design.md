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
- **Gemini**: Handles all multimodal reasoning, tutoring logic, embeddings (textbook chunks), grounding, and structured JSON output generation.
- **ElevenLabs**: Handles all voice output (TTS) to make the companion feel alive and premium.
- **Supabase (optional)**: PostgreSQL + `pgvector` for document chunks and semantic retrieval; optional persistence for study sessions and tutor turns (service role, server-only).

### Module Boundaries
- **`/app`**: Next.js routing and main page assembly.
- **`/app/api/analyze`**: Server-side API route that orchestrates the Gemini AI call for captured frames.
- **`/app/api/tutor/chat`**: Freeform tutor conversation; may include last-frame image; runs retrieval when Supabase is configured.
- **`/app/api/documents/ingest`**: PDF → text → chunk → embed → Supabase (Node runtime).
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

### Frame analysis (existing)
1. User completes the `VoiceOnboardingModal`, providing their name, goal, and optional course materials via voice or text fallback. The voice prompts use the `/api/tts` route.
2. `WorkspaceLayout` stores this `SessionProfile` in state and assigns a stable `sessionKey` in `localStorage` for optional persistence.
3. `InputSource` can upload a **textbook PDF** for grounding (when Supabase is configured): `/api/documents/ingest` extracts text, chunks it, embeds with Gemini, and stores vectors in Supabase.
4. `InputSource` connects to a live window stream (e.g., OneNote).
5. User clicks **Analyze frame**.
6. `InputSource` extracts a base64 JPEG from the hidden `<canvas>`.
7. `WorkspaceLayout` calls `/api/analyze` with the image and a **slim** session profile (material names only — see `lib/session/analyzePayload.ts`).
8. The server calls `analyzeStudentWork` in `/lib/ai/gemini.ts`, then `enrichFeedbackWithDemoGrounding` for demo/topic chips.
9. `TutorFeedback` updates `TeachingBoard` and `TutorWorkspace`; `TutorWorkspace` requests `/api/tts` for `tutorSpeech` when enabled.

### Freeform tutor chat (new)
1. User types or dictates in `TutorChatInput` (Web Speech API where available).
2. `WorkspaceLayout` POSTs to `/api/tutor/chat` with the message, sanitized session profile, optional `sessionKey`, and optional last-frame snapshot for multimodal follow-ups.
3. Server runs `retrieveChunksForQuestion` (Supabase RPC) when configured; builds retrieval context; calls `runTutorChat` (Gemini with the shared `TutorFeedback` schema + optional `celebrationSuggested`).
4. `enrichFeedbackWithDemoGrounding` merges **vector** grounding when retrieval is strong; otherwise uses **general_reasoning** with honest UI copy when retrieval ran but did not pass the similarity threshold.
5. Optional: `persistTutorTurn` writes messages + board snapshot to Supabase.
6. Client plays ElevenLabs audio from updated `tutorSpeech` (same policy as analyze).

## Vercel-oriented notes
- Server routes keep provider keys off the client; TTS and Gemini only run on the server.
- `maxDuration` is set on long AI routes for hosted deployments.
- Future: AI Gateway–style provider routing can wrap `GoogleGenAI` construction in one module without UI changes.
- Future: **Better Auth** can sit alongside Supabase Postgres (`DATABASE_URL`) for real user accounts; sessions are currently anonymous + `sessionKey` until auth is added.

## Current limitations
- Frame extraction is manual (not a continuous background loop).
- **Better Auth** is not wired yet; persistence keys off `sessionKey` until accounts exist.

## Roadmap
- **Better Auth** + Postgres adapter for durable user identity (Supabase Postgres connection string).
- **Auto frame analysis**: sample frames when the workspace changes materially.
- **AI Gateway**: centralize provider routing for observability and retries.
