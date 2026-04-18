# Lǐli (莉莉) Mandarin Teacher

Lǐli is a React + TypeScript app for HSK 1 Mandarin practice.
It provides structured mini-lessons with:

- English teaching text
- Mandarin phrases with Chinese, pinyin, and translation
- One-click pronunciation playback

## What changed

- Gemini calls now run through a local server (`/api/chat`, `/api/speech`) so API keys stay server-side.
- Client adds request-ordering safeguards and abort control to avoid stale or out-of-order responses.
- UI refreshed with a calmer studio look, stronger hierarchy, and improved accessibility.

## Tech stack

- React 19 + TypeScript
- Vite 6 + Tailwind CSS 4
- Motion
- Express API server
- Google GenAI SDK (`@google/genai`)

## Project structure

- `src/App.tsx`: chat orchestration, request lifecycle, global messaging
- `src/lib/gemini.ts`: typed client helpers for `/api` endpoints
- `src/components/ChatMessage.tsx`: lesson/phrase rendering and playback controls
- `src/components/ChatInput.tsx`: message input behavior
- `server/index.ts`: Gemini text + TTS API routes

## Local setup

1. Install dependencies:
   `pnpm install`
2. Create a local env file:
   `cp .env.example .env.local`
3. Set your key in `.env.local`:
   `GEMINI_API_KEY=your_key_here`
4. Start app + API server:
   `pnpm dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Scripts

- `pnpm dev`: run API server and Vite dev server
- `pnpm build`: build client bundle
- `pnpm start`: run production API server (serves `dist/` when built)
- `pnpm preview`: preview client bundle only
- `pnpm lint`: TypeScript type-check
