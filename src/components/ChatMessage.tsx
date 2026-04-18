import React, { useState } from "react";
import { motion } from "motion/react";
import { Play, Volume2, User, GraduationCap, Quote } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  ChatMessage as ChatMessageType,
  LessonContent,
} from "@/src/lib/gemini";

interface ChatMessageProps {
  message: {
    role: "user" | "model";
    content: string | ChatMessageType;
  };
  onPlaySpeech?: (text: string) => void | Promise<void>;
  isLatest?: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageProps> = ({
  message,
  onPlaySpeech,
  isLatest,
}) => {
  const isModel = message.role === "model";
  const [playingStates, setPlayingStates] = useState<Record<number, boolean>>(
    {},
  );

  const handlePlay = (text: string, index: number) => {
    if (onPlaySpeech && isModel) {
      setPlayingStates((prev) => ({ ...prev, [index]: true }));
      onPlaySpeech(text);
      setTimeout(
        () => setPlayingStates((prev) => ({ ...prev, [index]: false })),
        2000,
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-4 p-4 transition-colors",
        isModel ? "bg-white/50 border-y border-gray-50/50" : "bg-transparent",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm",
          isModel
            ? "bg-[#FFF4ED] border-[#FFD9C1] text-[#E67E22]"
            : "bg-[#F3E8FF] border-[#E9D5FF] text-[#7C3AED]",
        )}
      >
        {isModel ? <GraduationCap size={20} /> : <User size={20} />}
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-40">
          {isModel ? "Teacher Lǐli" : "You"}
        </span>

        {isModel ? (
          <div className="flex flex-col gap-6">
            {typeof message.content !== "string" &&
              message.content.lesson_title && (
                <h3 className="text-lg font-bold text-gray-900 border-b border-orange-100 pb-2">
                  {message.content.lesson_title}
                </h3>
              )}

            <div className="space-y-6">
              {typeof message.content !== "string" &&
                message.content.content.map((item, idx) => (
                  <div
                    key={idx}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    {item.type === "text" ? (
                      <p className="text-[16px] text-gray-700 leading-relaxed font-normal">
                        {item.text}
                      </p>
                    ) : (
                      item.phrase && (
                        <div className="bg-orange-50/30 rounded-2xl p-4 border border-orange-100/50 hover:bg-orange-50/50 transition-colors group">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col gap-1.5 flex-1">
                              <span className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
                                {item.phrase.chinese}
                              </span>
                              <span className="text-sm font-medium text-[#6B7280] italic font-mono">
                                {item.phrase.pinyin}
                              </span>
                              <div className="mt-2 text-sm text-[#4B5563] border-l-2 border-orange-200 pl-3 py-0.5 font-medium">
                                {item.phrase.english}
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                handlePlay(item.phrase!.chinese, idx)
                              }
                              disabled={playingStates[idx]}
                              className={cn(
                                "p-2.5 rounded-full transition-all group-hover:scale-110 active:scale-95 shadow-sm",
                                playingStates[idx]
                                  ? "bg-[#E67E22] text-white"
                                  : "bg-white text-[#E67E22] hover:bg-orange-100 border border-orange-100",
                              )}
                            >
                              {playingStates[idx] ? (
                                <Volume2 size={16} />
                              ) : (
                                <Play size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="bg-purple-50/30 rounded-2xl p-4 inline-block max-w-[90%]">
            <p className="text-[17px] text-[#374151] leading-relaxed font-medium">
              {typeof message.content === "string" ? message.content : "..."}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
