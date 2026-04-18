import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Modality, Type } from "@google/genai";

type ChatHistoryMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

type ChatRequestBody = {
  message?: string;
  history?: ChatHistoryMessage[];
};

type SpeechRequestBody = {
  text?: string;
};

const SYSTEM_INSTRUCTION = `You are Lǐli, a friendly and professional Mandarin Chinese teacher for HSK 1 beginners.
Your goal is to provide structured, conversational lessons in English, interleaved with specific Mandarin phrases.

Rules for your responses:
1. Your response should feel like a mini-lesson. Explain grammar, culture, or vocabulary in English.
2. Interleave regular English text with Mandarin phrases.
3. Each Mandarin phrase MUST have the Chinese characters, Pinyin, and English translation.
4. Keep the level appropriate for HSK 1 (basic).
5. Always introduce yourself or greet the student if it's the start of the conversation.
6. Use a mix of explanatory "text" blocks and interactive "phrase" blocks.`;

const app = express();
app.use(express.json({ limit: "1mb" }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function wrapPcmInWav(base64Pcm: string, sampleRate = 24000): string {
  const binaryString = atob(base64Pcm);
  const pcmLength = binaryString.length;
  const buffer = new ArrayBuffer(44 + pcmLength);
  const view = new DataView(buffer);

  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + pcmLength, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, pcmLength, true);

  const uint8View = new Uint8Array(buffer, 44);
  for (let i = 0; i < pcmLength; i += 1) {
    uint8View[i] = binaryString.charCodeAt(i);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function getApiErrorCode(message: string): "QUOTA_EXCEEDED" | "FAILED" {
  if (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.toLowerCase().includes("quota")
  ) {
    return "QUOTA_EXCEEDED";
  }

  return "FAILED";
}

app.post("/api/chat", async (req, res) => {
  if (!ai) {
    res.status(503).json({ error: "MISSING_API_KEY" });
    return;
  }

  const { message, history = [] } = req.body as ChatRequestBody;
  if (!message?.trim()) {
    res.status(400).json({ error: "INVALID_INPUT" });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lesson_title: { type: Type.STRING },
            content: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["text", "phrase"] },
                  text: { type: Type.STRING },
                  phrase: {
                    type: Type.OBJECT,
                    properties: {
                      chinese: { type: Type.STRING },
                      pinyin: { type: Type.STRING },
                      english: { type: Type.STRING },
                    },
                    required: ["chinese", "pinyin", "english"],
                  },
                },
                required: ["type"],
              },
            },
          },
          required: ["content"],
        },
      },
    });

    res.json(JSON.parse(response.text || '{"content": []}'));
  } catch (error: unknown) {
    const messageText =
      error instanceof Error ? error.message : "Unknown server error";
    const errorCode = getApiErrorCode(messageText);
    res.status(errorCode === "QUOTA_EXCEEDED" ? 429 : 500).json({
      error: errorCode,
      message:
        errorCode === "QUOTA_EXCEEDED"
          ? "Gemini quota exceeded. Please try again shortly."
          : "Failed to generate response.",
    });
  }
});

app.post("/api/speech", async (req, res) => {
  if (!ai) {
    res.status(503).json({ error: "MISSING_API_KEY" });
    return;
  }

  const { text } = req.body as SpeechRequestBody;
  if (!text?.trim()) {
    res.status(400).json({ error: "INVALID_INPUT" });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [
        { parts: [{ text: `Say clearly in a teacher's voice: ${text}` }] },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.status(502).json({ error: "FAILED", message: "No audio returned." });
      return;
    }

    const wavBase64 = wrapPcmInWav(base64Audio);
    res.json({ audioDataUrl: `data:audio/wav;base64,${wavBase64}` });
  } catch (error: unknown) {
    const messageText =
      error instanceof Error ? error.message : "Unknown server error";
    const errorCode = getApiErrorCode(messageText);
    res.status(errorCode === "QUOTA_EXCEEDED" ? 429 : 500).json({
      error: errorCode,
      message:
        errorCode === "QUOTA_EXCEEDED"
          ? "Gemini TTS quota exceeded."
          : "Failed to generate speech.",
    });
  }
});

if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(__dirname, "../dist");
  app.use(express.static(clientDist));
  app.get("*", (_, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`Lili server listening on http://localhost:${port}`);
});
