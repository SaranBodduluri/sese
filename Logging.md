# Logging Strategy

Sese implements a clean, serious logging layer to ensure observability during development, demos, and production.

## Centralized Logger
All logging is routed through `/lib/logger.ts`. Do not use `console.log` directly in the application code.

## What is Logged
- **Major UI Actions**: e.g., "User requested analysis of image".
- **AI Requests**: When the server starts an analysis request.
- **Model Metadata**: The model name used for the request.
- **Structured Outputs**: The parsed JSON response from the AI (useful for debugging prompt effectiveness).
- **Errors**: API failures, parsing errors, or missing environment variables.

## What is Intentionally Excluded
- **Raw Binary Payloads**: Base64 image strings are NEVER logged. They clutter the console and make debugging impossible.
- **Secrets**: API keys are never logged.

## How to Debug
1. Check the server console for `[AI]` logs to see the exact structured JSON returned by Gemini.
2. If the UI is not updating, check the browser console for `[ERROR]` logs related to the API route fetch.
3. If the model output is poor, review the `[AI]` log to see which specific prompt module (e.g., `hint` vs `concept`) needs tuning.
