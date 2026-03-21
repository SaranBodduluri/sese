# Logging Strategy

Sese implements a clean, serious logging layer to ensure observability during development, demos, and production.

## Centralized Logger
All logging is routed through `/lib/logger.ts`. Do not use `console.log` directly in the application code.

## What is Logged
- **Major UI Actions**: e.g., "User requested analysis of image", "User toggled mute".
- **AI Requests**: When the server starts an analysis request.
- **Model Metadata**: The model name used for the request.
- **Structured Outputs**: The parsed JSON response from the AI (useful for debugging prompt effectiveness).
- **TTS Actions**: When onboarding voice starts, when TTS requests are sent, and when audio is replayed.
- **TTS Metadata**: Provider, model, and voice ID used for speech generation.
- **Errors**: API failures, parsing errors, missing environment variables, or TTS fallback events.

## What is Intentionally Excluded
- **Raw Binary Payloads**: Base64 image strings and audio buffers are NEVER logged. They clutter the console and make debugging impossible.
- **Secrets**: API keys (Gemini, ElevenLabs) are never logged.
- **Sensitive Personal Content**: Beyond basic metadata, full transcripts are not logged to the server console.

## How to Debug
1. Check the server console for `[AI]` logs to see the exact structured JSON returned by Gemini.
2. If the UI is not updating, check the browser console for `[ERROR]` logs related to the API route fetch.
3. If the model output is poor, review the `[AI]` log to see which specific prompt module (e.g., `hint` vs `concept`) needs tuning.
