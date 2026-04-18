# Lǐli (莉莉) Mandarin Teacher

Lǐli is a React + TypeScript web app that teaches beginner Mandarin (HSK 1) through structured conversation.  
Each assistant response is generated as a mini-lesson that mixes:

- English teaching text
- Mandarin phrases with Chinese characters, Pinyin, and translation
- One-click pronunciation playback (TTS)

## What the app does

- Starts each session with an onboarding lesson from Lǐli.
- Accepts user chat input in English or Mandarin.
- Sends user input and chat history to the Gemini model.
- Forces structured JSON responses using a schema.
- Renders lesson cards and phrase blocks in the chat UI.
- Auto-plays pronunciation for the first phrase in each assistant response.
- Lets users replay phrase audio on demand.
- Handles quota/traffic errors gracefully in both chat and TTS flows.

## Tech stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Motion (animations)
- Google GenAI SDK (`@google/genai`)

## Project structure

- `src/App.tsx`: chat orchestration, history handling, loading state, global errors
- `src/lib/gemini.ts`: Gemini text generation + TTS integration and response schema
- `src/components/ChatMessage.tsx`: message/lesson rendering and phrase playback controls
- `src/components/ChatInput.tsx`: textarea input with enter-to-send behavior

## Local setup

1. Install dependencies:
   `pnpm install`
2. Create a local env file:
   `cp .env.example .env.local`
3. Set your Gemini API key in `.env.local`:
   `GEMINI_API_KEY=your_key_here`
4. Start the app:
   `pnpm dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Available scripts

- `pnpm dev`: start local development server
- `pnpm build`: production build
- `pnpm preview`: preview production build
- `pnpm lint`: TypeScript type-check (`tsc --noEmit`)

## Notes

- The app expects `GEMINI_API_KEY` to be present at runtime.
- TTS uses the Gemini preview TTS model and may be rate-limited depending on quota.
