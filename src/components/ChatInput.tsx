import { Loader2, Send } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/src/lib/utils";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) {
      return;
    }

    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [input]);

  return (
    <div className="input-shell">
      <form onSubmit={handleSubmit} className="input-form">
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          disabled={disabled}
          aria-label="Message Lǐli"
          placeholder="Type in Mandarin or English..."
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          className="input-textarea"
        />
        <button
          type="submit"
          aria-label={disabled ? "Sending message" : "Send message"}
          disabled={disabled || !input.trim()}
          className={cn("send-button", input.trim() && !disabled && "ready")}
        >
          {disabled ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
      <p className="input-caption">Shift + Enter for a new line</p>
    </div>
  );
}
