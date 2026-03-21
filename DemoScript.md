# Demo Script

## Setup
1. Ensure the app is running locally (`npm run dev`).
2. Open Microsoft OneNote (or any drawing app) in a separate window.
3. Write a sample math problem in OneNote (e.g., solving `2x + 5 = 15`, with the first step written as `2x = 10`).
4. Have a sample PDF or text file ready (e.g., "Algebra Chapter 3 Notes").

## Flow

### 1. Introduction & Voice Onboarding
- "This is Sese, a multimodal AI agent that acts as a live study companion. It observes what the student is doing in real-time and provides guided hints, not just answers."
- **Action**: The app starts with a Voice Onboarding Modal. Sese speaks out loud, asking for the student's name, subject, and study goal. Answer the questions by voice (or use the text fallback). Upload the sample notes file. Click "Continue to Session".
- **Narration**: "Before starting, Sese uses a conversational voice flow to collect the student's context and course materials. This grounds the AI's reasoning in the actual textbook or notes the student is using, making it feel like a real companion from the very first interaction."

### 2. The Multi-Surface Interface
- Show the 3-surface interface: 
  - **Input Source** (left): Where Sese observes the student's live workspace.
  - **Teaching Board** (center): The main visual canvas where Sese generates explanations based on its reasoning.
  - **Tutor Panel** (right): Sese the Panda, providing conversational feedback and source citations.
- **Narration**: "Notice how Sese greets Alex by name and remembers the study goal."

### 3. Live Connection
- **Action**: Click "Connect OneNote Window" in the Input Source panel. Select the OneNote window from the browser's screen share dialog.
- **Narration**: "The student connects their OneNote window. Sese is now observing the live workspace."
- **Result**: The Input Source panel shows a live preview of the OneNote window with a pulsing green "CONNECTED" indicator.

### 4. First Interaction (Correct Step & Grounding)
- **Action**: Click "Analyze Latest Frame".
- **Narration**: "Sese samples a frame from the live stream and analyzes the handwriting."
- **Result**: 
  - **Tutor Panel**: Sese's state changes to "thinking", then "happy". The chat bubble says something encouraging and asks a follow-up question. The Quick Summary shows "Correct Step". Crucially, a "Sources" section appears, citing the uploaded notes (e.g., "Algebra Chapter 3 Notes, 'Isolating Variables'").
  - **Teaching Board**: The blackboard populates with clean equations showing the current step, logical steps, and a concept note about isolating variables.

### 5. Second Interaction (Mistake)
- **Action**: Write a deliberate mistake in the OneNote window (e.g., `x = 6`). Click "Analyze Latest Frame".
- **Narration**: "The student makes a mistake in the next step. Sese observes the change."
- **Result**: 
  - **Tutor Panel**: Sese's state changes to "encouraging" or "thinking". The chat bubble gently points out the error. The Quick Summary shows "Incorrect Step".
  - **Teaching Board**: The blackboard highlights the correction (e.g., "10 divided by 2 is 5, not 6") and provides a concept reminder about division.

### 6. Conclusion
- "Sese is a true multimodal agent. It reasons over live visual input, generates structured teaching content on its own board, provides emotional support, and grounds its answers in the student's actual course materials."
- Highlight the architecture: "The capture logic is modular, allowing us to easily upgrade to automatic background frame sampling in the future."
