# Sese - AI Study Companion

Sese is a real-time multimodal AI study companion. It observes a student's handwritten work and provides guided hints, visual explanations on a digital blackboard, and encouragement through a panda companion persona.

## Features
- **Multi-Surface UI**: Input Source, Teaching Board, and Tutor Panel.
- **Multimodal AI**: Uses Gemini to analyze images of handwritten work.
- **Structured Outputs**: Strictly typed JSON responses ensure reliable UI rendering.
- **Modular Prompts**: Easy to tune specific behaviors (hints, concepts, speech).

## Project Structure
- `/app`: Next.js App Router (UI and API routes).
  - `/api/analyze`: Server-side endpoint for AI orchestration.
- `/components/workspace`: UI components for the 3 main surfaces.
- `/lib/ai`: AI integration logic.
  - `/prompts`: Modular prompt definitions.
  - `gemini.ts`: Server-side Gemini client.
  - `types.ts`: TypeScript interfaces and schemas.
- `/lib/config.ts`: Centralized configuration.
- `/lib/logger.ts`: Structured logging utility.

## Setup & Local Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file and add your Gemini API key:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```
   *(Note: In the AI Studio environment, this is handled automatically).*

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
