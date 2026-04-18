import { useState, type FC } from "react";
import { motion } from "motion/react";
import { GraduationCap, Play, User, Volume2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ChatMessage as ChatMessageType } from "@/src/lib/gemini";

type ChatMessageProps = {
  message: {
    role: "user" | "model";
    content: string | ChatMessageType;
  };
  onPlaySpeech?: (text: string) => void | Promise<void>;
};

export const ChatMessageBubble: FC<ChatMessageProps> = ({
  message,
  onPlaySpeech,
}) => {
  const isModel = message.role === "model";
  const [playingStates, setPlayingStates] = useState<Record<number, boolean>>(
    {},
  );

  const handlePlay = async (text: string, index: number) => {
    if (!onPlaySpeech || !isModel) {
      return;
    }

    setPlayingStates((current) => ({ ...current, [index]: true }));
    try {
      await onPlaySpeech(text);
    } finally {
      setPlayingStates((current) => ({ ...current, [index]: false }));
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("message-row", isModel ? "teacher" : "student")}
    >
      <div className={cn("message-avatar", isModel ? "teacher" : "student")}>
        {isModel ? <GraduationCap size={18} /> : <User size={18} />}
      </div>

      <div className="message-content">
        <span className="message-role">{isModel ? "Teacher Lǐli" : "You"}</span>

        {isModel ? (
          <div className="lesson-block">
            {typeof message.content !== "string" &&
              message.content.lesson_title && (
                <h3 className="lesson-title">{message.content.lesson_title}</h3>
              )}

            {typeof message.content !== "string" && (
              <div className="lesson-flow">
                {message.content.content.map((item, idx) => (
                  <motion.div
                    key={`${item.type}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.26 }}
                  >
                    {item.type === "text" ? (
                      <p className="lesson-text">{item.text}</p>
                    ) : (
                      item.phrase && (
                        <div className="phrase-row">
                          <div className="phrase-copy">
                            <span className="phrase-chinese">
                              {item.phrase.chinese}
                            </span>
                            <span className="phrase-pinyin">
                              {item.phrase.pinyin}
                            </span>
                            <span className="phrase-english">
                              {item.phrase.english}
                            </span>
                          </div>
                          <button
                            type="button"
                            aria-label={`Play pronunciation for ${item.phrase.chinese}`}
                            disabled={playingStates[idx]}
                            onClick={() =>
                              handlePlay(item.phrase!.chinese, idx)
                            }
                            className="phrase-play"
                          >
                            {playingStates[idx] ? (
                              <Volume2 size={15} />
                            ) : (
                              <Play size={15} />
                            )}
                          </button>
                        </div>
                      )
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="student-bubble">
            <p>
              {typeof message.content === "string" ? message.content : "..."}
            </p>
          </div>
        )}
      </div>
    </motion.article>
  );
};
