# ✨ GlowMint Muse

**GlowMint Muse** is an AI-Native Creative Platform where user vision meets the power of Google's Gemini and Imagen ecosystem. It is designed to be a co-pilot for creativity, handling everything from initial brainstorming to high-fidelity image generation and semantic editing.

Built exclusively with the **Google GenAI SDK**, it showcases the seamless integration of multimodal AI models.

## ⚠️ Security & Architecture Warning

**IMPORTANT: Client-Side Prototype**

This application acts as a frontend-only prototype. It initializes the Google GenAI SDK directly in the browser using the API Key (`process.env.API_KEY`).

-   **Do NOT deploy this code to a public production URL** without modification.
-   Exposing your API key client-side allows malicious actors to extract it and consume your API quota.
-   **Production Recommendation**: For a production deployment, you must move the logic in `services/geminiService.ts` to a secure backend server (Node.js, Python, Go) and proxy requests from the frontend.

## 🚀 Key Features

### 🧠 Gemini Muse (Creative Chat)
The heart of the ideation process.
- **Conversational Brainstorming**: Chat with a specialized Gemini agent to refine abstract ideas into concrete visual descriptions.
- **Voice Input 🎙️**: Speak your ideas directly to the Muse.
- **Prompt Engineering**: The Muse automatically optimizes your natural language into technical image generation prompts.
- **Suggestion Chips**: Quick-start creative concepts to get the ball rolling.

### 🎨 Powerful Image Generation
Leveraging Google's latest models via Vertex AI / Gemini API.
- **Dual Model Support**:
  - `gemini-2.5-flash-image`: Fast, efficient generation for rapid iteration.
  - `gemini-3-pro-image-preview`: High-fidelity, photorealistic generation (supports up to 2K resolution).
- **Aspect Ratio Control**: Square (1:1), Portrait (3:4, 9:16), and Landscape (4:3, 16:9).
- **Negative Prompting**: Exclude unwanted elements from your compositions.

### 🪄 Multimodal Editing & Refinement
- **Magic Edit (Semantic Inpainting)**: Refine existing images using natural language instructions (e.g., "Change the background to a sunset", "Add a hat").
- **Gemini Critique Loop**: The **Gemini Vision** model analyzes generated images to provide stylistic tags and constructive critiques on composition or anatomy.

### 🗂️ Studio Workflow
- **History Navigation**: Undo (↩️) and Redo (↪️) functionality to traverse your creative session.
- **Prompt Sync**: navigating history automatically restores the prompt used for that image.
- **Download**: Export your creations in high quality.
- **Responsive UI**: A beautiful "Midnight Mint" dark theme built with Tailwind CSS.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI SDK**: `@google/genai` (Google GenAI SDK)
- **Models Used**:
  - Text/Chat: `gemini-2.5-flash`
  - Image Generation: `gemini-2.5-flash-image`, `gemini-3-pro-image-preview`
  - Vision/Analysis: `gemini-2.5-flash`

## 📦 Setup & Requirements

1.  **API Key**: This application requires a valid Google Cloud API Key.
    - Note: To use `gemini-3-pro-image-preview` and video generation features, the API key must be associated with a **billed Google Cloud Project**.
2.  **Environment**: The app expects the API key to be available via `process.env.API_KEY` or selected via the AI Studio standard key selector integration.

## 📝 License

This project is a demonstration of the Google GenAI SDK capabilities.