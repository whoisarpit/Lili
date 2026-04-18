/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChatMessage as ChatMessageType,
  getMandarinResponse,
  getSpeech,
} from "./lib/gemini";
import { ChatMessageBubble } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { Sparkles, Info } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string | ChatMessageType;
  timestamp: number;
}

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

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare history for Gemini
      const history = messages.map((msg) => ({
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

      const response = await getMandarinResponse(text, history);

      const modelMessage: Message = {
        role: "model",
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMessage]);

      // Auto-play TTS for the first phrase found in the new response
      const firstPhrase = response.content.find(
        (item) => item.type === "phrase",
      )?.phrase;
      if (firstPhrase) {
        handlePlaySpeech(firstPhrase.chinese);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [globalError, setGlobalError] = useState<string | null>(null);

  const handlePlaySpeech = async (text: string) => {
    const { url, error } = await getSpeech(text);
    if (url) {
      const audio = new Audio(url);
      audio.play().catch((e) => console.error("Audio playback error:", e));
      setGlobalError(null);
    } else if (error === "QUOTA_EXCEEDED") {
      setGlobalError(
        "Gemini TTS quota exceeded. Audio might be unavailable for a while, but we can continue our lesson in text!",
      );
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#FDFCFB] font-sans">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 px-6 backdrop-blur-md sticky top-0 z-10 transition-all">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-[#E67E22] bg-[#FFF4ED] flex items-center justify-center text-[#E67E22] font-bold">
              莉
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1A1A1A]">Lǐli (莉莉)</h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 rounded uppercase tracking-wider">
                Online
              </span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                • HSK 1 Specialist
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-orange-600 transition-colors rounded-lg hover:bg-orange-50">
            <Info size={18} />
          </button>
          <div className="h-8 w-[1px] bg-gray-100 mx-1"></div>
          <div className="flex items-center gap-1 text-[#E67E22] bg-orange-50 px-3 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} />
            <span>AI Powered</span>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {globalError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-orange-50 border-b border-orange-100 px-6 py-2 flex items-center justify-between gap-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-orange-800 text-[11px] font-medium leading-tight">
              <Info size={14} className="shrink-0" />
              <span>{globalError}</span>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="text-orange-400 hover:text-orange-600 transition-colors uppercase text-[10px] font-bold tracking-wider"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          {/* Welcome Card */}
          <div className="p-6 md:p-10 text-center space-y-4">
            <div className="inline-flex flex-col items-center">
              <span className="text-4xl">🎓</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">
                Start Your Journey
              </h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2">
                Learn Mandarin naturally through conversation. Lǐli will help
                you with characters, pinyin, and pronunciation.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Say Hello", "Introduce yourself", "Ask for numbers 1-10"].map(
                (hint) => (
                  <button
                    key={hint}
                    onClick={() => handleSend(hint)}
                    className="px-4 py-2 rounded-full border border-orange-100 bg-white text-xs font-medium text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm active:scale-95"
                  >
                    {hint}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="flex-1">
            {messages.map((msg, i) => (
              <ChatMessageBubble
                key={`${msg.timestamp}-${i}`}
                message={msg}
                onPlaySpeech={handlePlaySpeech}
                isLatest={i === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </main>

      {/* Footer / Input */}
      <div className="max-w-4xl mx-auto w-full sticky bottom-0">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
