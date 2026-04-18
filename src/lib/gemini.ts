import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
}

const SYSTEM_INSTRUCTION = `You are Lǐli, a friendly and professional Mandarin Chinese teacher for HSK 1 beginners. 
Your goal is to provide structured, conversational lessons in English, interleaved with specific Mandarin phrases.

Rules for your responses:
1. Your response should feel like a mini-lesson. Explain grammar, culture, or vocabulary in English.
2. Interleave regular English text with Mandarin phrases.
3. Each Mandarin phrase MUST have the Chinese characters, Pinyin, and English translation.
4. Keep the level appropriate for HSK 1 (basic).
5. Always introduce yourself or greet the student if it's the start of the conversation.
6. Use a mix of explanatory "text" blocks and interactive "phrase" blocks.

JSON Schema:
{
  "lesson_title": "Optional short title for this lesson part",
  "content": [
    { 
      "type": "text", 
      "text": "The English explanation or transitional text" 
    },
    { 
      "type": "phrase", 
      "phrase": {
        "chinese": "你好",
        "pinyin": "Nǐ hǎo",
        "english": "Hello"
      }
    }
  ]
}`;

export async function getMandarinResponse(
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[] = [],
): Promise<ChatMessage & { error?: string }> {
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

    return JSON.parse(response.text || '{"content": []}') as ChatMessage;
  } catch (e: any) {
    console.error("AI Response Error:", e);
    const errorMessage = e?.message || "";
    if (
      errorMessage.includes("429") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      errorMessage.includes("quota")
    ) {
      return {
        lesson_title: "Connection Issue",
        content: [
          {
            type: "text",
            text: "It seems we're in a high-traffic area right now (API Quota Exceeded). Please wait a moment and try again!",
          },
        ],
        error: "QUOTA_EXCEEDED",
      };
    }
    return {
      lesson_title: "Oops!",
      content: [
        {
          type: "text",
          text: "I had a tiny glitch constructing our lesson. Let's try saying that again!",
        },
      ],
      error: "FAILED",
    };
  }
}

function wrapPcmInWav(base64Pcm: string, sampleRate: number = 24000): string {
  const binaryString = atob(base64Pcm);
  const pcmLength = binaryString.length;
  const buffer = new ArrayBuffer(44 + pcmLength);
  const view = new DataView(buffer);

  /* RIFF identifier */
  view.setUint32(0, 0x52494646, false); // "RIFF"
  /* file length */
  view.setUint32(4, 36 + pcmLength, true);
  /* RIFF type */
  view.setUint32(8, 0x57415645, false); // "WAVE"
  /* format chunk identifier */
  view.setUint32(12, 0x666d7420, false); // "fmt "
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  view.setUint32(36, 0x64617461, false); // "data"
  /* data chunk length */
  view.setUint32(40, pcmLength, true);

  // Write PCM data
  const uint8View = new Uint8Array(buffer, 44);
  for (let i = 0; i < pcmLength; i++) {
    uint8View[i] = binaryString.charCodeAt(i);
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function getSpeech(
  text: string,
): Promise<{ url: string | null; error?: string }> {
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
            prebuiltVoiceConfig: { voiceName: "Kore" }, // Kore is a good professional female voice
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const wavBase64 = wrapPcmInWav(base64Audio);
      return { url: `data:audio/wav;base64,${wavBase64}` };
    }
    return { url: null };
  } catch (error: any) {
    console.error("TTS Error:", error);
    const errorMessage = error?.message || "";
    if (
      errorMessage.includes("429") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      errorMessage.includes("quota")
    ) {
      return { url: null, error: "QUOTA_EXCEEDED" };
    }
    return { url: null, error: "FAILED" };
  }
}
