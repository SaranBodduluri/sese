# Demo Script

## Setup
1. Ensure the app is running locally (`npm run dev`).
2. Open Microsoft OneNote (or any drawing app) in a separate window.
3. Write a sample math problem in OneNote (e.g., solving `2x + 5 = 15`, with the first step written as `2x = 10`).

## Flow

### 1. Introduction
- "This is Sese, a multimodal AI agent that acts as a live study companion. It observes what the student is doing in real-time and provides guided hints, not just answers."
- Show the 3-surface interface: 
  - **Input Source** (left): Where Sese observes the student's live workspace.
  - **Teaching Board** (center): The main visual canvas where Sese generates explanations based on its reasoning.
  - **Tutor Panel** (right): Sese the Panda, providing conversational feedback.

### 2. Live Connection
- **Action**: Click "Connect OneNote Window" in the Input Source panel. Select the OneNote window from the browser's screen share dialog.
- **Narration**: "The student connects their OneNote window. Sese is now observing the live workspace."
- **Result**: The Input Source panel shows a live preview of the OneNote window with a pulsing green "CONNECTED" indicator.

### 3. First Interaction (Correct Step)
- **Action**: Click "Analyze Latest Frame".
- **Narration**: "Sese samples a frame from the live stream and analyzes the handwriting."
- **Result**: 
  - **Tutor Panel**: Sese's state changes to "thinking", then "happy". The chat bubble says something encouraging and asks a follow-up question. The Quick Summary shows "Correct Step".
  - **Teaching Board**: The blackboard populates with clean equations showing the current step, logical steps, and a concept note about isolating variables.

### 4. Second Interaction (Mistake)
- **Action**: Write a deliberate mistake in the OneNote window (e.g., `x = 6`). Click "Analyze Latest Frame".
- **Narration**: "The student makes a mistake in the next step. Sese observes the change."
- **Result**: 
  - **Tutor Panel**: Sese's state changes to "encouraging" or "thinking". The chat bubble gently points out the error. The Quick Summary shows "Incorrect Step".
  - **Teaching Board**: The blackboard highlights the correction (e.g., "10 divided by 2 is 5, not 6") and provides a concept reminder about division.

### 5. Conclusion
- "Sese is a true multimodal agent. It reasons over live visual input, generates structured teaching content on its own board, and provides emotional support through the Panda persona."
- Highlight the architecture: "The capture logic is modular, allowing us to easily upgrade to automatic background frame sampling in the future."
