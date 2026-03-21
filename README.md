# Sese - AI Study Companion

Sese is a real-time multimodal AI study companion. It observes a student's live handwritten work (e.g., in Microsoft OneNote) and provides guided hints, visual explanations on a digital blackboard, and encouragement through a panda companion persona.

## Features
- **Voice-First Onboarding**: A conversational setup flow where Sese speaks and listens to collect student context and course materials.
- **Premium Voice Output**: Uses ElevenLabs TTS for warm, natural, and engaging spoken feedback.
- **Live Window Capture**: Connects to a live window stream to observe the student's work in real-time.
- **Grounded AI Reasoning**: Uses uploaded course materials to provide accurate, context-aware hints and explanations with citations.
- **Multi-Surface UI**: Input Source, Teaching Board, and Tutor Panel.
- **Structured Outputs**: Strictly typed JSON responses ensure reliable UI rendering.
- **Modular Prompts**: Easy to tune specific behaviors (hints, concepts, speech).

## Project Structure
- `/app`: Next.js App Router (UI and API routes).
  - `/api/analyze`: Server-side endpoint for AI orchestration.
  - `/api/tts`: Server-side endpoint for ElevenLabs Text-to-Speech.
- `/components/workspace`: UI components for the 3 main surfaces.
- `/lib/ai`: AI integration logic.
  - `/prompts`: Modular prompt definitions.
  - `gemini.ts`: Server-side Gemini client.
  - `types.ts`: TypeScript interfaces and schemas.
- `/lib/tts`: ElevenLabs service layer.
- `/lib/config.ts`: Centralized configuration.
- `/lib/logger.ts`: Structured logging utility.

## Setup & Local Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file and add your API keys:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```
   *(Note: In the AI Studio environment, these are handled automatically).*

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation
- [Design Architecture](./Design.md)
- [Prompt Architecture](./PromptArchitecture.md)
- [Logging Strategy](./Logging.md)
- [Demo Script](./DemoScript.md)
