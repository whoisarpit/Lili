import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Info, Sparkles } from "lucide-react";
import {
  ChatMessage as ChatMessageType,
  HistoryMessage,
  getMandarinResponse,
  getSpeech,
} from "./lib/gemini";
import { ChatInput } from "./components/ChatInput";
import { ChatMessageBubble } from "./components/ChatMessage";

type Message = {
  role: "user" | "model";
  content: string | ChatMessageType;
  timestamp: number;
};

const QUICK_PROMPTS = [
  "Say Hello",
  "Introduce yourself",
  "Ask for numbers 1-10",
] as const;

const INITIAL_MESSAGE: Message = {
  role: "model",
  content: {
    lesson_title: "Welcome to Mandarin",
    content: [
      {
        type: "text",
        text: "Hello! I'm Lǐli, your Mandarin teacher. I'm so excited to help you start your journey into Chinese.",
      },
      {
        type: "phrase",
        phrase: {
          chinese: "你好！",
          pinyin: "Nǐ hǎo!",
          english: "Hello!",
        },
      },
      {
        type: "text",
        text: "In our lessons, I'll explain things in English and give you phrases to practice. What would you like to learn today?",
      },
    ],
  },
  timestamp: Date.now(),
};

function toHistory(messages: Message[]): HistoryMessage[] {
  return messages.map((msg) => ({
    role: msg.role,
    parts: [
      {
        text:
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
      },
    ],
  }));
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([INITIAL_MESSAGE]);
  const requestCounterRef = useRef(0);
  const chatAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      chatAbortRef.current?.abort();
    };
  }, []);

  const hasUserMessage = useMemo(
    () => messages.some((message) => message.role === "user"),
    [messages],
  );

  const handlePlaySpeech = async (text: string) => {
    const { url, error } = await getSpeech(text);

    if (url) {
      const audio = new Audio(url);
      await audio.play();
      setGlobalError(null);
      return;
    }

    if (error === "MISSING_API_KEY") {
      setGlobalError(
        "Server is missing the Gemini API key. Set GEMINI_API_KEY and restart the API process.",
      );
      return;
    }

    if (error === "QUOTA_EXCEEDED") {
      setGlobalError(
        "Gemini TTS quota exceeded. Audio might be unavailable for a while, but your lesson can continue in text.",
      );
    }
  };

  const handleSend = async (text: string) => {
    const messageText = text.trim();
    if (!messageText || isLoading) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };

    const nextMessages = [...messagesRef.current, userMessage];
    setMessages(nextMessages);
    setIsLoading(true);
    setGlobalError(null);

    chatAbortRef.current?.abort();
    const abortController = new AbortController();
    chatAbortRef.current = abortController;

    const requestId = requestCounterRef.current + 1;
    requestCounterRef.current = requestId;

    try {
      const response = await getMandarinResponse(
        messageText,
        toHistory(nextMessages.slice(0, -1)),
        abortController.signal,
      );

      if (requestCounterRef.current !== requestId) {
        return;
      }

      if (response.error === "MISSING_API_KEY") {
        setGlobalError(
          "Server is missing the Gemini API key. Set GEMINI_API_KEY and restart the API process.",
        );
      }

      const modelMessage: Message = {
        role: "model",
        content: response,
        timestamp: Date.now(),
      };

      setMessages((current) => [...current, modelMessage]);

      const firstPhrase = response.content.find(
        (item) => item.type === "phrase",
      )?.phrase;
      if (firstPhrase) {
        handlePlaySpeech(firstPhrase.chinese).catch(() => {
          setGlobalError("Audio playback failed in this browser session.");
        });
      }
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        return;
      }

      setGlobalError("Request failed. Check your API server and try again.");
      console.error("Chat error:", error);
    } finally {
      if (requestCounterRef.current === requestId) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="app-header"
      >
        <div className="brand-wrap">
          <div className="brand-badge">莉</div>
          <div>
            <h1 className="brand-name">Lǐli (莉莉)</h1>
            <p className="brand-meta">ONLINE • HSK 1 STUDIO</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            aria-label="App info"
            className="icon-button"
            onClick={() =>
              setGlobalError(
                "Lǐli is tuned for beginner Mandarin conversation and phrase practice.",
              )
            }
          >
            <Info size={16} />
          </button>
          <div className="powered-pill">
            <Sparkles size={13} />
            <span>AI Powered</span>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="global-banner"
          >
            <div className="global-banner-copy">
              <Info size={14} />
              <span>{globalError}</span>
            </div>
            <button
              type="button"
              onClick={() => setGlobalError(null)}
              className="dismiss-button"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="chat-main custom-scrollbar">
        <div className="chat-content">
          <AnimatePresence initial={false}>
            {!hasUserMessage && (
              <motion.section
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="intro-zone"
              >
                <p className="intro-overline">Mandarin Coaching</p>
                <h2 className="intro-title">
                  Begin with one phrase and build rhythm.
                </h2>
                <p className="intro-copy">
                  Ask anything in English or Mandarin. Lǐli answers in compact
                  mini-lessons with characters, pinyin, and pronunciation.
                </p>
                <div className="prompt-row">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSend(prompt)}
                      className="prompt-chip"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {hasUserMessage && (
            <section className="compact-prompts" aria-label="Quick prompts">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSend(prompt)}
                  className="prompt-chip compact"
                >
                  {prompt}
                </button>
              ))}
            </section>
          )}

          <div className="messages-wrap">
            {messages.map((message, index) => (
              <ChatMessageBubble
                key={`${message.timestamp}-${index}`}
                message={message}
                onPlaySpeech={handlePlaySpeech}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </main>

      <footer className="chat-footer">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </footer>
    </div>
  );
}
