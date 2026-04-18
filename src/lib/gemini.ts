export interface MandarinPhrase {
  chinese: string;
  pinyin: string;
  english: string;
}

export interface LessonContent {
  type: "text" | "phrase";
  text?: string;
  phrase?: MandarinPhrase;
}

export interface ChatMessage {
  lesson_title?: string;
  content: LessonContent[];
  error?: string;
}

export interface HistoryMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

async function parseApiError(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error;
  } catch {
    return undefined;
  }
}

export async function getMandarinResponse(
  message: string,
  history: HistoryMessage[] = [],
  signal?: AbortSignal,
): Promise<ChatMessage> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!response.ok) {
    const error = await parseApiError(response);
    return {
      lesson_title: "Connection Issue",
      content: [
        {
          type: "text",
          text:
            error === "MISSING_API_KEY"
              ? "Server is missing the Gemini API key. Add GEMINI_API_KEY to your environment and restart the API server."
              : error === "QUOTA_EXCEEDED"
                ? "It seems we're in a high-traffic area right now. Please wait a moment and try again."
                : "I had a tiny glitch constructing our lesson. Let's try saying that again!",
        },
      ],
      error,
    };
  }

  return (await response.json()) as ChatMessage;
}

export async function getSpeech(
  text: string,
  signal?: AbortSignal,
): Promise<{ url: string | null; error?: string }> {
  const response = await fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    return { url: null, error: await parseApiError(response) };
  }

  const payload = (await response.json()) as { audioDataUrl?: string };
  return { url: payload.audioDataUrl ?? null };
}
