# Sese - AI Study Companion

Sese is a real-time multimodal AI study companion. It observes a student's live handwritten work (e.g., in Microsoft OneNote) and provides guided hints, visual explanations on a digital blackboard, and encouragement through a panda companion persona.

## Features

- **Voice-first onboarding**: Conversational setup for name, study topic, and optional course files.
- **Three-column workspace**: Input Source · Teaching Board · Tutor Panel (unchanged layout).
- **Freeform tutor chat**: Text + browser speech recognition at the bottom of the Tutor Panel; responses update the board and play ElevenLabs audio when enabled.
- **Quick actions**: Hint / Explain / Check step still use the same multimodal `/api/analyze` path as frame capture.
- **Textbook grounding (real RAG)**: Upload a PDF in Input → chunked → embedded with Gemini → stored in Supabase pgvector → tutor chat retrieves by similarity and shows source chips.
- **Premium voice output**: ElevenLabs TTS (default energetic female “Domi”; tuning via env).
- **Lightweight delight**: Confetti + streak counter on milestone completions suggested by the model.
- **Optional session persistence**: When Supabase is configured, tutor turns are stored (`sese_study_sessions`, messages, board snapshots).

## Project structure

- `/app/api/analyze` — multimodal frame analysis (Gemini structured JSON).
- `/app/api/tutor/chat` — freeform tutor conversation + retrieval + optional last-frame image.
- `/app/api/documents/ingest` — PDF ingest (Node runtime): extract → chunk → embed → Supabase.
- `/app/api/tts` — ElevenLabs TTS (server-side key).
- `/components/tutor/TutorChatInput.tsx` — tutor text + mic.
- `/lib/ai` — Gemini, shared `TutorFeedback` schema, `tutorChat.ts`, embeddings.
- `/lib/grounding` — chunking, PDF text, retrieval, demo enrichment.
- `/lib/supabase/admin.ts` — service-role client (server only).
- `/lib/persistence/studySession.ts` — optional chat persistence.
- `/lib/config.ts` — models, voice, Supabase, grounding thresholds.
- `/supabase/migrations/001_sese_grounding.sql` — pgvector + tables + `match_sese_document_chunks` RPC.

## Setup & local run

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables** (`.env.local`)

   **Required (core AI + voice)**

   ```bash
   GEMINI_API_KEY=your_gemini_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   ```

   **Optional — Supabase (textbook RAG + persistence)**

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   Run the **entire** SQL file `supabase/migrations/001_sese_grounding.sql` in the Supabase **SQL Editor** (New query → paste → Run). That creates `sese_documents`, `sese_document_chunks`, the match function, and reloads the API schema cache.

   If you see **“Could not find the table 'public.sese_documents' in the schema cache”**, the migration was not applied to this project, or PostgREST has not reloaded: run the SQL file again (it is idempotent where possible), wait a few seconds, then retry upload. The file ends with `NOTIFY pgrst, 'reload schema';` to refresh the cache.

   **Optional — tuning**

   ```bash
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_EMBEDDING_MODEL=gemini-embedding-001
   ELEVENLABS_VOICE_ID=AZnzlk1XvdvUeBnXmlld
   ELEVENLABS_MODEL_ID=eleven_flash_v2_5
   ELEVENLABS_TTS_STABILITY=0.32
   ELEVENLABS_TTS_STYLE=0.72
   ELEVENLABS_TTS_SPEED=1.1
   SESE_GROUNDING_STRONG_THRESHOLD=0.38
   SESE_GROUNDING_MATCH_COUNT=5
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## How to test the new flows

1. **Analyze + quick actions**: Connect a window → Analyze frame → Hint / Explain / Check step (unchanged).
2. **Tutor chat**: Type or use the mic in the Tutor Panel footer → board + tutor speech update → audio if TTS enabled.
3. **Textbook grounding**: With Supabase env + migration applied, upload a PDF under Input → wait for “Indexed … chunks” → ask a related freeform question → look for “Textbook match” chips and the **Grounded** badge on the board when retrieval is strong.
4. **Celebration**: When the model sets `celebrationSuggested` (e.g., problem completed), confetti fires and the streak increments locally.

## Deployment (Vercel)

- Next.js App Router with server routes for AI and TTS — compatible with Vercel serverless functions.
- Long-running routes use `maxDuration` where needed (`/api/analyze`, `/api/tutor/chat`, `/api/documents/ingest`).
- Set the same env vars in the Vercel project; keep **service role** keys server-only (never `NEXT_PUBLIC_*`).
- **Better Auth**: Not bundled yet; Postgres session storage can be added later with `DATABASE_URL` (e.g., Supabase Postgres) — see [Design.md](./Design.md).

## Documentation

- [Design Architecture](./Design.md)
- [Prompt Architecture](./PromptArchitecture.md)
- [Logging Strategy](./Logging.md)
- [Demo Script](./DemoScript.md)
